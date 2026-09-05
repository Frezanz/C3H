-- Canonical C3H bridge migration.
-- Preferred order on a fresh Supabase project:
--   1) Run supabase/schema.sql
--   2) Run this file once
-- This migration is intentionally idempotent for its C3H tables.

create extension if not exists pgcrypto;

-- Bootstrap the two public base content tables if schema.sql has not been run yet.
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Question',
  body text not null default '',
  category text not null default 'General',
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

alter table public.questions add column if not exists author_key text;
alter table public.questions add column if not exists author_name text not null default 'Member';

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  author_key text not null,
  author_name text not null default 'Member',
  body text not null check (char_length(trim(body)) between 1 and 10000),
  accepted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('post','announcement','group','project','research','report')),
  title text,
  body text not null,
  author_key text not null,
  author_name text not null default 'Member',
  visibility text not null default 'public' check (visibility in ('public','community','selected','group')),
  password_hash text,
  group_key text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_people (
  content_id uuid not null references public.content_items(id) on delete cascade,
  user_key text not null,
  created_at timestamptz not null default now(),
  primary key (content_id, user_key)
);

create table if not exists public.content_tags (
  content_id uuid not null references public.content_items(id) on delete cascade,
  tag text not null check (char_length(trim(tag)) between 1 and 80),
  created_at timestamptz not null default now(),
  primary key (content_id, tag)
);

create table if not exists public.content_attachments (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  owner_key text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_key text not null,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (group_id, user_key)
);

create table if not exists public.content_access_grants (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items(id) on delete cascade,
  user_key text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (content_id, user_key)
);

create index if not exists answers_question_idx on public.answers(question_id, accepted desc, created_at);
create index if not exists content_type_idx on public.content_items(type, published, created_at desc);
create index if not exists content_author_idx on public.content_items(author_key, created_at desc);
create index if not exists content_people_user_idx on public.content_people(user_key, content_id);
create index if not exists content_tags_tag_idx on public.content_tags(tag, content_id);
create index if not exists content_attachments_content_idx on public.content_attachments(content_id, created_at);
create index if not exists group_members_user_idx on public.group_members(user_key, group_id);
create index if not exists content_grants_lookup_idx on public.content_access_grants(content_id, user_key, expires_at);

alter table public.answers enable row level security;
alter table public.content_items enable row level security;
alter table public.content_people enable row level security;
alter table public.content_tags enable row level security;
alter table public.content_attachments enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.content_access_grants enable row level security;

-- Supabase Edge Functions own privileged writes and access decisions with server-side credentials.
-- No direct browser policy is granted for private content tables.
