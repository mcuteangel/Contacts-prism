-- =================================================================
--  PRISM CONTACTS - SUPABASE SCHEMA (WITH AUTH, RLS, TRIGGERS)
--  Usage: Run in Supabase SQL Editor. Safe to re-run (idempotent).
--  Notes:
--   - Depends on Supabase auth schema (auth.users, auth.uid()).
--   - RLS enabled with policies scoped to auth.uid().
--   - Includes profiles table + trigger on auth.users.
--   - Contacts and related tables with indexes and updated_at trigger.
--   - Designed for Offline-first sync using updated_at as the source of truth.
-- =================================================================

-- ------------------------------
-- Extensions (if needed)
-- ------------------------------
-- gen_random_uuid() depends on pgcrypto in Postgres
create extension if not exists "pgcrypto";

-- ------------------------------
-- Helper Functions
-- ------------------------------

-- Auto-update updated_at timestamp on row modification
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Current authenticated user id (Supabase)
create or replace function public.current_user_id()
returns uuid as $$
  select auth.uid();
$$ language sql security definer;

-- ------------------------------
-- Core Tables
-- ------------------------------

-- Contacts
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
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

-- Phone Numbers
create table if not exists public.phone_numbers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  phone_type varchar(50) not null,     -- e.g. mobile, work, home
  phone_number varchar(30) not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

comment on table public.phone_numbers is 'Multiple phone numbers per contact with types.';

-- Email Addresses
create table if not exists public.email_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  email_type varchar(50) not null,     -- e.g. personal, work
  email_address text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

comment on table public.email_addresses is 'Multiple email addresses per contact with types.';

-- Groups
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

comment on table public.groups is 'User-defined groups for organizing contacts.';

-- Custom Fields
create table if not exists public.custom_fields (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  field_name varchar(100) not null,
  field_value varchar(255) not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

comment on table public.custom_fields is 'Key-value custom fields per contact.';

-- Contact-Group Join
create table if not exists public.contact_groups (
  contact_id uuid not null references public.contacts(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
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

-- Upsert-friendly ALL policies per user scope
create policy if not exists "Users manage their own contacts"
on public.contacts for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "Users manage phone numbers of their own contacts"
on public.phone_numbers for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "Users manage email addresses of their own contacts"
on public.email_addresses for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "Users manage their own groups"
on public.groups for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "Users manage custom fields of their own contacts"
on public.custom_fields for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "Users manage their own contact-group assignments"
on public.contact_groups for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ------------------------------
-- Triggers
-- ------------------------------
drop trigger if exists handle_contacts_updated_at on public.contacts;
create trigger handle_contacts_updated_at
before update on public.contacts
for each row
execute procedure public.handle_updated_at();

-- ------------------------------
-- Profiles (User management helper)
-- ------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text default 'user',
  created_at timestamptz default timezone('utc'::text, now())
);

comment on table public.profiles is 'Public user profile information.';

-- Auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS for profiles
alter table public.profiles enable row level security;

create policy if not exists "Users can view their own profile"
on public.profiles for select
using (auth.uid() = id);

create policy if not exists "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id);

-- =================================================================
-- END OF SUPABASE SCHEMA
-- =================================================================