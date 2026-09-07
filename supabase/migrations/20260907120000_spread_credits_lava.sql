-- Paid spread credits (Lava.top packs) + checkout ledger

alter table public.profiles
  add column if not exists spread_credits integer not null default 0
    check (spread_credits >= 0);

create table if not exists public.lava_checkouts (
  invoice_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  credits integer not null default 3 check (credits > 0),
  email text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed')),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists lava_checkouts_user_id_idx
  on public.lava_checkouts (user_id, created_at desc);

alter table public.lava_checkouts enable row level security;

-- Fulfilled payment: pending -> paid (+credits), or insert paid if checkout missing.
create or replace function public.add_spread_credits_for_invoice(
  p_invoice_id text,
  p_user_id uuid,
  p_credits integer,
  p_email text default '',
  p_raw jsonb default '{}'::jsonb
)
returns table (ok boolean, spread_credits integer, already_applied boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_credits integer;
  v_status text;
  v_new_credits integer;
begin
  if p_invoice_id is null or length(trim(p_invoice_id)) = 0 then
    raise exception 'invoice_id required';
  end if;

  if p_credits is null or p_credits <= 0 then
    raise exception 'credits must be positive';
  end if;

  select c.user_id, c.credits, c.status
  into v_user_id, v_credits, v_status
  from public.lava_checkouts c
  where c.invoice_id = p_invoice_id
  for update;

  if v_status = 'paid' then
    select p.spread_credits into v_new_credits
    from public.profiles p
    where p.id = coalesce(v_user_id, p_user_id);
    return query select true, coalesce(v_new_credits, 0), true;
    return;
  end if;

  if v_status = 'pending' then
    update public.lava_checkouts
    set
      status = 'paid',
      paid_at = now(),
      raw = coalesce(p_raw, '{}'::jsonb),
      email = case
        when coalesce(p_email, '') <> '' then p_email
        else email
      end
    where invoice_id = p_invoice_id;

    update public.profiles
    set
      spread_credits = spread_credits + v_credits,
      updated_at = now()
    where id = v_user_id
    returning profiles.spread_credits into v_new_credits;

    return query select true, coalesce(v_new_credits, 0), false;
    return;
  end if;

  -- No checkout row yet (webhook before insert race, or manual link): require user id
  if p_user_id is null then
    raise exception 'user_id required when checkout is missing';
  end if;

  insert into public.lava_checkouts (
    invoice_id, user_id, credits, email, status, raw, paid_at
  ) values (
    p_invoice_id,
    p_user_id,
    p_credits,
    coalesce(p_email, ''),
    'paid',
    coalesce(p_raw, '{}'::jsonb),
    now()
  );

  update public.profiles
  set
    spread_credits = spread_credits + p_credits,
    updated_at = now()
  where id = p_user_id
  returning profiles.spread_credits into v_new_credits;

  return query select true, coalesce(v_new_credits, 0), false;
end;
$$;

create or replace function public.consume_spread_credit_for_user(p_user_id uuid)
returns table (ok boolean, spread_credits integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_credits integer;
begin
  select p.spread_credits into current_credits
  from public.profiles p
  where p.id = p_user_id
  for update;

  if current_credits is null or current_credits <= 0 then
    return query select false, coalesce(current_credits, 0);
    return;
  end if;

  update public.profiles
  set
    spread_credits = spread_credits - 1,
    updated_at = now()
  where id = p_user_id
  returning profiles.spread_credits into current_credits;

  return query select true, current_credits;
end;
$$;

create or replace function public.refund_spread_credit_for_user(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_credits integer;
begin
  update public.profiles
  set
    spread_credits = spread_credits + 1,
    updated_at = now()
  where id = p_user_id
  returning profiles.spread_credits into new_credits;

  return coalesce(new_credits, 0);
end;
$$;

create or replace function public.get_spread_credits_for_user(p_user_id uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.spread_credits from public.profiles p where p.id = p_user_id),
    0
  );
$$;

revoke all on function public.add_spread_credits_for_invoice(text, uuid, integer, text, jsonb) from public;
grant execute on function public.add_spread_credits_for_invoice(text, uuid, integer, text, jsonb) to service_role;

revoke all on function public.consume_spread_credit_for_user(uuid) from public;
grant execute on function public.consume_spread_credit_for_user(uuid) to service_role;

revoke all on function public.refund_spread_credit_for_user(uuid) from public;
grant execute on function public.refund_spread_credit_for_user(uuid) to service_role;

revoke all on function public.get_spread_credits_for_user(uuid) from public;
grant execute on function public.get_spread_credits_for_user(uuid) to service_role;
