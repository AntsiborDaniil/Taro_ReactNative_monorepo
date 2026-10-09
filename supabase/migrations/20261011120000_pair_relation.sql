-- Расклад на двоих — не только для пары: с кем расклад (партнёр / друг / близкий).
-- Влияет на тон чтения ИИ и подписи в интерфейсе.

alter table public.pair_readings
  add column if not exists relation text not null default 'partner';

alter table public.pair_readings
  drop constraint if exists pair_readings_relation_check;

alter table public.pair_readings
  add constraint pair_readings_relation_check check (relation in ('partner', 'friend', 'family'));
