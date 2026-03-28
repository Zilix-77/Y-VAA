-- Y VAA — Phase 2: profiles + RLS + signup trigger
-- Run in Supabase Dashboard → SQL → New query, then Run.

-- 1) Profiles table (one row per auth user)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('teacher', 'student')),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Keep updated_at fresh on changes
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

-- 3) On signup: read role + display_name from auth raw_user_meta_data
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_role text;
  safe_name text;
begin
  safe_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  if safe_role not in ('teacher', 'student') then
    safe_role := 'student';
  end if;

  safe_name := nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), '');
  if safe_name is null then
    safe_name := split_part(new.email, '@', 1);
  end if;

  insert into public.profiles (id, role, display_name)
  values (new.id, safe_role, safe_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- 4) Row Level Security (RLS)
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Inserts come only from the trigger (security definer), not from the client.
