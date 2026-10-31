-- ==============================================================================
-- GRAMUDAAN PRODUCTION SCHEMA & ROW-LEVEL SECURITY
-- Complete setup for Auth, Profiles, Feasibility Reports, Applications & Consultations
-- Execute in Supabase SQL Editor: https://supabase.com/dashboard/project/rzwpdzamdpdztmvkqpwf/sql
-- ==============================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. User Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text default '',
  role text not null check (role in ('entrepreneur', 'advisor', 'admin')) default 'entrepreneur',
  status text not null check (status in ('active', 'suspended', 'pending')) default 'active',
  avatar_url text,
  preferred_language text default 'hi',
  state text,
  district text,
  village text,
  pincode text,
  available_capital numeric default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure user_id matches id for backward compatibility
update public.profiles set user_id = id where user_id is null;

-- 3. Feasibility Reports Table (Saved business analyses & feasibility results)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  business_id text not null,
  business_name text not null,
  sub_category_id text,
  location_id text not null,
  location_name text not null,
  capital numeric not null default 0,
  target_investment numeric,
  other_funding numeric,
  place_status text,
  rent_monthly numeric,
  scale_choice text,
  overall_score numeric not null default 0,
  verdict text not null,
  verdict_label text not null,
  feasibility_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 4. Loan Application Drafts Table
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  report_id uuid references public.reports(id) on delete set null,
  business_name text not null,
  applicant_name text not null,
  mobile text not null default '',
  state text not null default '',
  district text not null default '',
  project_cost numeric not null default 0,
  own_contribution numeric not null default 0,
  requested_loan numeric not null default 0,
  scheme_name text not null default '',
  status text not null default 'draft',
  form_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Advisor-Entrepreneur Consultations Table
create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid references auth.users(id) on delete cascade,
  entrepreneur_id uuid references auth.users(id) on delete cascade,
  report_id uuid references public.reports(id) on delete cascade,
  status text check (status in ('pending', 'in_progress', 'reviewed')) default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Performance Indexes
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_reports_user on public.reports(user_id);
create index if not exists idx_reports_created on public.reports(created_at desc);
create index if not exists idx_applications_user on public.applications(user_id);
create index if not exists idx_consultations_advisor on public.consultations(advisor_id);
create index if not exists idx_consultations_entrepreneur on public.consultations(entrepreneur_id);

-- 7. Security Helper Functions
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_advisor()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('advisor', 'admin') and status = 'active'
  );
$$;

-- 8. Automatic Profile Creation on Auth Signup (Anti-Privilege Escalation)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  raw_role text;
  assigned_role text;
begin
  raw_role := coalesce(new.raw_user_meta_data->>'role', 'entrepreneur');

  -- Strict RBAC: Public signup can ONLY select entrepreneur or advisor
  if raw_role in ('entrepreneur', 'advisor') then
    assigned_role := raw_role;
  else
    assigned_role := 'entrepreneur';
  end if;

  insert into public.profiles (
    id,
    user_id,
    email,
    full_name,
    phone,
    role,
    status
  )
  values (
    new.id,
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    assigned_role,
    'active'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), profiles.full_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 9. Anti-Privilege Escalation Trigger on Profile Update (Blocks self-promotion to admin)
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer as $$
begin
  if (new.role != old.role or new.status != old.status) and not public.is_admin() then
    raise exception 'Unauthorized: Only platform administrators can change user roles or account status.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tr_protect_profile_role on public.profiles;
create trigger tr_protect_profile_role
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();

-- 10. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.applications enable row level security;
alter table public.consultations enable row level security;

-- 11. RLS Policies: Profiles
drop policy if exists "Profiles select policy" on public.profiles;
create policy "Profiles select policy"
  on public.profiles for select
  using (auth.uid() = id or public.is_advisor() or public.is_admin());

drop policy if exists "Profiles update policy" on public.profiles;
create policy "Profiles update policy"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Admins full profiles access" on public.profiles;
create policy "Admins full profiles access"
  on public.profiles for all
  using (public.is_admin());

-- 12. RLS Policies: Reports
drop policy if exists "Reports select policy" on public.reports;
create policy "Reports select policy"
  on public.reports for select
  using (auth.uid() = user_id or public.is_advisor() or public.is_admin());

drop policy if exists "Reports insert policy" on public.reports;
create policy "Reports insert policy"
  on public.reports for insert
  with check (auth.uid() = user_id);

drop policy if exists "Reports update policy" on public.reports;
create policy "Reports update policy"
  on public.reports for update
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Reports delete policy" on public.reports;
create policy "Reports delete policy"
  on public.reports for delete
  using (auth.uid() = user_id or public.is_admin());

-- 13. RLS Policies: Applications
drop policy if exists "Applications select policy" on public.applications;
create policy "Applications select policy"
  on public.applications for select
  using (auth.uid() = user_id or public.is_advisor() or public.is_admin());

drop policy if exists "Applications insert policy" on public.applications;
create policy "Applications insert policy"
  on public.applications for insert
  with check (auth.uid() = user_id);

drop policy if exists "Applications update policy" on public.applications;
create policy "Applications update policy"
  on public.applications for update
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Applications delete policy" on public.applications;
create policy "Applications delete policy"
  on public.applications for delete
  using (auth.uid() = user_id or public.is_admin());

-- 14. RLS Policies: Consultations
drop policy if exists "Consultations access policy" on public.consultations;
create policy "Consultations access policy"
  on public.consultations for all
  using (
    auth.uid() = advisor_id or
    auth.uid() = entrepreneur_id or
    public.is_admin()
  );

-- Grant appropriate permissions to authenticated and anon roles
grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant select, insert, update, delete on public.reports to authenticated;
grant select, insert, update, delete on public.applications to authenticated;
grant select, insert, update, delete on public.consultations to authenticated;
