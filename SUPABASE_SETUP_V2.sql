-- Drop existing policies if any (to be safe)
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;

-- Make sure the profiles table exists and has the correct structure
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text check (role in ('admin', 'candidate')) not null default 'candidate',
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create a function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (
    new.id,
    new.email,
    -- Default to 'candidate', unless specific metadata says otherwise (optional)
    coalesce(new.raw_user_meta_data->>'role', 'candidate'),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Optional: Create a secure bucket for resumes if not exists
insert into storage.buckets (id, name)
values ('resumes', 'resumes')
on conflict (id) do nothing;

-- Storage policies
create policy "Resume images are publicly accessible." on storage.objects
  for select using (bucket_id = 'resumes');

create policy "Anyone can upload a resume." on storage.objects
  for insert using (bucket_id = 'resumes');
