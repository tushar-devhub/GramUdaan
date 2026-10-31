-- GramUdaan RBAC & Profile Migration
-- Adds role-based access control (entrepreneur, advisor, admin), security policies, and consultation tracking

-- 1. ADD / ENSURE REQUIRED COLUMNS ON PROFILES
alter table public.profiles 
  add column if not exists role text not null default 'entrepreneur',
  add column if not exists phone text,
  add column if not exists avatar_url text,
  add column if not exists status text not null default 'active';

-- Add check constraints safely
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('entrepreneur', 'advisor', 'admin'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_status_check check (status in ('active', 'suspended', 'pending'));
  end if;
end $$;

-- 2. HELPER FUNCTION TO CHECK ADMIN PRIVILEGES
create or replace function public.is_admin()
returns boolean as $$
  select coalesce(
    (select role = 'admin' from public.profiles where user_id = auth.uid() limit 1),
    false
  );
$$ language sql security definer;

-- 3. HELPER FUNCTION TO CHECK ADVISOR PRIVILEGES
create or replace function public.is_advisor()
returns boolean as $$
  select coalesce(
    (select role in ('advisor', 'admin') from public.profiles where user_id = auth.uid() limit 1),
    false
  );
$$ language sql security definer;

-- 4. HARDEN USER PROFILE CREATION (ANTI-PRIVILEGE ESCALATION)
-- Public users can ONLY register as 'entrepreneur' or 'advisor'.
-- Any attempt to pass 'admin' in user_metadata will be safely forced to 'entrepreneur'.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  requested_role text;
  assigned_role text;
begin
  requested_role := lower(trim(coalesce(new.raw_user_meta_data->>'role', 'entrepreneur')));
  
  if requested_role = 'advisor' then
    assigned_role := 'advisor';
  else
    assigned_role := 'entrepreneur';
  end if;

  insert into public.profiles (
    user_id,
    full_name,
    email,
    phone,
    role,
    avatar_url,
    preferred_language,
    status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'mobile', ''),
    assigned_role,
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    'hi',
    'active'
  )
  on conflict (user_id) do update set
    email = excluded.email,
    full_name = case when profiles.full_name = '' then excluded.full_name else profiles.full_name end,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Re-attach trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. TRIGGER TO PREVENT NON-ADMINS FROM PROMOTING THEMSELVES
create or replace function public.protect_profile_role()
returns trigger as $$
begin
  -- If updater is not admin, prevent modifying role or status
  if not public.is_admin() then
    new.role := old.role;
    new.status := old.status;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_protect_profile_role on public.profiles;
create trigger tr_protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- 6. ADMIN & ADVISOR PROFILE POLICIES
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin() or auth.uid() = user_id);

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

-- 7. CONSULTATIONS TABLE FOR ADVISORS & ENTREPRENEURS
create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  entrepreneur_id uuid references auth.users(id) on delete cascade not null,
  advisor_id uuid references auth.users(id) on delete set null,
  business_name text not null,
  topic text not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  notes text,
  scheduled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_consultations_entrepreneur on public.consultations(entrepreneur_id);
create index if not exists idx_consultations_advisor on public.consultations(advisor_id);

alter table public.consultations enable row level security;

-- Consultations RLS
drop policy if exists "Users view own consultations" on public.consultations;
create policy "Users view own consultations"
  on public.consultations for select
  using (
    auth.uid() = entrepreneur_id 
    or auth.uid() = advisor_id 
    or public.is_admin()
  );

drop policy if exists "Entrepreneurs can create consultations" on public.consultations;
create policy "Entrepreneurs can create consultations"
  on public.consultations for insert
  with check (auth.uid() = entrepreneur_id);

drop policy if exists "Participants can update consultations" on public.consultations;
create policy "Participants can update consultations"
  on public.consultations for update
  using (
    auth.uid() = entrepreneur_id 
    or auth.uid() = advisor_id 
    or public.is_admin()
  );
