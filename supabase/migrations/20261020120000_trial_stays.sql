begin;
-- Trial-stay credits are contractual records, never refunds, payments or purchase execution.
create table public.bhk_trial_stay_terms (
 property_id text not null references public.bhk_properties(id),version integer not null,
 enabled boolean not null,terms text not null check(length(trim(terms)) between 1 and 6000),
 credit_paise bigint not null check(credit_paise between 0 and 9007199254740991),min_nights integer not null check(min_nights between 1 and 90),
 valid_until timestamptz not null check(isfinite(valid_until)),credit_valid_days integer not null check(credit_valid_days between 1 and 730),
 created_at timestamptz not null default now(),primary key(property_id,version)
);
create table public.bhk_trial_stay_enrollments (
 id uuid primary key default gen_random_uuid(),booking_id uuid not null unique references public.bhk_bookings(id),
 property_id text not null,terms_version integer not null,buyer_id uuid not null references auth.users(id),
 offer_id uuid references public.bhk_sales_offers(id),enquiry_id uuid references public.bhk_viewing_requests(id),
 created_at timestamptz not null default now(),foreign key(property_id,terms_version) references public.bhk_trial_stay_terms(property_id,version),
 check((offer_id is not null)::integer+(enquiry_id is not null)::integer=1)
);
create table public.bhk_trial_stay_credits (
 id uuid primary key default gen_random_uuid(),enrollment_id uuid not null unique references public.bhk_trial_stay_enrollments(id),
 booking_id uuid not null unique references public.bhk_bookings(id),property_id text not null references public.bhk_properties(id),
 buyer_id uuid not null references auth.users(id),approved_by uuid not null references auth.users(id),
 amount_paise bigint not null check(amount_paise between 1 and 9007199254740991),currency text not null default 'INR' check(currency='INR'),
 expires_at timestamptz not null,status text not null default 'approved' check(status in ('approved','applied','reversed')),
 applied_offer_id uuid references public.bhk_sales_offers(id),applied_at timestamptz,created_at timestamptz not null default now()
);
create table public.bhk_trial_stay_credit_events (
 id uuid primary key default gen_random_uuid(),credit_id uuid not null references public.bhk_trial_stay_credits(id),
 actor_id uuid not null references auth.users(id),action text not null check(action in ('approved','applied','reversed')),
 reason text not null check(length(trim(reason)) between 1 and 2000),created_at timestamptz not null default now(),unique(credit_id,action)
);
create index bhk_trial_enrollments_buyer on public.bhk_trial_stay_enrollments(buyer_id);
create index bhk_trial_credits_buyer on public.bhk_trial_stay_credits(buyer_id,expires_at);
alter table public.bhk_trial_stay_terms enable row level security;
alter table public.bhk_trial_stay_enrollments enable row level security;
alter table public.bhk_trial_stay_credits enable row level security;
alter table public.bhk_trial_stay_credit_events enable row level security;
revoke all on public.bhk_trial_stay_terms,public.bhk_trial_stay_enrollments,public.bhk_trial_stay_credits,public.bhk_trial_stay_credit_events from anon,authenticated;
grant select on public.bhk_trial_stay_terms to anon,authenticated;
grant select on public.bhk_trial_stay_enrollments,public.bhk_trial_stay_credits,public.bhk_trial_stay_credit_events to authenticated;
grant all on public.bhk_trial_stay_terms,public.bhk_trial_stay_enrollments,public.bhk_trial_stay_credits,public.bhk_trial_stay_credit_events to service_role;
create policy trial_terms_public on public.bhk_trial_stay_terms for select to anon,authenticated using(exists(select 1 from bhk_public_properties p where p.id=property_id));
create policy trial_terms_owner on public.bhk_trial_stay_terms for select to authenticated using(exists(select 1 from bhk_properties p where p.id=property_id and p.host_id=auth.uid()));
create policy trial_terms_enrolled_buyer on public.bhk_trial_stay_terms for select to authenticated using(exists(select 1 from bhk_trial_stay_enrollments e where e.property_id=bhk_trial_stay_terms.property_id and e.terms_version=bhk_trial_stay_terms.version and e.buyer_id=auth.uid()));
create policy trial_enrollment_participant on public.bhk_trial_stay_enrollments for select to authenticated using(buyer_id=auth.uid() or exists(select 1 from bhk_properties p where p.id=property_id and p.host_id=auth.uid()));
create policy trial_credit_participant on public.bhk_trial_stay_credits for select to authenticated using(buyer_id=auth.uid() or exists(select 1 from bhk_properties p where p.id=property_id and p.host_id=auth.uid()));
create policy trial_credit_event_participant on public.bhk_trial_stay_credit_events for select to authenticated using(exists(select 1 from bhk_trial_stay_credits c where c.id=credit_id));

create function public.bhk_set_trial_stay_terms(p_property text,p_version integer,p_enabled boolean,p_terms text,p_credit bigint,p_min_nights integer,p_valid_until timestamptz,p_credit_days integer) returns integer language plpgsql security definer set search_path=public as $$
declare v_version integer;
begin
 perform 1 from bhk_properties where id=p_property and host_id=auth.uid() and is_for_sale=true for update;
 if not found then raise exception 'Owned sale property unavailable'; end if;
 select coalesce(max(version),0) into v_version from bhk_trial_stay_terms where property_id=p_property;
 if p_version is distinct from v_version then raise exception 'Trial terms changed; reload before saving'; end if;
 if p_valid_until<=now() then raise exception 'Choose a future terms expiry'; end if;
 insert into bhk_trial_stay_terms(property_id,version,enabled,terms,credit_paise,min_nights,valid_until,credit_valid_days) values(p_property,v_version+1,p_enabled,trim(p_terms),p_credit,p_min_nights,p_valid_until,p_credit_days);
 return v_version+1;
end $$;
create function public.bhk_enroll_trial_stay(p_booking uuid,p_terms_version integer,p_offer uuid default null,p_enquiry uuid default null) returns uuid language plpgsql security definer set search_path=public as $$
declare b bhk_bookings;t bhk_trial_stay_terms;v_id uuid;
begin
 select * into b from bhk_bookings where id=p_booking and guest_id=auth.uid() for update;
 if not found or b.payment_status<>'paid' or b.status not in ('confirmed','completed') or b.refund_status<>'none' then raise exception 'Own paid stay required'; end if;
 perform 1 from bhk_properties where id=b.property_id and host_id=b.host_id and status='published' and is_for_sale=true for share;
 if not found then raise exception 'Sale property unavailable'; end if;
 select * into t from bhk_trial_stay_terms where property_id=b.property_id order by version desc limit 1;
 if not found or t.version is distinct from p_terms_version or not t.enabled or t.valid_until<=now() or b.created_at<t.created_at or b.check_out-b.check_in<t.min_nights then raise exception 'Stay does not meet the current agreed trial terms'; end if;
 if p_offer is not null and not exists(select 1 from bhk_sales_offers where id=p_offer and buyer_id=auth.uid() and property_id=b.property_id and seller_id=b.host_id and status in ('submitted','accepted')) then raise exception 'Own offer for this property required'; end if;
 if p_enquiry is not null and not exists(select 1 from bhk_viewing_requests where id=p_enquiry and user_id=auth.uid() and property_id=b.property_id and status<>'cancelled') then raise exception 'Own enquiry for this property required'; end if;
 insert into bhk_trial_stay_enrollments(booking_id,property_id,terms_version,buyer_id,offer_id,enquiry_id) values(b.id,b.property_id,t.version,auth.uid(),p_offer,p_enquiry) returning id into v_id;
 return v_id;
end $$;
create function public.bhk_approve_trial_credit(p_enrollment uuid,p_reason text) returns uuid language plpgsql security definer set search_path=public as $$
declare e bhk_trial_stay_enrollments;b bhk_bookings;t bhk_trial_stay_terms;v_id uuid;
begin
 select * into e from bhk_trial_stay_enrollments where id=p_enrollment;
 if not found then raise exception 'Trial enrollment unavailable'; end if;
 perform 1 from bhk_properties where id=e.property_id and host_id=auth.uid() for update;
 if not found then raise exception 'Current owner required'; end if;
 select * into b from bhk_bookings where id=e.booking_id for update;
 if b.host_id<>auth.uid() or b.guest_id<>e.buyer_id or b.status<>'completed' or b.payment_status<>'paid' or b.refund_status<>'none' then raise exception 'Completed paid stay without refunds required'; end if;
 select * into t from bhk_trial_stay_terms where property_id=e.property_id and version=e.terms_version;
 if t.credit_paise<=0 or t.credit_paise>b.total::numeric*100 then raise exception 'Agreed credit must be positive and no larger than paid stay total'; end if;
 insert into bhk_trial_stay_credits(enrollment_id,booking_id,property_id,buyer_id,approved_by,amount_paise,expires_at) values(e.id,b.id,e.property_id,e.buyer_id,auth.uid(),t.credit_paise,now()+make_interval(days=>t.credit_valid_days)) returning id into v_id;
 insert into bhk_trial_stay_credit_events(credit_id,actor_id,action,reason) values(v_id,auth.uid(),'approved',trim(p_reason));
 return v_id;
end $$;
create function public.bhk_apply_trial_credit(p_credit uuid,p_offer uuid,p_reason text) returns void language plpgsql security definer set search_path=public as $$
declare c bhk_trial_stay_credits;o bhk_sales_offers;v_price bigint;
begin
 select * into c from bhk_trial_stay_credits where id=p_credit for update;
 if not found then raise exception 'Credit unavailable'; end if;
 perform 1 from bhk_properties where id=c.property_id and host_id=auth.uid() for update;
 if auth.uid() is null or not found then raise exception 'Current owner must acknowledge credit application'; end if;
 if c.status<>'approved' or c.expires_at<=now() then raise exception 'Credit is expired or already used'; end if;
 perform 1 from bhk_bookings where id=c.booking_id and status='completed' and payment_status='paid' and refund_status='none' for update;
 if not found then raise exception 'Stay eligibility changed'; end if;
 select * into o from bhk_sales_offers where id=p_offer for update;
 if not found or o.status<>'accepted' or o.buyer_id<>c.buyer_id or o.property_id<>c.property_id or o.seller_id<>auth.uid() then raise exception 'Accepted offer for the same buyer and property required'; end if;
 select price_paise into v_price from bhk_sales_offer_revisions where offer_id=o.id and revision=o.version;
 if c.amount_paise+coalesce((select sum(amount_paise) from bhk_trial_stay_credits where applied_offer_id=o.id and status='applied'),0)>v_price then raise exception 'Credits exceed the accepted offer'; end if;
 update bhk_trial_stay_credits set status='applied',applied_offer_id=o.id,applied_at=now() where id=c.id;
 insert into bhk_trial_stay_credit_events(credit_id,actor_id,action,reason) values(c.id,auth.uid(),'applied',trim(p_reason));
end $$;
create function public.bhk_reverse_trial_credit(p_credit uuid,p_reason text) returns void language plpgsql security definer set search_path=public as $$
declare c bhk_trial_stay_credits;
begin
 select * into c from bhk_trial_stay_credits where id=p_credit for update;
 if not found or not exists(select 1 from bhk_properties where id=c.property_id and host_id=auth.uid()) then raise exception 'Credit unavailable'; end if;
 if c.status='reversed' then raise exception 'Credit already reversed'; end if;
 update bhk_trial_stay_credits set status='reversed' where id=c.id;
 insert into bhk_trial_stay_credit_events(credit_id,actor_id,action,reason) values(c.id,auth.uid(),'reversed',trim(p_reason));
 -- Reversal is terminal: never issue another credit for the same booking.
end $$;
revoke all on function public.bhk_set_trial_stay_terms(text,integer,boolean,text,bigint,integer,timestamptz,integer),public.bhk_enroll_trial_stay(uuid,integer,uuid,uuid),public.bhk_approve_trial_credit(uuid,text),public.bhk_apply_trial_credit(uuid,uuid,text),public.bhk_reverse_trial_credit(uuid,text) from public,anon,authenticated;
grant execute on function public.bhk_set_trial_stay_terms(text,integer,boolean,text,bigint,integer,timestamptz,integer),public.bhk_enroll_trial_stay(uuid,integer,uuid,uuid),public.bhk_approve_trial_credit(uuid,text),public.bhk_apply_trial_credit(uuid,uuid,text),public.bhk_reverse_trial_credit(uuid,text) to authenticated;
commit;
