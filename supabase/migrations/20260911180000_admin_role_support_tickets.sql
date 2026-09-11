-- Admin roles + support tickets. Users cannot self-promote or edit credits.

alter table public.profiles
  add column if not exists role text not null default 'user';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'admin', 'supervisor'));

create index if not exists profiles_role_idx on public.profiles (role);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null,
  user_id uuid references public.profiles (id) on delete set null,
  username text,
  display_name text,
  message text not null,
  status text not null default 'open'
    check (status in ('open', 'answered', 'closed')),
  admin_reply text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_status_created_idx
  on public.support_tickets (status, created_at desc);

create index if not exists support_tickets_telegram_id_idx
  on public.support_tickets (telegram_id, created_at desc);

create index if not exists support_tickets_user_id_idx
  on public.support_tickets (user_id, created_at desc);

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

alter table public.support_tickets enable row level security;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' then
    new.role := old.role;
    new.spread_credits := old.spread_credits;
    new.telegram_id := old.telegram_id;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
before update on public.profiles
for each row execute function public.protect_profile_privileges();
