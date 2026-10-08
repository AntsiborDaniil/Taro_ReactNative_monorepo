-- Цели недели: серверные отметки (защита от перемотки часов) и награда +1 заряд.
--
-- Отметки привычек живут на клиенте (localStorage), но для награды нужен
-- честный след: каждая отметка «за сегодня» дублируется сюда с днём по
-- серверным часам (Europe/Moscow). Перевод часов на устройстве не помогает —
-- день проставляет сервер. Награда выдаётся раз в неделю, если отметки были
-- в разные дни (не «пять галочек за один вечер»).

create table if not exists public.habit_checkins (
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id text not null,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, habit_id, day)
);

create index if not exists habit_checkins_user_day_idx on public.habit_checkins (user_id, day);

alter table public.habit_checkins enable row level security;
-- Только service_role (API); политик для anon/authenticated нет.

create table if not exists public.habit_week_rewards (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  credits integer not null,
  days_with_checkins integer not null,
  created_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table public.habit_week_rewards enable row level security;

comment on table public.habit_week_rewards is
  'Награда за закрытую неделю целей: +credits к spread_credits, не чаще раза в неделю (week_start — понедельник, Europe/Moscow).';

/**
 * Выдать награду за неделю атомарно: проверить число разных дней с отметками
 * в неделе, записать награду (уникально на неделю) и добавить заряды.
 * Возвращает out_status: granted | already | not_enough_days, out_spread_credits, out_days.
 */
create or replace function public.claim_habit_week_reward(
  p_user_id uuid,
  p_week_start date,
  p_required_days integer,
  p_credits integer
)
returns table (out_status text, out_spread_credits integer, out_days integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days integer;
  v_credits integer;
begin
  select count(distinct hc.day)::integer into v_days
  from public.habit_checkins hc
  where hc.user_id = p_user_id
    and hc.day >= p_week_start
    and hc.day < p_week_start + 7;

  if exists (
    select 1 from public.habit_week_rewards r
    where r.user_id = p_user_id and r.week_start = p_week_start
  ) then
    select coalesce(pr.spread_credits, 0) into v_credits from public.profiles pr where pr.id = p_user_id;
    return query select 'already'::text, v_credits, v_days;
    return;
  end if;

  if v_days < p_required_days then
    select coalesce(pr.spread_credits, 0) into v_credits from public.profiles pr where pr.id = p_user_id;
    return query select 'not_enough_days'::text, v_credits, v_days;
    return;
  end if;

  insert into public.habit_week_rewards (user_id, week_start, credits, days_with_checkins)
  values (p_user_id, p_week_start, p_credits, v_days);

  update public.profiles pr
  set spread_credits = coalesce(pr.spread_credits, 0) + p_credits
  where pr.id = p_user_id
  returning pr.spread_credits into v_credits;

  return query select 'granted'::text, v_credits, v_days;
end;
$$;

revoke all on function public.claim_habit_week_reward(uuid, date, integer, integer) from public, anon, authenticated;
grant execute on function public.claim_habit_week_reward(uuid, date, integer, integer) to service_role;
