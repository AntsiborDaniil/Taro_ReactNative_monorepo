-- Бесплатный дневной ⚡ обновляется в 10:00 по Москве (раньше — в 00:00 UTC = 03:00 МСК).
--
-- «День слота» = календарная дата по Москве со сдвигом на 10 часов: с 10:00 МСК
-- до 09:59 следующего дня это одна и та же дата в tarot_daily_usage.day.
-- В 10:00 МСК бот шлёт «заряд обновился» (apps/bot: планировщик на 10:00 МСК,
-- apps/api: lib/tarotSlotDay.ts — та же формула на стороне API).
-- Москва без перевода часов (UTC+3), поэтому это ровно 07:00 UTC.
--
-- Переход: в день выката с 10:00 МСК даты совпадают со старыми UTC-датами,
-- так что уже потраченный сегодня слот не «воскресает» и не пропадает.

create or replace function public.tarot_slot_day()
returns date
language sql
stable
set search_path = public
as $$
  select ((now() at time zone 'Europe/Moscow') - interval '10 hours')::date;
$$;

comment on function public.tarot_slot_day() is
  'День бесплатного слота: сутки с 10:00 до 10:00 по Москве (дата начала).';

revoke all on function public.tarot_slot_day() from public, anon, authenticated;
grant execute on function public.tarot_slot_day() to service_role;

create or replace function public.consume_tarot_daily_slot_for_user(
  p_user_id uuid,
  p_limit integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := public.tarot_slot_day();
  v_count integer;
begin
  if p_user_id is null then
    raise exception 'user_id required';
  end if;

  insert into public.tarot_daily_usage (user_id, day, count)
  values (p_user_id, v_day, 0)
  on conflict (user_id, day) do nothing;

  select tdu.count into v_count
  from public.tarot_daily_usage tdu
  where tdu.user_id = p_user_id and tdu.day = v_day
  for update;

  if v_count >= p_limit then
    return jsonb_build_object(
      'ok', false,
      'used', v_count,
      'limit', p_limit,
      'day', v_day
    );
  end if;

  update public.tarot_daily_usage tdu
  set count = tdu.count + 1
  where tdu.user_id = p_user_id and tdu.day = v_day
  returning tdu.count into v_count;

  return jsonb_build_object(
    'ok', true,
    'used', v_count,
    'limit', p_limit,
    'day', v_day
  );
end;
$$;

revoke all on function public.consume_tarot_daily_slot_for_user(uuid, integer) from public;
grant execute on function public.consume_tarot_daily_slot_for_user(uuid, integer) to service_role;

create or replace function public.get_tarot_daily_usage_for_user(
  p_user_id uuid,
  p_limit integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := public.tarot_slot_day();
  v_count integer;
begin
  select tdu.count into v_count
  from public.tarot_daily_usage tdu
  where tdu.user_id = p_user_id and tdu.day = v_day;

  v_count := coalesce(v_count, 0);

  return jsonb_build_object(
    'used', v_count,
    'limit', p_limit,
    'day', v_day
  );
end;
$$;

revoke all on function public.get_tarot_daily_usage_for_user(uuid, integer) from public;
grant execute on function public.get_tarot_daily_usage_for_user(uuid, integer) to service_role;

comment on column public.profiles.daily_free_nudge_sent_on is
  'День слота (сутки с 10:00 МСК, public.tarot_slot_day()), за который уже слали «заряд обновился».';
