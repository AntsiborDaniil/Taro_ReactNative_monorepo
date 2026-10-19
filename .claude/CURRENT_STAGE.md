# CURRENT_STAGE — текущий этап проекта

> **Начинайте работу с обязательного прочтения этого файла.** Потом — [PHILOSOPHY.md](PHILOSOPHY.md) и [BACKUP_POLICY.md](BACKUP_POLICY.md).
> Закончили задачу или поменялся план — обновите этот файл в том же коммите.

Обновлено: 2026-10-15 · последний коммит на момент записи: `78fd892c`

## Этап

**MVP раздела «Астрология»** — второй «мир» рядом с Таро: переключатель «Таро | Астрология», роуты `/astro/*`, общий кошелёк ⚡.

MVP закоммичен на `main` (закрыт флагом `ASTRO_ENABLED = false`). Перед новой задачей — `git status` и [BACKUP_POLICY.md](BACKUP_POLICY.md), раздел «Код».

## Блокировка «в разработке» (2026-10-15)

Астрология пока **закрыта для пользователей** одним флагом `ASTRO_ENABLED = false` в `apps/web-vite/src/shared/lib/section.ts`. Код мира не тронут — открыть: поставить `true`.

| Что при `false` | Где |
|---|---|
| В переключателе «Астрология» приглушена, `aria-disabled`, бейдж «Скоро» висит на верхней грани капсулы (absolute, места не занимает); клик — только `haptic.notify('warning')` | `features/sectionSwitch/SectionSwitch.tsx`, `.module.css` (`.locked`, `.soon`), ключ `astro:switch.soon` |
| Анонс «Новое: твоё небо» на Таро-Главной скрыт | `pages/home/ui/AstroAnnounce.tsx` |
| Все `/astro/*` (старые ссылки, deep link) → `<Navigate to="/" replace />` | `app/router.tsx` |
| `getLastSection()` всегда `tarot` — вкладка «Главная» не уводит в астро-мир по сохранённому выбору | `shared/lib/section.ts` |

Адаптив переключателя: колонки `minmax(0, 1fr)`, у кнопок `min-width: 0`, отступы 8 px, gap 6 px; при `max-width: 380px` иконки скрыты — иначе «АСТРОЛОГИЯ» с иконкой не влезает в половину и заезжает под бегунок. Прогнаны `tsc`, `i18n:check` и тесты; в браузере на 360–375 px после этой правки ещё не смотрели.

## Вход с reply-кнопки бота (2026-10-18)

- Причина «не входит, нет в админке»: постоянная нижняя клавиатура бота (`mainReplyKeyboard`) открывала Mini App reply-кнопкой `web_app` — Telegram не передаёт туда initData, вход невозможен.
- Бот: кнопка «🔮 Открыть Mindful Tarot» теперь текстовая → бот отвечает inline web_app-кнопкой; `message:web_app_data` (sendData из Mini App) → inline-кнопка + новая клавиатура. Тест в `apps/bot/tests/messages.test.ts`.
- Mini App: `app/AppShell/TelegramNoInitDataScreen.tsx` — внутри Telegram без initData экран «Открыть заново» (sendData('relaunch')), ключи `core:telegramRelaunch.*`.
- Старые клавиатуры у пользователей обновятся после /start или после нажатия «Открыть заново».
- На проде: `telegram_bot_subscribers.last_interaction_at` у всех NULL — бот с отчётами о подписчиках долго не выкатывался (билды Timeweb падали/висели); после успешного деплоя этого коммита запись подписчиков должна пойти.

## Автоперевход в Mini App (2026-10-17)

- Проверка входа при каждом открытии: AppShell запрашивает `/api/auth/me`; любой 401 в Telegram (на старте или если сессия выпала посреди работы) → `baseQuery` в `apps/web-vite/src/shared/api/baseApi.ts` тихо перевходит по initData и повторяет запрос.
- `shared/api/telegramReauth.ts`: initData из моста → hash `#tgWebAppData` → копия в sessionStorage (`tgInitData`, пишет inline-скрипт в `index.html`), т.е. вход работает и без загруженного telegram-web-app.js; ретраи ~90 с на 5xx/сеть, стоп на 400/401, одна попытка на все параллельные 401.
- AppShell: убран одноразовый `telegramAuthAttempted`; если /me не удался по сети — вход с ретраями; при возврате в приложение без входа — новая попытка.
- Ограничение: initData живёт 24 ч (`MAX_AUTH_AGE_SEC` в API) — если WebView не перезапускался сутки, нужен перезапуск Mini App.
- Тесты: `shared/api/telegramReauth.test.ts`.

## Бесплатный заряд и рассылка (2026-10-16)

- Правило владельца: у каждого (и нового) пользователя 1 бесплатный заряд; в 10:00 МСК он становится 1, если был потрачен, и не копится. Это дневной слот: `FREE_DAILY_CHARGES = 1` в `apps/api/src/lib/env.ts`, `getTarotDailyLimit()` с Supabase всегда 1 (env `TAROT_DAILY_INTERPRET_LIMIT` — только memory/dev:ui).
- Стартовый **платный** заряд отменён: миграция `20261015120000_signup_spread_credit.sql` удалена (на проде не применялась), `SIGNUP_SPREAD_CREDITS` убран из memory-бэкенда. Итого новый пользователь видит «1».
- Рассылка 10:00 уходит только тем, у кого бесплатный заряд сейчас есть (`shouldSendNudge: used < limit`), без «окна 10–12 всем». Подписчик без профиля Mini App тоже получает.
- Тесты: `apps/api/tests/freeDailyCharge.test.ts`, `freeDailyLimitProd.test.ts`, `dailyNudge.test.ts`. Живой смоук на memory-API: новый → free 1 / paid 0, после расклада 0, второй — 429.
- Остаётся: refund слота пишет в сегодняшний день, а не в день списания (см. ресерч ниже).

## Ресерч: пользователи и заряды (2026-10-16)

Прод (только чтение): 35 auth.users = 35 profiles (сирот нет), 23 с telegram_id; лидов 11, из них 4 без профиля. Все 23 оплаты Lava — от одного пользователя (тесты владельца), баланс у всех 0, кроме одного (2). Леджера движений зарядов нет — сверить баланс с историей нельзя.

Найденные баги (код, не исправлены):
- refund дневного слота неатомарен и берёт **сегодняшний** день, а не день списания (`tarotDailyUsageService.ts` `refundTarotDailySlot`; возврат за истёкшую пару в `pairReadingService.ts` settleExpiredPairs).
- списание 2 слотов (глубокий/пара) неатомарно (`tryConsumeSpreadSlots`).
- бесплатная пара — гонка, `free_first_uses('pair')` не используется.
- уточнение списывает только платные заряды, а бейдж показывает слот+заряды → «1», но уточнение недоступно.
- фронт: `/me` из refetchOnFocus может перетереть баланс после расклада; смена дня в 10:00 при открытом приложении не пересчитывается; возврат за пару не инвалидирует `User`.
- тексты «придут 3 заряда» при пакетах 3/9/15.
- сессия: cookie = access token Supabase; проверить JWT expiry на проде (локально 30 дней).

## Вход новых пользователей Mini App и RLS (2026-10-16)

- **Симптом:** лиды в `telegram_acquisition` есть, а `auth.users`/`profiles` не создаются (за 7 дней 3 из 4 лидов без профиля, сирот в `auth.users` нет — `/api/auth/telegram` до бэка не доходил или отваливался по таймауту). Вероятная причина — холодный старт Render Free: фронт делал 3 попытки за ~1 с и больше не пробовал.
- **Фикс:** `shared/lib/web/telegramWebApp.ts` — ретраи ~90 с (кроме 400/401), одна попытка на всех вызывающих; `AppShell.tsx` — повтор входа при возврате в приложение; `index.html` — ранний пинг `/health`, будит Render; `vercel.json` — `maxDuration: 60` для `api/**/*.js`.
- **RLS:** миграция `20261016130000_telegram_acquisition_rls.sql` (единственная public-таблица без RLS на проде).
- Миграции `20261016120000` (реестр подписчиков) и `20261016130000` (RLS) применены на прод вручную `supabase db push --db-url` (GHA `supabase-deploy.yml` падает на Link — секрет `SUPABASE_ACCESS_TOKEN`). Миграция стартового платного заряда `20261015120000` удалена (на проде не применялась).

## Рассылка 10:00 МСК (2026-10-16)

- **Адресаты — реестр подписчиков бота**, а не `profiles`: таблица `telegram_bot_subscribers`, миграция `supabase/migrations/20261016120000_telegram_bot_subscribers.sql` (бэкфилл из `profiles.telegram_id` и `telegram_acquisition`, к проду не применена). Бот шлёт события в `POST /api/internal/bot-subscribers` (`apps/bot/src/subscribers.ts`: любое сообщение — не чаще раза в час, `my_chat_member` kicked/member), Mini App-вход тоже регистрирует. Сервис — `apps/api/src/services/telegramSubscribersService.ts`.
- **Надёжность.** `/internal/notify/daily-free` отвечает 202 и шлёт в фоне; атомарный захват дня на подписчика (без дублей при параллельных прогонах), 403/deactivated → `blocked_at`, 429 → `retry_after`, сеть/5xx → откат захвата и догон часовым прогоном. Бот: таймаут 60 с + 3 попытки. Ошибки Telegram — `apps/api/src/lib/telegramSendErrors.ts`.
- **Тексты** — `apps/api/src/lib/dailyNudgeMessages.ts` (`pickDailyNudge`): 21 нейтральный вариант + по 3 на пн/пт/вс на каждый язык, детерминированно по (день, получатель), соседние дни разные. Язык — `language_code` подписчика.
- Новый подписчик получает рассылку со следующего дня слота (в день прихода — уже было приветствие). Админские и разовые broadcast всё ещё идут по `profiles`.
- Тесты: `apps/api/tests/dailyNudge.test.ts`, `dailyNudgeMessages.test.ts`, `apps/bot/tests/notifyRetry.test.ts`.
- Деплой: миграция → API → бот (порядок важен: без таблицы бот/API упадут на записи подписчиков).

## Заряды и язык Telegram (2026-10-15)

- **Стартовый заряд.** Раньше новым пользователям не начислялось ничего: шапка показывала «1» за счёт бесплатного расклада дня, а модалка — 0 платных. Теперь при регистрации выдаётся `spread_credits = 1`: memory — `SIGNUP_SPREAD_CREDITS` в `apps/api/src/dev/memoryBackend.ts`, Supabase — миграция `supabase/migrations/20261015120000_signup_spread_credit.sql` (новая версия `handle_new_user`, к проду не применена). Бэкфилл старым пользователям не делали — решение владельца. Тест: `apps/api/tests/signupCredit.test.ts`.
- **Баланс в модалке = бейдж.** Общая функция `apps/web-vite/src/shared/lib/quotaBalance.ts` (`computeQuotaBalance`), её используют `CreditsBadge` и `BuySpreadCreditsModal`; ключ `spread:buyPacks.balanceIncludesDaily`.
- **Язык Mini App.** Приоритет: ручной выбор → `language_code` Telegram (initDataUnsafe → initData → `#tgWebAppData`) → `?lang=` → сохранённый → ru. Логика — `apps/web-vite/src/shared/i18n/resolveLanguage.ts`, поздний мост ловит `watchTelegramLanguage()`. Бот: глобальная Menu Button без `?lang=`, команды en по умолчанию + ru. Тесты: `shared/i18n/i18n.test.ts`, `apps/bot/tests/lang.test.ts`. `check-i18n-ui-strings.mjs` теперь ловит и латиницу в JSX, и кириллицу в en-локалях.

## Что уже сделано

| Область | Где |
|---|---|
| Переключатель миров, `section` (`tarot` / `astro`), `data-section`, астро-токены | `apps/web-vite/src/shared/lib/section.ts`, `features/sectionSwitch/`, `styles/tokens.css`, `app/AppShell/*` |
| Страницы `/astro`, `/astro/profile`, `/astro/horoscope`, `/astro/moon`, `/astro/natal`, `/astro/compat` | `apps/web-vite/src/pages/astro*/`, `app/router.tsx` |
| Астро-движок на клиенте (`astronomy-engine`), знак, Луна, города | `apps/web-vite/src/shared/lib/astro/` (+ `engine.test.ts`) |
| Колесо натальной карты | `apps/web-vite/src/features/natalWheel/` |
| Анонс астрологии на Главной Таро | `apps/web-vite/src/pages/home/ui/AstroAnnounce.tsx`, `shared/lib/astroAnnounce.ts` |
| Гороскоп дня по знаку (AI, кэш в памяти процесса, mock) | `apps/api/src/routes/astro.ts`, `services/astroHoroscopeService.ts`, `dev/mockOpenAi.ts`, `tests/astroHoroscope.test.ts` |
| i18n ru/en | `apps/web-vite/src/locales/{ru,en}/astro.json`, `astroChart.json` |
| Цели Метрики `astro_*` | `apps/web-vite/src/shared/lib/metrika.ts` |

### Отличия реализации от плана в отчёте

План ([часть 3 отчёта](../reports/astrology/Mindful%20Tarot%20—%20Астрология:%20ресерч%20и%20план%20интеграции.md)) предлагал считать на сервере и хранить в БД. Сейчас сделано иначе — это осознанное упрощение MVP, не баг:

- **Астро-профиль хранится только на устройстве** (`localStorage`, ключ `mt.astroProfile.v1`). Данные рождения не уходят на сервер и в OpenAI → снимает часть вопросов 152-ФЗ, но профиль теряется при очистке браузера и не синхронизируется между устройствами.
- **Движок на клиенте**, а не в `apps/api`.
- **Гороскоп кэшируется в памяти API**, без таблицы `astro_daily_horoscopes` и миграций. После рестарта Render кэш пустой — генерация повторяется (до 24 в сутки).

## Ближайшие задачи

1. [x] Закоммитить MVP вместе с блокировкой (`ASTRO_ENABLED = false` — в прод уходит закрытым).
2. [ ] Ручной смоук на `pnpm dev:ui` (с `ASTRO_ENABLED = true` локально): переключение миров переживает перезагрузку, 375 px и десктоп, светлая и тёмная тема.
3. [ ] Знак в толковании раскладов и «небо дня» в карте дня (мосты Таро ↔ Астро).
4. [ ] Бот: тизер гороскопа в утреннем сообщении 10:00 МСК + deep link `startapp=astro_*` (`apps/bot`, тесты сообщений).
5. [ ] Решить, переносить ли кэш гороскопа в БД (`astro_daily_horoscopes`) — нужно, если рестарты Render дают лишние генерации или пиковую задержку в 10:00.
6. [ ] Документация: в `CLAUDE.md`, `.claude/rules/` и `DEPLOY.md` описан `apps/web` (Expo), а активная разработка фронта идёт в `apps/web-vite`. Завести `.claude/rules/web-vite.md` и уточнить, какой фронт на проде.

Дальше — v2 и v3 из [дорожной карты](../reports/astrology/Mindful%20Tarot%20—%20Астрология:%20ресерч%20и%20план%20интеграции.md) (полный AI-портрет ⚡3, синастрия ⚡2, лунный календарь и пуши).

## Решения владельца, которые ещё не приняты

- **Бэкфилл стартового заряда** пользователям, зарегистрированным до миграции `20261015120000` (ограничить по `created_at`, чтобы не выдать заряд тем, кто уже потратил свои).

- **Когда открывать астрологию** (`ASTRO_ENABLED = true`) и вернуть ли тогда анонс на Главную.

- **152-ФЗ**: нужен ли отдельный документ согласия, если данные рождения сейчас не покидают устройство. Если профиль поедет на сервер — вопрос обязательный.
- **Цены в ⚡** (портрет ⚡3, синастрия ⚡2) — гипотезы, проверять A/B.
- **Иллюстрации** астро-мира (3–4 обложки), промпты — в части UX отчёта, раздел 3.

## Не трогать без запроса

- `apps/native` (git submodule).
- Swiss Ephemeris / `sweph` / Kerykeion — AGPL, не подключать.
- Прод-окружения (Supabase `urrbsxwlmsfedezwtglm`, Render, Vercel) — только по явной просьбе.

## Референсы

| Что | Файл |
|---|---|
| Общие правила и команды | [CLAUDE.md](../CLAUDE.md) |
| Философия работы | [PHILOSOPHY.md](PHILOSOPHY.md) |
| Бэкапы и откат | [BACKUP_POLICY.md](BACKUP_POLICY.md) |
| Правила по пакетам | [rules/](rules/) — `web.md`, `api.md`, `supabase.md`, `bot.md`, `admin.md` |
| Типовые задачи | [skills/](skills/) — `web-screen`, `api-endpoint`, `db-migration` |
| План астрологии (продукт, UX, разработка) | [reports/astrology/](../reports/astrology/) |
| Продуктовый ресерч и growth-фичи | [reports/](../reports/) |
| Деплой | [DEPLOY.md](../DEPLOY.md), [docs/DEPLOY_YOUR_STEPS.md](../docs/DEPLOY_YOUR_STEPS.md), [docs/SUPABASE_PRODUCTION_AUTH.md](../docs/SUPABASE_PRODUCTION_AUTH.md) |
| Миграции | [supabase/migrations/](../supabase/migrations/), CI: [.github/workflows/supabase-deploy.yml](../.github/workflows/supabase-deploy.yml) |
