import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import fs from "node:fs/promises";
import path from "node:path";

/** Real PostgreSQL execution with a minimal local model of Supabase auth/storage. */
export async function migratedDatabase() {
  const db = new PGlite({ extensions: { btree_gist, pgcrypto } });
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, email text, phone text, raw_user_meta_data jsonb default '{}', email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role',true),'') $$;
    grant usage on schema public,auth,storage to anon,authenticated,service_role;
    grant execute on all functions in schema auth to anon,authenticated,service_role;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to anon,authenticated,service_role;
    create function storage.foldername(value text) returns text[] language sql immutable as $$ select (string_to_array(value,'/'))[1:greatest(cardinality(string_to_array(value,'/'))-1,0)] $$;
    grant execute on all functions in schema storage to anon,authenticated,service_role;
    alter default privileges in schema public grant all on tables to service_role;
    alter default privileges in schema public grant all on sequences to service_role;
  `);
  const dir = path.resolve("supabase/migrations");
  for (const name of (await fs.readdir(dir)).filter(name => name.endsWith(".sql")).sort()) {
    try { await db.exec(await fs.readFile(path.join(dir, name), "utf8")); }
    catch (error) { await db.close(); throw new Error(`Migration ${name} failed: ${error.message}`, { cause: error }); }
  }
  return db;
}

export async function asRole(db, role, userId, action) {
  await db.exec(`set role ${role};`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role',$2,false)", [userId ?? "", role]);
  try { return await action(); }
  finally { await db.exec("reset role;"); await db.query("select set_config('request.jwt.claim.sub','',false),set_config('request.jwt.claim.role','',false)"); }
}
