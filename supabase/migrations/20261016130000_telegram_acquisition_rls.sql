-- Supabase Advisor (CRITICAL «RLS Disabled in Public»): telegram_acquisition была открыта
-- через PostgREST — по anon-ключу (он лежит во фронте) можно было читать и писать лиды
-- (telegram_id, username, имя). Пишет и читает её только API под service_role (bypass RLS),
-- поэтому политик нет: anon/authenticated закрыты полностью.

alter table public.telegram_acquisition enable row level security;

revoke all on public.telegram_acquisition from anon, authenticated;
grant all on public.telegram_acquisition to service_role;
