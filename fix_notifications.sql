-- ==========================================
-- NOTIFICATIONS TABLE (VERSION 3.1 - ROBUST)
-- ==========================================

-- 1. Create notifications table if it doesn't exist
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text, 
  redirect_url text, 
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure columns exist (for existing tables)
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='notifications' and column_name='type') then
    alter table public.notifications add column type text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='notifications' and column_name='redirect_url') then
    alter table public.notifications add column redirect_url text;
  end if;
end $$;

-- 2. Enable Row Level Security (RLS)
alter table public.notifications enable row level security;

-- 3. DROP ALL POSSIBLE POLICIES FIRST (To avoid "Already Exists" error)
drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Users can update their own notifications" on public.notifications;
drop policy if exists "Enable insert for authenticated users only" on public.notifications;
drop policy if exists "System can insert notifications" on public.notifications;

-- 4. Create Policies

-- Allow users to see ONLY their own notifications
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() in (select user_id from public.profiles where id = notifications.user_id));

-- Allow users to mark ONLY their own notifications as read
create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() in (select user_id from public.profiles where id = notifications.user_id));

-- Allow ANY authenticated user to insert notifications for OTHERS
create policy "Enable insert for authenticated users only"
  on public.notifications for insert
  with check (auth.role() = 'authenticated');

-- 5. Enable Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for all tables;
commit;
