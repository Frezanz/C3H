-- Run this once in the Supabase SQL Editor for project miyiowbmpatjyeovkznr.
-- The app keeps Apper authentication and uses user_key to associate member data.

create extension if not exists pgcrypto;

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null,
  published boolean not null default true,
  featured boolean not null default false,
  display_order integer not null default 0,
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
  id uuid primary key default gen_random_uuid(),
  user_key text unique not null,
  email text,
  display_name text not null default 'Member',
  avatar_path text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  author_key text not null,
  author_name text not null default 'Member',
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personalized_messages (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  title text not null,
  body text not null,
  type text not null default 'general',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists questions_order_idx on public.questions(display_order);
create index if not exists comments_question_idx on public.comments(question_id, created_at);
create index if not exists messages_user_idx on public.personalized_messages(user_key, created_at desc);

alter table public.questions enable row level security;
alter table public.announcements enable row level security;
alter table public.profiles enable row level security;
alter table public.comments enable row level security;
alter table public.personalized_messages enable row level security;

-- The browser uses only the publishable key. Public content is readable directly;
-- authenticated/member writes and private data are handled by the Apper server bridge.
drop policy if exists "public can read published questions" on public.questions;
create policy "public can read published questions" on public.questions for select using (published = true);

drop policy if exists "public can read published announcements" on public.announcements;
create policy "public can read published announcements" on public.announcements for select using (published = true);

-- Storage bucket used by signed-upload operations. Keep objects private.
insert into storage.buckets (id, name, public)
values ('community-media', 'community-media', false)
on conflict (id) do nothing;

-- Seed the existing question bank only when the table is empty.
insert into public.questions (title, body, category, display_order)
select * from (values
  ('If violence reaches a remote settlement, who protects ordinary civilians who are not involved?', 'If violence reaches a remote settlement, who protects ordinary civilians who are not involved?', 'Safety & immediate threat', 10),
  ('How quickly can police or security forces reach isolated Chakma/Hajong settlements?', 'How quickly can police or security forces reach isolated Chakma/Hajong settlements?', 'Safety & immediate threat', 20),
  ('If residents must leave urgently, who provides transportation for children, elderly people and injured persons?', 'If residents must leave urgently, who provides transportation for children, elderly people and injured persons?', 'Safety & immediate threat', 30),
  ('What happens if the only road connecting a remote settlement becomes blocked or unsafe?', 'What happens if the only road connecting a remote settlement becomes blocked or unsafe?', 'Safety & immediate threat', 40),
  ('If mobile networks or electricity fail, how will isolated settlements communicate with authorities?', 'If mobile networks or electricity fail, how will isolated settlements communicate with authorities?', 'Safety & immediate threat', 50),
  ('Who is legally responsible for protecting civilians during a serious local threat?', 'Who is legally responsible for protecting civilians during a serious local threat?', 'Legal & institutional power', 60),
  ('What is the next authority if residents believe the local response is failing?', 'What is the next authority if residents believe the local response is failing?', 'Legal & institutional power', 70),
  ('What evidence is needed to report intimidation, unlawful exclusion or violence?', 'What evidence is needed to report intimidation, unlawful exclusion or violence?', 'Legal & institutional power', 80),
  ('Which independent institutions can be approached when local power is politically complicated?', 'Which independent institutions can be approached when local power is politically complicated?', 'Legal & institutional power', 90),
  ('Is legal protection meaningful if vulnerable civilians cannot reach the institutions enforcing it?', 'Is legal protection meaningful if vulnerable civilians cannot reach the institutions enforcing it?', 'Legal & institutional power', 100),
  ('Does every major settlement have emergency contacts and a verified communication chain?', 'Does every major settlement have emergency contacts and a verified communication chain?', 'Community capability', 110),
  ('Which settlements have sparse housing, poor transport, weak connectivity or limited police access?', 'Which settlements have sparse housing, poor transport, weak connectivity or limited police access?', 'Community capability', 120),
  ('How many vehicles could realistically move vulnerable residents during an emergency?', 'How many vehicles could realistically move vulnerable residents during an emergency?', 'Community capability', 130),
  ('Where could displaced families temporarily stay if returning home became unsafe?', 'Where could displaced families temporarily stay if returning home became unsafe?', 'Community capability', 140),
  ('Can separate community organisations coordinate within hours instead of days?', 'Can separate community organisations coordinate within hours instead of days?', 'Community capability', 150),
  ('How much political representation does the community actually have?', 'How much political representation does the community actually have?', 'Long-term power', 160),
  ('How strong is the community’s legal, media, economic and professional capacity?', 'How strong is the community’s legal, media, economic and professional capacity?', 'Long-term power', 170),
  ('Who are reliable allies in civil society, academia, journalism, law and government?', 'Who are reliable allies in civil society, academia, journalism, law and government?', 'Long-term power', 180),
  ('Can the community present evidence nationally instead of depending only on local narratives?', 'Can the community present evidence nationally instead of depending only on local narratives?', 'Long-term power', 190),
  ('What capabilities would make confrontation less effective against civilians in the first place?', 'What capabilities would make confrontation less effective against civilians in the first place?', 'Long-term power', 200)
) as seed(title, body, category, display_order)
where not exists (select 1 from public.questions);
