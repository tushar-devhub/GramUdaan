-- GramUdaan Supabase Schema Migration
-- Creates profiles, reports, and applications tables with Row Level Security (RLS)

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  full_name text not null default '',
  mobile text not null default '',
  email text,
  age text,
  gender text,
  state text,
  district text,
  village text,
  pincode text,
  business_category text,
  business_sub_category text,
  existing_or_new text,
  available_capital numeric default 0,
  goal text,
  preferred_language text default 'hi',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint profiles_user_id_key unique (user_id)
);

-- 2. REPORTS TABLE (Saved business decision / feasibility reports)
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
  feasibility_data jsonb not null,
  created_at timestamptz default now()
);

-- 3. APPLICATIONS TABLE (Loan application drafts)
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  report_id uuid references public.reports(id) on delete set null,
  business_name text not null,
  applicant_name text not null,
  mobile text not null,
  state text not null,
  district text not null,
  project_cost numeric not null default 0,
  own_contribution numeric not null default 0,
  requested_loan numeric not null default 0,
  scheme_name text not null,
  status text not null default 'draft',
  form_data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. PERFORMANCE INDEXES
create index if not exists idx_profiles_user on public.profiles(user_id);
create index if not exists idx_reports_user on public.reports(user_id);
create index if not exists idx_reports_user_created on public.reports(user_id, created_at desc);
create index if not exists idx_applications_user on public.applications(user_id);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.applications enable row level security;

-- Profiles RLS
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Reports RLS
create policy "Users can view their own reports"
  on public.reports for select
  using (auth.uid() = user_id);

create policy "Users can insert their own reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reports"
  on public.reports for update
  using (auth.uid() = user_id);

create policy "Users can delete their own reports"
  on public.reports for delete
  using (auth.uid() = user_id);

-- Applications RLS
create policy "Users can view their own applications"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "Users can insert their own applications"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own applications"
  on public.applications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own applications"
  on public.applications for delete
  using (auth.uid() = user_id);

-- 6. AUTOMATIC USER PROFILE TRIGGER
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, full_name, email, preferred_language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    'hi'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
