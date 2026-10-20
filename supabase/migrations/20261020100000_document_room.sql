begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('sale-documents','sale-documents',false,15728640,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
create policy sale_document_upload on storage.objects for insert to authenticated
with check(bucket_id='sale-documents' and (storage.foldername(name))[1]=auth.uid()::text);
-- There is deliberately no client storage read/update/delete policy: every download is authorized and logged.
create table public.bhk_sale_documents(
  id uuid primary key default gen_random_uuid(),
  property_id text not null references bhk_properties(id),
  owner_id uuid not null references auth.users(id),
  label text not null check(length(trim(label)) between 1 and 160),
  created_at timestamptz not null default now()
);
create table public.bhk_sale_document_versions(
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references bhk_sale_documents(id),
  version integer not null check(version>0),
  storage_path text not null unique,
  file_name text not null check(length(file_name) between 1 and 200),
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  unique(document_id,version)
);
create table public.bhk_sale_document_grants(
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references bhk_sale_document_versions(id),
  recipient_id uuid not null references auth.users(id),
  expires_at timestamptz not null check(isfinite(expires_at)),
  allow_download boolean not null default false,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.bhk_sale_document_access(
  id uuid primary key default gen_random_uuid(), version_id uuid not null references bhk_sale_document_versions(id),
  actor_id uuid not null references auth.users(id), action text not null check(action in ('view','download')),
  created_at timestamptz not null default now()
);
alter table bhk_sale_documents enable row level security;
alter table bhk_sale_document_versions enable row level security;
alter table bhk_sale_document_grants enable row level security;
alter table bhk_sale_document_access enable row level security;
grant select on bhk_sale_documents,bhk_sale_document_versions,bhk_sale_document_grants,bhk_sale_document_access to authenticated;
grant all on bhk_sale_documents,bhk_sale_document_versions,bhk_sale_document_grants,bhk_sale_document_access to service_role;
create function public.bhk_owns_sale_document(p_document uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from bhk_sale_documents d join bhk_properties p on p.id=d.property_id
 where d.id=p_document and d.owner_id=auth.uid() and p.host_id=auth.uid())
$$;
create policy sale_documents_owner on bhk_sale_documents for select to authenticated using(bhk_owns_sale_document(id));
create policy sale_document_versions_owner on bhk_sale_document_versions for select to authenticated using(bhk_owns_sale_document(document_id));
create policy sale_document_grants_participant on bhk_sale_document_grants for select to authenticated
using(recipient_id=auth.uid() or exists(select 1 from bhk_sale_document_versions v where v.id=version_id and bhk_owns_sale_document(v.document_id)));
create policy sale_document_access_owner on bhk_sale_document_access for select to authenticated
using(exists(select 1 from bhk_sale_document_versions v where v.id=version_id and bhk_owns_sale_document(v.document_id)));
create function public.bhk_add_sale_document_version(p_property text,p_document uuid,p_label text,p_path text,p_filename text) returns uuid
language plpgsql security definer set search_path=public as $$
declare doc uuid:=p_document; result uuid; next_version integer;
begin
  perform 1 from bhk_properties where id=p_property and host_id=auth.uid() for update;
  if not found then raise exception 'Only the current owner can add documents'; end if;
  if p_path not like auth.uid()::text||'/%' or not exists(select 1 from storage.objects where bucket_id='sale-documents' and name=p_path) then raise exception 'Upload a private document first'; end if;
  if doc is null then
    insert into bhk_sale_documents(property_id,owner_id,label) values(p_property,auth.uid(),p_label) returning id into doc;
  elsif not exists(select 1 from bhk_sale_documents where id=doc and property_id=p_property and owner_id=auth.uid()) then
    raise exception 'Document unavailable';
  end if;
  select coalesce(max(version),0)+1 into next_version from bhk_sale_document_versions where document_id=doc;
  insert into bhk_sale_document_versions(document_id,version,storage_path,file_name) values(doc,next_version,p_path,p_filename) returning id into result;
  return result;
end $$;
create function public.bhk_grant_sale_document(p_version uuid,p_recipient uuid,p_expiry timestamptz,p_download boolean default false) returns uuid
language plpgsql security definer set search_path=public as $$
declare result uuid;
begin
  perform 1 from bhk_sale_document_versions v where v.id=p_version and v.withdrawn_at is null and bhk_owns_sale_document(v.document_id) for update;
  if not found then raise exception 'Document unavailable'; end if;
  if p_expiry is null or p_expiry<=now() or p_expiry>now()+interval '90 days' then raise exception 'Grant expiry must be within 90 days'; end if;
  insert into bhk_sale_document_grants(version_id,recipient_id,expires_at,allow_download)
    values(p_version,p_recipient,p_expiry,p_download) returning id into result;
  return result;
end $$;
create function public.bhk_withdraw_sale_document(p_version uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  update bhk_sale_document_versions v set withdrawn_at=coalesce(withdrawn_at,now())
  where v.id=p_version and bhk_owns_sale_document(v.document_id);
  if not found then raise exception 'Document unavailable'; end if;
end $$;
create function public.bhk_revoke_sale_document_grant(p_grant uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  update bhk_sale_document_grants g set revoked_at=coalesce(revoked_at,now()) where g.id=p_grant and exists(
    select 1 from bhk_sale_document_versions v where v.id=g.version_id and bhk_owns_sale_document(v.document_id));
  if not found then raise exception 'Grant unavailable'; end if;
end $$;
-- Only trusted authenticated API calls may supply an actor and retrieve a private storage path.
create function public.bhk_access_sale_document(p_actor uuid,p_version uuid,p_action text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare version_row bhk_sale_document_versions; doc bhk_sale_documents; current_owner uuid;
begin
  if p_actor is null or p_action not in ('view','download') or p_action is null then raise exception 'Document unavailable'; end if;
  select * into version_row from bhk_sale_document_versions where id=p_version and withdrawn_at is null for share;
  if not found then raise exception 'Document unavailable'; end if;
  select * into doc from bhk_sale_documents where id=version_row.document_id;
  select host_id into current_owner from bhk_properties where id=doc.property_id;
  if current_owner is distinct from doc.owner_id then raise exception 'Document unavailable'; end if;
  if p_actor<>current_owner and not exists(select 1 from bhk_sale_document_grants g where g.version_id=p_version
    and g.recipient_id=p_actor and g.revoked_at is null and g.expires_at>now()
    and (p_action='view' or g.allow_download)) then raise exception 'Document unavailable'; end if;
  insert into bhk_sale_document_access(version_id,actor_id,action) values(p_version,p_actor,p_action);
  return jsonb_build_object('path',version_row.storage_path,'fileName',version_row.file_name,'version',version_row.version);
end $$;
revoke all on function bhk_owns_sale_document(uuid),bhk_add_sale_document_version(text,uuid,text,text,text),bhk_grant_sale_document(uuid,uuid,timestamptz,boolean),bhk_withdraw_sale_document(uuid),bhk_revoke_sale_document_grant(uuid),bhk_access_sale_document(uuid,uuid,text) from public,anon,authenticated;
grant execute on function bhk_owns_sale_document(uuid),bhk_add_sale_document_version(text,uuid,text,text,text),bhk_grant_sale_document(uuid,uuid,timestamptz,boolean),bhk_withdraw_sale_document(uuid),bhk_revoke_sale_document_grant(uuid) to authenticated;
grant execute on function bhk_access_sale_document(uuid,uuid,text) to service_role;
commit;
