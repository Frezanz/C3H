-- Free, Open & Powerful community data model.
-- Run this file once in the Supabase SQL Editor for project miyiowbmpatjyeovkznr.

create extension if not exists pgcrypto;

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  question text not null,
  position integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  published boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_path text,
  location text,
  interests text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references public.questions(id) on delete cascade,
  announcement_id uuid references public.announcements(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comment_parent_check check (((question_id is not null)::int + (announcement_id is not null)::int) = 1)
);

create table if not exists public.personalized_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists questions_category_position_idx on public.questions(category, position);
create index if not exists announcements_window_idx on public.announcements(starts_at, ends_at);
create index if not exists comments_question_idx on public.comments(question_id, created_at);
create index if not exists comments_announcement_idx on public.comments(announcement_id, created_at);
create index if not exists messages_user_created_idx on public.personalized_messages(user_id, created_at desc);

alter table public.questions enable row level security;
alter table public.announcements enable row level security;
alter table public.profiles enable row level security;
alter table public.comments enable row level security;
alter table public.personalized_messages enable row level security;

drop policy if exists "published questions are public" on public.questions;
create policy "published questions are public" on public.questions for select to anon, authenticated using (published = true);

drop policy if exists "published announcements are public" on public.announcements;
create policy "published announcements are public" on public.announcements for select to anon, authenticated using (published = true);

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "users create own profile" on public.profiles;
create policy "users create own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "users read comments" on public.comments;
create policy "users read comments" on public.comments for select to authenticated using (true);
drop policy if exists "users create own comments" on public.comments;
create policy "users create own comments" on public.comments for insert to authenticated with check (auth.uid() = author_id);
drop policy if exists "users update own comments" on public.comments;
create policy "users update own comments" on public.comments for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "users delete own comments" on public.comments;
create policy "users delete own comments" on public.comments for delete to authenticated using (auth.uid() = author_id);

drop policy if exists "users read own messages" on public.personalized_messages;
create policy "users read own messages" on public.personalized_messages for select to authenticated using (auth.uid() = user_id);
drop policy if exists "users mark own messages read" on public.personalized_messages;
create policy "users mark own messages read" on public.personalized_messages for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select on public.questions, public.announcements to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.comments to authenticated;
grant select, update on public.personalized_messages to authenticated;

insert into public.questions(category, question, position) values
('Safety & immediate threat','If violence reaches a remote settlement, who protects ordinary civilians who are not involved?',1),
('Safety & immediate threat','How quickly can police or security forces reach isolated settlements?',2),
('Safety & immediate threat','If residents must leave urgently, who provides transportation for children, elderly people and injured persons?',3),
('Safety & immediate threat','What happens if the only road connecting a remote settlement becomes blocked or unsafe?',4),
('Safety & immediate threat','If mobile networks or electricity fail, how will isolated settlements communicate with authorities?',5),
('Legal & institutional power','Who is legally responsible for protecting civilians during a serious local threat?',1),
('Legal & institutional power','What is the next authority if residents believe the local response is failing?',2),
('Legal & institutional power','What evidence is needed to report intimidation, unlawful exclusion or violence?',3),
('Legal & institutional power','Which independent institutions can be approached when local power is politically complicated?',4),
('Legal & institutional power','Is legal protection meaningful if vulnerable civilians cannot reach the institutions enforcing it?',5),
('Community capability','Does every major settlement have emergency contacts and a verified communication chain?',1),
('Community capability','Which settlements have sparse housing, poor transport, weak connectivity or limited police access?',2),
('Community capability','How many vehicles could realistically move vulnerable residents during an emergency?',3),
('Community capability','Where could displaced families temporarily stay if returning home became unsafe?',4),
('Community capability','Can separate community organisations coordinate within hours instead of days?',5),
('Long-term power','How much political representation does the community actually have?',1),
('Long-term power','How strong is the community’s legal, media, economic and professional capacity?',2),
('Long-term power','Who are reliable allies in civil society, academia, journalism, law and government?',3),
('Long-term power','Can the community present evidence nationally instead of depending only on local narratives?',4),
('Long-term power','What capabilities would make confrontation less effective against civilians in the first place?',5)
on conflict do nothing;

insert into public.announcements(title, body, published, starts_at)
values ('Start with one question','If something goes wrong tomorrow, what would your community wish it had prepared today?',true,now())
on conflict do nothing;

-- Storage buckets. Keep avatars private; community media is public-read and authenticated-write.
insert into storage.buckets(id, name, public) values ('avatars','avatars',false) on conflict (id) do nothing;
insert into storage.buckets(id, name, public) values ('community-media','community-media',true) on conflict (id) do nothing;

create policy if not exists "users manage own avatars" on storage.objects for all to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy if not exists "public can read community media" on storage.objects for select to anon, authenticated
using (bucket_id = 'community-media');

create policy if not exists "authenticated upload community media" on storage.objects for insert to authenticated
with check (bucket_id = 'community-media');
