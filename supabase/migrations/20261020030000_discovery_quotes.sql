-- Read-only quote helper shared by discovery and reservation preparation.
create function public.bhk_stay_quote(p_property text,p_check_in date,p_check_out date,p_adults integer,p_children integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare p bhk_properties; stay_total bigint; fee bigint; tax bigint; total_amount bigint;
begin
  select * into p from bhk_properties where id=p_property and status='published' and bedrooms>=3;
  if not found then raise exception 'Property is unavailable'; end if;
  if p_check_in is null or p_check_out is null or p_check_in<(now() at time zone 'Asia/Kolkata')::date
    or p_check_out<=p_check_in or p_check_out-p_check_in<greatest(p.min_stay,1) or p_check_out-p_check_in>90 then raise exception 'Invalid stay dates'; end if;
  if p_adults is null or p_children is null or p_adults<1 or p_children<0 or p_adults::bigint+p_children>p.guests then raise exception 'Guest capacity exceeded'; end if;
  if p.price<=0 or p.cleaning<0 or p.deposit<0 then raise exception 'Property pricing is unavailable'; end if;
  if exists(select 1 from unnest(p.blocked_dates) d where d>=p_check_in and d<p_check_out) then raise exception 'Dates include a host closure'; end if;
  if exists(select 1 from bhk_bookings where property_id=p_property and status<>'cancelled'
    and (status<>'awaiting' or hold_expires_at is null or hold_expires_at>now())
    and stay && daterange(p_check_in,p_check_out,'[)')) then raise exception 'Dates are already reserved'; end if;
  select sum(coalesce((select nightly_price from bhk_property_rates r where r.property_id=p.id and d::date>=r.start_date and d::date<r.end_date),
    case when extract(isodow from d) in (6,7) then p.weekend_price end,p.price))
    into stay_total from generate_series(p_check_in::timestamp,(p_check_out-1)::timestamp,interval '1 day') d;
  fee:=round(stay_total*p.platform_fee_rate); tax:=round((stay_total+p.cleaning+fee)*p.tax_rate);
  total_amount:=stay_total+p.cleaning+fee+tax+p.deposit;
  if total_amount>2000000000 then raise exception 'Quote exceeds booking limit'; end if;
  return jsonb_build_object('stay',stay_total,'cleaning',p.cleaning,'platformFee',fee,'tax',tax,'deposit',p.deposit,
    'total',total_amount,'nights',p_check_out-p_check_in,'taxRate',p.tax_rate);
end;
$$;
revoke all on function public.bhk_stay_quote(text,date,date,integer,integer) from public, anon, authenticated;
grant execute on function public.bhk_stay_quote(text,date,date,integer,integer) to service_role;

create function public.bhk_discovery_quotes(p_properties text[],p_check_in date,p_check_out date,p_adults integer,p_children integer,p_flex integer default 0)
returns jsonb language plpgsql security definer set search_path=public as $$
declare property text; shift integer; quote jsonb; results jsonb:='[]'; item jsonb;
begin
  if cardinality(p_properties) is null or cardinality(p_properties) not between 1 and 4 or array_position(p_properties,null) is not null
    or p_flex is null or p_flex not between 0 and 3 then raise exception 'Choose 1-4 listings and at most 3 flexible days'; end if;
  foreach property in array p_properties loop
    for shift in -p_flex..p_flex loop
      item:=jsonb_build_object('propertyId',property,'checkIn',p_check_in+shift,'checkOut',p_check_out+shift,'offsetDays',shift);
      begin
        quote:=bhk_stay_quote(property,p_check_in+shift,p_check_out+shift,p_adults,p_children);
        item:=item||jsonb_build_object('available',true,'currency','INR','nights',quote->'nights',
          'stayPaise',(quote->>'stay')::bigint*100,'cleaningPaise',(quote->>'cleaning')::bigint*100,
          'platformFeePaise',(quote->>'platformFee')::bigint*100,'taxPaise',(quote->>'tax')::bigint*100,
          'depositPaise',(quote->>'deposit')::bigint*100,'totalPaise',(quote->>'total')::bigint*100);
      exception when raise_exception then
        item:=item||jsonb_build_object('available',false,'reason',sqlerrm);
      end;
      results:=results||jsonb_build_array(item);
    end loop;
  end loop;
  return jsonb_build_object('quotes',results,'quotedAt',now(),'reservesInventory',false,'optionalExtrasIncluded',false);
end;
$$;
revoke all on function public.bhk_discovery_quotes(text[],date,date,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.bhk_discovery_quotes(text[],date,date,integer,integer,integer) to service_role;

-- Preserve reservation locking, expired-hold refunds and booking limits while
-- sourcing the same price calculation as comparison.
create or replace function public.bhk_prepare_booking(p_user uuid,p_property text,p_check_in date,p_check_out date,p_adults integer,p_children integer,p_name text,p_email text,p_phone text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare p bhk_properties; b bhk_bookings; old_hold bhk_bookings; quote_value jsonb;
begin
  select * into p from bhk_properties where id=p_property and status='published' and bedrooms>=3 for update;
  if not found then raise exception 'Property is unavailable'; end if;
  if p_name is null or p_email is null or p_phone is null or length(trim(p_name))<2 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or length(regexp_replace(p_phone,'\D','','g'))<10 then raise exception 'Invalid guest details'; end if;
  for old_hold in select * from bhk_bookings where property_id=p_property and status='awaiting' and hold_expires_at<=now() for update loop
    update bhk_bookings set status='cancelled' where id=old_hold.id;
    perform bhk_queue_booking_refunds(old_hold.id,'Expired group funding hold',old_hold.guest_id);
  end loop;
  quote_value:=bhk_stay_quote(p_property,p_check_in,p_check_out,p_adults,p_children);
  if (select count(*) from bhk_bookings where guest_id=p_user and status='awaiting' and hold_expires_at>now())>=3 then raise exception 'Finish or cancel your existing holds first'; end if;
  insert into bhk_bookings(code,property_id,property_name,guest_id,host_id,guest_name,guest_email,guest_phone,check_in,check_out,adults,children,total,status,hold_expires_at,quote)
    values('9B-'||replace(gen_random_uuid()::text,'-',''),p.id,p.name,p_user,p.host_id,trim(p_name),trim(p_email),trim(p_phone),p_check_in,p_check_out,p_adults,p_children,
      (quote_value->>'total')::bigint,'awaiting',now()+interval '30 minutes',quote_value) returning * into b;
  return jsonb_build_object('bookingId',b.id,'bookingCode',b.code,'total',b.total,'holdExpiresAt',b.hold_expires_at,'quote',b.quote);
end;
$$;
