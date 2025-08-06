-- =================================================================
--  PRISM CONTACTS - PURE POSTGRES SCHEMA (NO SUPABASE DEPENDENCIES)
--  Usage: Run on any PostgreSQL 13+ server. Safe to re-run (idempotent).
--  Notes:
--   - No dependency on Supabase auth schema or auth.uid().
--   - Includes a minimal auth subsystem via public.users for multi-tenant isolation.
--   - Uses a SECURITY DEFINER function current_user_id() tied to a simple session var.
--   - RLS enabled and scoped to current_user_id().
--   - Provides a compatibility layer for local/dev installs outside Supabase.
-- =================================================================

-- ------------------------------
-- Extensions
-- ------------------------------
create extension if not exists "pgcrypto";

-- ------------------------------
-- Minimal Auth Compatibility
-- ------------------------------
-- A lightweight tenant/users table to emulate Supabase auth.users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  full_name text,
  role text default 'user',
  created_at timestamptz not null default timezone('utc'::text, now())
);

comment on table public.users is 'Lightweight users table for non-Supabase environments.';

-- We store per-session user id in a custom GUC to emulate auth.uid().
-- To set the current user in your app/session:
--   select set_config('prism.current_user_id', '00000000-0000-0000-0000-000000000000', false);
-- The third arg "false" sets it for the current transaction only. Use "true" for the whole session.

-- Function: current_user_id() reads this GUC and returns UUID
create or replace function public.current_user_id()
returns uuid
stable
language plpgsql
security definer
as $$
declare
  v text;
begin
  v := current_setting('prism.current_user_id', true);
  if v is null or v = '' then
    -- Fallback: you may return null or raise an exception to enforce tenancy selection
    -- Here we raise to avoid accidental cross-tenant access
    raise exception 'prism.current_user_id is not set. Call set_config(...) before queries.';
  end if;
  return v::uuid;
end;
$$;

comment on function public.current_user_id() is
'Returns UUID of current logical user from GUC prism.current_user_id. Set via set_config in your app.';

-- Helper to set current user id easily (optional)
create or replace function public.set_current_user_id(p_user_id uuid, p_is_session boolean default true)
returns void
language sql
as $$
  select set_config('prism.current_user_id', p_user_id::text, p_is_session);
$$;

-- ------------------------------
-- Helper Functions
-- ------------------------------
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- ------------------------------
-- Core Tables
-- ------------------------------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  gender text check (gender in ('male','female','other','not_specified')) default 'not_specified',
  role varchar(255),
  company text,
  address text,
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);
comment on table public.contacts is 'Main contacts table. Email/phone moved to specialized tables.';

create table if not exists public.phone_numbers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  phone_type varchar(50) not null,
  phone_number varchar(30) not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);
comment on table public.phone_numbers is 'Multiple phone numbers per contact with types.';

create table if not exists public.email_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  email_type varchar(50) not null,
  email_address text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);
comment on table public.email_addresses is 'Multiple email addresses per contact with types.';

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default timezone('utc'::text, now())
);
comment on table public.groups is 'User-defined groups for organizing contacts.';

create table if not exists public.custom_fields (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  field_name varchar(100) not null,
  field_value varchar(255) not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);
comment on table public.custom_fields is 'Key-value custom fields per contact.';

create table if not exists public.contact_groups (
  contact_id uuid not null references public.contacts(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  assigned_at timestamptz not null default timezone('utc'::text, now()),
  primary key (contact_id, group_id)
);
comment on table public.contact_groups is 'Many-to-many relationship between contacts and groups.';

-- ------------------------------
-- Indexes
-- ------------------------------
create index if not exists idx_contacts_user_id on public.contacts(user_id);
create index if not exists idx_contacts_updated_at on public.contacts(updated_at);

create index if not exists idx_phone_numbers_user_id on public.phone_numbers(user_id);
create index if not exists idx_phone_numbers_contact_id on public.phone_numbers(contact_id);

create index if not exists idx_email_addresses_user_id on public.email_addresses(user_id);
create index if not exists idx_email_addresses_contact_id on public.email_addresses(contact_id);

create index if not exists idx_groups_user_id on public.groups(user_id);

create index if not exists idx_custom_fields_user_id on public.custom_fields(user_id);
create index if not exists idx_custom_fields_contact_id on public.custom_fields(contact_id);

create index if not exists idx_contact_groups_user_id on public.contact_groups(user_id);

-- ------------------------------
-- Row Level Security (RLS)
-- ------------------------------
alter table public.contacts enable row level security;
alter table public.phone_numbers enable row level security;
alter table public.email_addresses enable row level security;
alter table public.groups enable row level security;
alter table public.custom_fields enable row level security;
alter table public.contact_groups enable row level security;

-- Policies scoped to current_user_id()
create policy if not exists "Users manage their own contacts"
on public.contacts for all
using (public.current_user_id() = user_id)
with check (public.current_user_id() = user_id);

create policy if not exists "Users manage phone numbers of their own contacts"
on public.phone_numbers for all
using (public.current_user_id() = user_id)
with check (public.current_user_id() = user_id);

create policy if not exists "Users manage email addresses of their own contacts"
on public.email_addresses for all
using (public.current_user_id() = user_id)
with check (public.current_user_id() = user_id);

create policy if not exists "Users manage their own groups"
on public.groups for all
using (public.current_user_id() = user_id)
with check (public.current_user_id() = user_id);

create policy if not exists "Users manage custom fields of their own contacts"
on public.custom_fields for all
using (public.current_user_id() = user_id)
with check (public.current_user_id() = user_id);

create policy if not exists "Users manage their own contact-group assignments"
on public.contact_groups for all
using (public.current_user_id() = user_id)
with check (public.current_user_id() = user_id);

-- ------------------------------
-- Triggers
-- ------------------------------
drop trigger if exists handle_contacts_updated_at on public.contacts;
create trigger handle_contacts_updated_at
before update on public.contacts
for each row
execute procedure public.handle_updated_at();

-- ------------------------------
-- Profiles equivalent (optional)
-- ------------------------------
-- If you want a public profile separate from the users table (similar to Supabase profiles),
-- keep this table. Otherwise, you can rely on public.users alone.
create table if not exists public.profiles (
  id uuid primary key references public.users(id) on delete cascade,
  email text,
  full_name text,
  role text default 'user',
  created_at timestamptz default timezone('utc'::text, now())
);

comment on table public.profiles is 'Public user profile info for non-Supabase installs.';

-- RLS for profiles
alter table public.profiles enable row level security;

create policy if not exists "Profiles view own"
on public.profiles for select
using (public.current_user_id() = id);

create policy if not exists "Profiles update own"
on public.profiles for update
using (public.current_user_id() = id)
with check (public.current_user_id() = id);

-- ------------------------------
-- Seed helper (optional)
-- ------------------------------
-- Example: create a demo user and set session for development
-- insert into public.users (email, full_name, role) values ('demo@example.com','Demo User','admin')
-- on conflict (email) do nothing;
-- select public.set_current_user_id((select id from public.users where email='demo@example.com'), true);

-- =================================================================
-- END OF PURE POSTGRES SCHEMA
-- =================================================================