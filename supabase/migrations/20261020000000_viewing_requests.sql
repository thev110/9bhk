begin;
revoke insert on public.bhk_viewing_requests from anon, authenticated;
drop policy if exists bhk_viewing_requests_insert on public.bhk_viewing_requests;
drop policy if exists bhk_viewing_requests_select on public.bhk_viewing_requests;
create policy viewing_request_read on public.bhk_viewing_requests for select to authenticated
using (user_id=auth.uid() or public.bhk_is_staff() or exists(
  select 1 from public.bhk_properties p where p.id=property_id and p.host_id=auth.uid()
));
create function public.bhk_request_viewing(p_property text,p_name text,p_phone text,p_email text default null,p_notes text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare property_name text; request_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to request a viewing.'; end if;
  if nullif(trim(p_name),'') is null or length(p_name)>120 or
     p_phone is null or p_phone !~ '^\+?[0-9 ()-]{7,30}$' or
     length(regexp_replace(p_phone,'[^0-9]','','g'))<7 or
     length(coalesce(p_email,''))>254 or
     (coalesce(p_email,'')<>'' and p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') or
     length(coalesce(p_notes,''))>4000 then raise exception 'Invalid viewing contact details.'; end if;
  -- Serialize requests for this account to enforce the bound even across concurrent calls.
  perform 1 from auth.users where id=auth.uid() for update;
  select p.name into property_name from bhk_properties p where p.id=p_property
    and p.status='published' and p.bedrooms>=3 and p.is_for_sale is true for share;
  if not found then raise exception 'This property is not available for sale enquiries.'; end if;
  if exists(select 1 from bhk_viewing_requests where user_id=auth.uid() and property_id=p_property and status='pending') then
    raise exception 'You already have a pending enquiry for this property.';
  end if;
  if (select count(*) from bhk_viewing_requests where user_id=auth.uid() and created_at>now()-interval '1 hour')>=10 then
    raise exception 'Please wait before sending more enquiries.';
  end if;
  insert into bhk_viewing_requests(property_id,property_name,buyer_name,buyer_phone,buyer_email,user_id,notes)
  values(p_property,property_name,trim(p_name),trim(p_phone),nullif(trim(p_email),''),auth.uid(),p_notes)
  returning id into request_id;
  return request_id;
end; $$;
revoke all on function public.bhk_request_viewing(text,text,text,text,text) from public,anon;
grant execute on function public.bhk_request_viewing(text,text,text,text,text) to authenticated;
commit;
