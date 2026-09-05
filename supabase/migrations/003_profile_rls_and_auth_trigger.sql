-- C3H Supabase profile bootstrap and RLS hardening.
-- Safe to run once on an existing C3H database.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_key, email, display_name)
  values (
    new.id::text,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      'Member'
    )
  )
  on conflict (user_key) do update set
    email = excluded.email,
    display_name = excluded.display_name,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "authenticated users can read profiles" on public.profiles;
create policy "authenticated users can read profiles"
on public.profiles for select to authenticated
using (true);

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
on public.profiles for insert to authenticated
with check (user_key = auth.uid()::text);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles for update to authenticated
using (user_key = auth.uid()::text)
with check (user_key = auth.uid()::text);

alter table public.answers enable row level security;
drop policy if exists "public can read answers" on public.answers;
create policy "public can read answers"
on public.answers for select to public
using (true);
drop policy if exists "authenticated users can add answers" on public.answers;
create policy "authenticated users can add answers"
on public.answers for insert to authenticated
with check (author_key = auth.uid()::text);
drop policy if exists "authors can update answers" on public.answers;
create policy "authors can update answers"
on public.answers for update to authenticated
using (author_key = auth.uid()::text)
with check (author_key = auth.uid()::text);
drop policy if exists "authors can delete answers" on public.answers;
create policy "authors can delete answers"
on public.answers for delete to authenticated
using (author_key = auth.uid()::text);

alter table public.comments enable row level security;
drop policy if exists "public can read comments" on public.comments;
create policy "public can read comments"
on public.comments for select to public
using (true);
drop policy if exists "authenticated users can add comments" on public.comments;
create policy "authenticated users can add comments"
on public.comments for insert to authenticated
with check (author_key = auth.uid()::text);
drop policy if exists "authors can update comments" on public.comments;
create policy "authors can update comments"
on public.comments for update to authenticated
using (author_key = auth.uid()::text)
with check (author_key = auth.uid()::text);
drop policy if exists "authors can delete comments" on public.comments;
create policy "authors can delete comments"
on public.comments for delete to authenticated
using (author_key = auth.uid()::text);
