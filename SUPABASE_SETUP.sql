-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text check (role in ('admin', 'candidate')) not null default 'candidate',
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles enable row level security;

-- Policy: Public profiles are viewable by everyone
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

-- Policy: Users can insert their own profile
create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

-- Policy: Users can update their own profile
create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Set up Storage for Resumes (Optional, but good for candidate flow)
insert into storage.buckets (id, name)
values ('resumes', 'resumes');

create policy "Resume images are publicly accessible." on storage.objects
  for select using (bucket_id = 'resumes');

create policy "Anyone can upload a resume." on storage.objects
  for insert using (bucket_id = 'resumes');


-- Allow uploads to resumes bucket
create policy "Anyone can upload a resume."
on storage.objects
for insert
with check (bucket_id = 'resumes');