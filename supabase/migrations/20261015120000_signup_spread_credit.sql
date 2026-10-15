-- Стартовый заряд: новый пользователь получает 1 платный заряд (profiles.spread_credits = 1).
--
-- Триггер on_auth_user_created срабатывает только на INSERT в auth.users, поэтому начисление
-- идемпотентно: повторный логин/upsert профиля из API credits не трогает (on conflict не
-- обновляет spread_credits). Существующим пользователям ничего не начисляем (бэкфилл — отдельным решением).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, spread_credits)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    1
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = coalesce(nullif(excluded.name, ''), public.profiles.name),
    updated_at = now();
  return new;
end;
$$;
