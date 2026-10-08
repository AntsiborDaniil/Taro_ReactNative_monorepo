# Монетизация и конкурентное отличие Mindful Tarot (RU/EN, Telegram Mini App + web)

Контекст продукта (из репозитория, не внешний источник): бесплатный лимит `TAROT_DAILY_INTERPRET_LIMIT=1` AI-интерпретация в день; платный пакет через Lava (`LAVA_CREDITS_PER_PURCHASE=3`, одна оферта `LAVA_OFFER_ID`); в Mini App оплата открывается внешней ссылкой (`openExternalPaymentUrl` в `apps/web-vite/src/features/tarotAccess/ui/BuySpreadCreditsModal.tsx`). Telegram Stars в коде не найдены. Цена пакета в коде не задана (живёт в Lava-оффере), поэтому сравнение по цене ниже идёт без неё.

---

## 1. Какие модели монетизации работают в таро / астрологии / AI-wellness / Telegram Mini Apps (2024–2026)

### Takeaway
Почти все заметные игроки используют гибрид: бесплатный ежедневный ритуал → подписка (неделя/месяц/год) + разовые покупки (пакеты вопросов, отчёты, колоды) + иногда живые консультации поминутно. В RU-Telegram-нише доминируют «пакеты раскладов» и «безлимит на срок без автосписаний», а оплата идёт одновременно Stars и картой/СБП.

### Cited Findings
**Глобальные приложения**
- Labyrinthos: Premium $9.99/мес, $24.99/3 мес, $89.99/год (7-дневный триал только на годовом); плюс расходники «33 Credits $0.99 / 333 Credits $4.99 / 777 Credits $6.99», «Starter Pack $19.99», пакеты «+100/+300/+500 Pages» и покупка цифровых колод — [App Store US](https://apps.apple.com/us/app/labyrinthos-tarot-reading/id1155180220), [App Store BM](https://apps.apple.com/bm/app/labyrinthos-tarot-reading/id1155180220)
- Labyrinthos: рейтинг 4.9★ (22 481 оценка); 12% (8 из 69) свежих отзывов упоминают списания/возвраты/отмену — [AppsLupa](https://appslupa.com/app/labyrinthos-tarot-reading/id1155180220)
- Co–Star: подписка Pro-Star $8.99/мес (US) и разовые покупки: «5 Questions $2.99», «10 Questions $4.99», «25 Questions $6.99», «Your Year Ahead $11.99», «Advanced Chart – Self/Relationships $8.99», «Eros $6.99», «Crush Report – 5 $4.99» — [App Store US](https://apps.apple.com/us/app/co-star-personalized-astrology/id1264782561)
- Co–Star позиционирует астрологию как «framework for understanding ourselves and our relationships», ежедневные push по гороскопу; контент делают «human astrologers who collaborate with AI» — [App Store US](https://apps.apple.com/us/app/co-star-personalized-astrology/id1264782561)
- Sanctuary+: $9.99/мес или $69.99/год; в подписку входит бесплатная 5-минутная консультация с ридером; живые ридеры $4.99–$19.99/мин; первые 5 минут за $4.99 — [Sanctuary Buy](https://www.sanctuaryworld.co/buy-subscription/), [Sanctuary FAQ](https://www.sanctuaryworld.co/faq/)
- Nebula: подписка $7.99/неделя (триал 3 дня), $24.99/мес, $29.99/3 мес (Google Play); живые «психики» поминутно, часть карточек $4.99/мин — [Google Play](https://play.google.com/store/apps/details?hl=en&id=genesis.nebula), [YesPress](https://yespress.io/obrio), [Nebula Help](https://nebula-help-us.zendesk.com/hc/en-us/articles/47637952258705-How-much-does-it-cost-to-chat-with-psychics)
- Nebula (iOS-воронка): weekly $7.99 + 3-дневный триал, 3 мес $39.99, год $49.99 — 3-месячный план выступает «ценовым декоем»; жёсткий paywall и второе предложение при отказе — [retention.blog](https://www.retention.blog/p/whats-your-sign-part-2)
- Оценки выручки Nebula расходятся: ~$450K/мес на iOS (~128K загрузок/мес, ~$3.5 на загрузку) — [retention.blog](https://www.retention.blog/p/whats-your-sign-part-2); ~$50K+/мес (76% реклама) по AppGoblin — [AppGoblin](https://appgoblin.info/apps/1459969523); ~$50M ARR в декабре 2023 (по данным Tech.eu, пересказ) — [YesPress](https://yespress.io/obrio). Это несопоставимые оценки разных периодов и методик.
- Chani (астрология) — инфлюенсер-драйвен, без paywall в первой сессии; Nebula — платный трафик + жёсткий paywall — [retention.blog](https://www.retention.blog/p/whats-your-sign-part-2)
- TarotAI (AI-таро): free 3 базовых расклада/день + первый premium бесплатно; Pro $15.99/мес (безлимит базовых + 3 premium/день), Max $35.99/мес; доп. пакет «10 premium readings $4.99» — [creati.ai](https://creati.ai/ai-tools/tarotai/alternatives/tarotai-vs-golden-thread-tarot-feature-performance-comparison/) (агрегатор, не первоисточник)
- Golden Thread Tarot: уроки, база карт, дневник раскладов, карта дня, трекинг настроения/тем, интеграция с физической колодой; монетизация через продажу колод (Labyrinthos) — [creati.ai](https://creati.ai/ai-tools/tarotai/alternatives/tarotai-vs-golden-thread-tarot-feature-performance-comparison/). Точных цен подписки не нашёл.

**Бенчмарки подписочных приложений (RevenueCat SOSA 2025)**
- Health & Fitness: медиана trial→paid 39.9%, топ-10% — 68.3% — [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps-2025/)
- Триалы 17–32 дня конвертируют лучше всего (медиана 45.7%) против 26.8% у триалов ≤4 дней — [RevenueCat PDF](https://www.revenuecat.com/pdf/state-of-subscription-apps-2025.pdf)
- Hard paywall: медиана download→paid 12.11% против 2.18% у freemium; низкие цены дают выше trial→paid (47.8% против 28.4% у дорогих) — [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps-2025/)
- 80% триалов стартуют в день первого открытия — [RevenueCat blog](https://www.revenuecat.com/blog/growth/sosa-2025-launch-sub-club)
- AI-приложения не конвертируют лучше, но дают больше выручки на подписчика; RPI на 60-й день у AI ≥$0.63 при общей медиане $0.31 — [RevenueCat blog](https://www.revenuecat.com/blog/company/the-state-of-subscription-apps-2025-launch)
- Гибрид (подписка + consumables/lifetime) растёт; лидеры — Gaming 61% и Social & Lifestyle 39.4% — [RevenueCat blog](https://www.revenuecat.com/blog/company/the-state-of-subscription-apps-2025-launch)

**Платёжные рельсы Telegram**
- Цифровые товары в ботах/Mini Apps — только Telegram Stars (`XTR`); иначе «Telegram cannot display your bot or mini-app to mobile users»; правило действует «regardless of any other web portals… you may have set up outside the Telegram ecosystem» — [Telegram Bot Payments (Stars)](https://core.telegram.org/bots/payments-stars)
- Обязательны `/paysupport`, доступ к условиям (`/terms`), поддержка; возвраты через `refundStarPayment` — [Telegram Bot Payments (Stars)](https://core.telegram.org/bots/payments-stars)
- Подписки в Stars: `createInvoiceLink` с `subscription_period`, сейчас только 2592000 с (30 дней), цена ≤10 000 Stars — [telegram.js docs](https://telegram.js.org/docs/types/CreateInvoiceLinkParams/), [Star subscriptions](https://core.telegram.org/api/subscriptions)
- Вознаграждение автору ≈ $0.013 за Star (указано для платных постов каналов), вывод Stars доступен через 21 день — [Telegram ToS for Content Creators](https://telegram.org/tos/content-creator-rewards?setln=id)
- Официальный курс покупки — $14.10 за 1000 Stars (параметр `stars_usd_sell_rate_x1000`) — [telegramstars.ru](https://telegramstars.ru/blog/gde-deshevle-kupit-zvezdy) (сторонний продавец, проверить самостоятельно)
- Affiliate-программы для Mini Apps: разработчик задаёт % комиссии и срок, аффилиаты (каналы, пользователи) получают Stars с покупок приведённых пользователей — [Telegram Affiliate Programs](https://telegram.org/tour/affiliate-programs), [bots.updateStarRefProgram](https://core.telegram.org/method/bots.updateStarRefProgram)
- Telegram прямо не рекомендует продавать цифровые товары, которые нельзя отозвать после возврата — [Aurum Law](https://aurum.law/newsroom/Telegram-Mini-App-Legal-Checklist-in-2025)

**Lava.top**
- Подписки: ежемесячно / 3 / 6 / 12 мес; при неуспешном списании ещё 2 попытки (через 8 и 24 ч), затем отмена; цена от 50 ₽ до 300 000 ₽ — [Lava FAQ: Подписки](https://faq.lava.top/article/71932), [Lava FAQ: Как создать подписку](https://faq.lava.top/article/57447)
- Подписка интегрируется с Telegram-ботом через API и с платёжным виджетом для сайта; можно делать несколько уровней (базовый/расширенный) — [Lava FAQ](https://faq.lava.top/article/57447)
- Комиссия 8% с каждой оплаты, включая продления; при возврате не возвращается; чарджбэк 0–40 $/€ — [Lava FAQ: Для автора](https://faq.lava.top/article/79240), [Lava FAQ: Платежи](https://faq.lava.top/article/70658)
- RU-оплата: Visa/МИР/MasterCard российских банков, СБП; в $/€ — иностранные карты, Apple Pay, PayPal — [Lava FAQ: Платежи](https://faq.lava.top/article/70658)
- API: вебхуки `subscription.recurring.payment.success/failed`, `subscription.cancelled`, типы `SUBSCRIPTION_FIRST_INVOICE` / `SUBSCRIPTION_RENEWAL`; режим «Цена по запросу API» — [Lava developers](https://developers.lava.top/ru)

### Inferences
- Модель «1 бесплатно в день + пакет на +3» — самая слабая по LTV из рыночных вариантов: нет повторяющегося платежа, нет якорной цены, нет «дорогого» SKU. Рынок закрепил три SKU-типа: (а) разовый микро-пакет, (б) безлимит/расширенный доступ на срок, (в) премиум-отчёты (год вперёд, совместимость).
- Для Mindful Tarot естественна гибридная схема: подписка «Практика» (ритуал + дневник + анализ паттернов) + пакеты глубоких раскладов как consumable. Это совпадает с трендом RevenueCat на гибрид.
- Бенчмарки RevenueCat относятся к App Store / Google Play и не переносятся на Telegram напрямую. Брать их как ориентир для гипотез, а не как прогноз.
- **Критично:** текущая внешняя Lava-ссылка внутри Mini App формально нарушает правило Stars-only для цифровых товаров. Риск в том, что Telegram может скрыть Mini App от мобильных пользователей. Для монетизации внутри Telegram нужен Stars-канал, а Lava оставить для web.

### Gaps
- Нет публичных данных о конверсии и ARPU именно Telegram Mini Apps в эзотерике; кейсы RU-ботов закрыты.
- Таблица net proceeds на странице Stars не отрендерилась; точный процент разработчика при покупке Stars через App Store/Google не подтверждён (известна только ставка вознаграждения ~$0.013/Star для каналов).
- Модель OpenAI, которую использует API, по `.env.example` определить не удалось, поэтому COGS ниже оценочная.

---

## 2. Цены и пакетирование под RU-покупательную способность и ограничения Lava

### Takeaway
RU-рынок AI-таро в Telegram стоит на ценах 49–100 ₽ за расклад, 149–699 ₽/мес за подписку/безлимит и 2–3 тыс. ₽ за «безлимит 30 дней» у дорогих ботов. Ключевой локальный приём — «без автосписаний» (доступ на срок, продление вручную). AI-себестоимость расклада — копейки, поэтому маржу съедают комиссии и маркетинг, а не OpenAI.

### Cited Findings
- Tarotari (на момент fetch): Free — 1 расклад/день + уточнение, карта дня, гороскоп; PRO 699 ₽/мес (10 разборов/день, натальная карта, синастрия, хиромантия по фото, «память»); «Один разбор» 100 ₽; инструмент для практикующих тарологов 590 ₽/мес; PRO не продлевается автоматически, напоминание за 3 дня; возврат 14 дней, если не было раскладов; оплата Stars или картой — [Tarotari pricing](https://www.tarotari.com/ru/pricing)
- Противоречие: в поисковом сниппете у той же страницы были другие цены — 199 ₽/неделя, 490 ₽/мес, 3 900 ₽/год, «ключи» от 99 ₽ (16.5 ₽ за разбор в большом пакете), личный разбор 8 500 ₽ — [Tarotari pricing (snippet)](https://www.tarotari.com/ru/pricing). Похоже, цены активно тестируются.
- Arcana Astra: 30 бесплатных сообщений на старте, потом 3 тарифа от 149 ₽/мес; заявляет 50 000+ пользователей; Таро + астрология + нумерология + руны; голосовой ввод (Whisper) — [arcana-astra.ru](https://arcana-astra.ru/)
- Tarobot.online (расшифровка расклада по фото своих карт): карта дня бесплатно, 3 пробных расклада; 1 расклад 49–50 ₽, 5 — 199 ₽, 15 — 499 ₽, безлимит 30 дней 2 499 ₽ «без автоматических списаний» (зачёркнутые «старые» цены вдвое выше) — [tarobot.online](https://tarobot.online/)
- taroai.me: «Клуб Посвящённых» 24 ч — 149⭐ (~299 ₽), месяц — 299⭐ (~599 ₽); доп. вопросы можно купить или получить за приглашённого друга — [taroai.me](https://taroai.me/)
- Себестоимость расклада на gpt-4o-mini «~10 копеек» (заявление продавца бота) — [Telderi](https://www.telderi.ru/ru/viewtelegrambot/528)
- Цены OpenAI: gpt-4.1-mini $0.40 вход / $1.60 выход за 1M токенов; gpt-5-mini $0.25 / $2.00 — [OpenAI gpt-4.1-mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini), [OpenAI gpt-5-mini](https://developers.openai.com/api/docs/models/gpt-5-mini)
- Stars из РФ: официальные пути (App Store/Google/@PremiumBot) с российскими картами не работают; пользователи покупают через сторонние сервисы за ~1.29–1.60 ₽/Star (100⭐ ≈ 129–160 ₽ против ~230 ₽ через App Store) — [РБК Компании](https://companies.rbc.ru/news/wKE9q4nHdg/kak-poluchit-zvezdyi-v-telegram-vse-sposobyi-oplatyi-iz-rossii-v-2026-godu/), [DTF](https://dtf.ru/howto/5260806-kak-kupit-zvezdy-v-telegram-v-rossii), [STARSEi](https://starsei.ru/stars), [telegramstars.ru](https://telegramstars.ru/blog/gde-deshevle-kupit-zvezdy)
- Lava: минимальная цена подписки 50 ₽; комиссия 8% — [Lava FAQ](https://faq.lava.top/article/57447), [Lava FAQ](https://faq.lava.top/article/79240)

### Inferences
- **COGS (оценка, не факт):** расклад ≈ 2–3K входных + ~1–1.5K выходных токенов на gpt-4.1-mini ≈ $0.002–0.004, то есть порядка 0.2–0.4 ₽ по курсу ~80–90 ₽/$ (курс не верифицирован). Даже при 10 раскладах в день на подписчика это ~100 ₽/мес COGS — значимо при цене 299 ₽. Поэтому «безлимит» нужен с fair-use капом (как 10/день у Tarotari), а мощную модель стоит оставить для премиум-раскладов.
- **Рекомендуемая лестница (гипотеза для A/B):**
  - Разово: 1 глубокий расклад 59–99 ₽; пакет 5 за 249 ₽; пакет 15 за 590 ₽. Текущий «+3» лучше оставить как входной, но убрать в тень: якорем должен стать пакет на 15.
  - Подписка «Практика»: 299 ₽/мес / 790 ₽ за 3 мес / 2 490 ₽ в год (декой — 3-месячный план, как у Nebula) — до 5 глубоких раскладов/день + все «осознанные» фичи.
  - «Доступ на 30 дней без автопродления» как альтернатива подписке — местная норма доверия (Tarotari, Tarobot).
  - Премиум-отчёты: «Месяц/год вперёд как рефлексия», «Отношения» — 199–490 ₽ разово.
  - Stars-эквиваленты: при ~1.3–2.3 ₽/Star у покупателя и ~$0.013/Star у разработчика ставить ≈ 150⭐ за 299 ₽-продукт. Разработчик получит меньше, чем через Lava, но удержит пользователя внутри Telegram.
- Lava (8%) выгоднее Stars по чистой выручке для web; Stars нужны ради соответствия правилам Telegram и для конверсии в один тап.

### Gaps
- Точный рублёвый net разработчика за 1 Star после вывода через Fragment/TON (курс, комиссии вывода) не найден в первоисточнике.
- Нет данных о покупательной способности/ARPU эзотерических приложений в СНГ (Казахстан, Беларусь и т. д.) отдельно от РФ.

---

## 3. Конкуренты: таблица фич и цен

### Takeaway
Конкуренты делятся на три кластера: (1) глобальные «ритуал + обучение» (Labyrinthos, Golden Thread, Co–Star); (2) глобальные «маркетплейсы советчиков» (Nebula, Sanctuary) — высокая выручка, но регуляторные проблемы; (3) RU-Telegram AI-боты (Tarotari, Arcana Astra, Tarobot, taroai) — дёшево, предсказательно-эзотерический тон, всё в одном (таро + астрология + нумерология + руны).

### Cited Findings (таблица — данные из источников выше)

| Продукт | Тип | Бесплатно | Подписка | Разовые покупки | Особенность | Источник |
|---|---|---|---|---|---|---|
| Labyrinthos | iOS/Android, обучение | расклады, уроки | $9.99/мес, $24.99/3 мес, $89.99/год | кредиты $0.99–6.99, колоды, Starter Pack $19.99 | геймификация уроков, аватары, напоминания | [App Store](https://apps.apple.com/us/app/labyrinthos-tarot-reading/id1155180220) |
| Golden Thread Tarot | iOS/Android | карта дня, дневник, трекинг настроения | н/д | физические колоды | дневник + настроение + физ. колода | [creati.ai](https://creati.ai/ai-tools/tarotai/alternatives/tarotai-vs-golden-thread-tarot-feature-performance-comparison/) |
| Co–Star | астрология, iOS | ежедневный гороскоп, друзья | Pro-Star $8.99/мес | вопросы $2.99–6.99, отчёты $4.99–11.99 | соц. граф, «self-understanding framework» | [App Store](https://apps.apple.com/us/app/co-star-personalized-astrology/id1264782561) |
| Sanctuary | астрология + живые ридеры | гороскопы | $9.99/мес, $69.99/год | ридеры $4.99–19.99/мин | 5 мин консультации в подписке | [Sanctuary](https://www.sanctuaryworld.co/buy-subscription/) |
| Nebula | астрология + психики | ограниченно, hard paywall | $7.99/нед, $24.99/мес, $29.99/3 мес | психики поминутно (~$4.99/мин) | 900 советчиков 24/7; иск FTC 2026 | [Google Play](https://play.google.com/store/apps/details?hl=en&id=genesis.nebula), [FTC](https://www.ftc.gov/news-events/news/press-releases/2026/06/ftc-sues-stop-sprawling-enterprise-operating-unlawful-subscription-schemes) |
| TarotAI | AI-таро web | 3 базовых/день | $15.99 / $35.99 в мес | 10 premium за $4.99 | генерация изображений карт | [creati.ai](https://creati.ai/ai-tools/tarotai/alternatives/tarotai-vs-golden-thread-tarot-feature-performance-comparison/) |
| Tarotari (Мира) | RU web + TG | 1 расклад/день, карта дня, гороскоп | PRO 699 ₽/мес (или 490 ₽/мес по сниппету), без автопродления | разбор 100 ₽; ключи от 99 ₽ | AI-персона «Мира», память, инструмент для тарологов | [Tarotari](https://www.tarotari.com/ru/pricing) |
| Arcana Astra | RU TG-бот | 30 сообщений | от 149 ₽/мес (3 тарифа) | — | таро + астро + нумерология + руны, голос | [arcana-astra.ru](https://arcana-astra.ru/) |
| Tarobot.online | RU TG-бот | карта дня, 3 расклада | безлимит 30 дн 2 499 ₽ без автосписаний | 1 за 49 ₽, 5 за 199 ₽, 15 за 499 ₽ | расшифровка по фото своих карт | [tarobot.online](https://tarobot.online/) |
| taroai.me | RU TG-бот | ограниченно | 149⭐/24 ч, 299⭐/мес | доп. вопросы, за друга бесплатно | 30+ раскладов, уточняющие вопросы, «психолог» | [taroai.me](https://taroai.me/) |

### Inferences
- RU-боты продают «точный ответ»: формулировки вроде «максимально точный ответ», расклады на «здоровье» и «судьбу» (taroai.me, Arcana Astra). Это и есть незанятое место для «рефлексивного» позиционирования.
- Ни у одного RU-конкурента в выдаче не видно связки «настроение + привычки + дневник + анализ паттернов» — у глобальных так позиционируется только Golden Thread.
- Уточняющие вопросы к раскладу, память и голос в RU-нише уже стали нормой. Если их нет, Mindful Tarot проигрывает по фичам.

### Gaps
- Не нашёл RU-эзотерических Mini Apps (именно Web App, не чат-боты) с публичными ценами; рынок в основном чат-ботный.
- Аудитория и выручка RU-конкурентов не подтверждены независимо (50 000 пользователей у Arcana Astra — самоотчёт).

---

## 4. Честное отличие: что уже лучше, где пробелы, какие преимущества фальшивые

### Takeaway
Реальное преимущество — экосистема «ритуал + рефлексия» (карта дня, словарь, аффирмации, настроение, привычки) вокруг таро и этичная рамка. Фальшивые преимущества — «AI-трактовка» и «точность»: их есть у всех, и стоят они копейки.

### Cited Findings
- Habit-forming-категории конвертируют лучше; топ Health & Fitness достигает 68.3% trial→paid за счёт «habit-forming features, community engagement, or premium content» — [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps-2025/)
- «Anybody can vibe-code a ChatGPT wrapper» — дифференциация должна быть за пределами AI-обёртки — [RevenueCat blog](https://www.revenuecat.com/blog/growth/sosa-2025-launch-sub-club)
- Co–Star позиционирует астрологию как инструмент самопонимания и «shortcut to real talk» — [App Store](https://apps.apple.com/us/app/co-star-personalized-astrology/id1264782561)
- Себестоимость AI-расклада у конкурентов ~10 коп. — [Telderi](https://www.telderi.ru/ru/viewtelegrambot/528)
- Tarotari уже использует дисклеймер «не является медицинской, психологической, юридической или финансовой консультацией» — [Tarotari](https://www.tarotari.com/ru/pricing)

### Inferences
- **Уже лучше (реально):** (1) связка настроения и привычек с раскладами, из которой можно строить «паттерны недели»; (2) web + Mini App с одним аккаунтом; (3) mindful-тон без «судьбы» и «порчи» — меньше регуляторного и репутационного риска; (4) бесплатные справочные слои (словарь, карта дня), которые дают SEO и ежедневный повод вернуться.
- **Пробелы:** нет подписки и Stars; нет уточняющих вопросов/диалога по раскладу (у конкурентов норма); нет «памяти» / истории инсайтов как платной ценности; нет премиум-отчётов (месяц/год, отношения); нет реферальной механики (у taroai — «вопрос за друга»; в Telegram — Stars-аффилиаты); нет голосового ввода.
- **Фальшивые преимущества (не продавать):** «AI-трактовка» сама по себе; «точность/глубина» (неверифицируемо и противоречит mindful-позиции); «бесплатно 1 в день» (у Tarotari то же самое); «конфиденциально» без отдельной политики удаления данных.
- **Ставка на победу:** продавать не расклады, а «практику самонаблюдения»: дневник → еженедельный AI-обзор паттернов (настроение × карты × привычки) → вопросы для рефлексии. Это трудно скопировать боту-обёртке, у этого есть повод к подписке, и это вписывается в бренд.

### Gaps
- Нет пользовательских исследований / отзывов Mindful Tarot для проверки, какие фичи ценятся. Нужны собственные данные (Метрика, когорты).

---

## 5. Ранжирование идей монетизации (выручка × сложность × бренд)

### Takeaway
Наибольший ожидаемый эффект при умеренной сложности дадут: Stars-оплата в Mini App (комплаенс + конверсия), подписка «Практика» и лестница пакетов. B2B и живые консультанты — поздно и рискованно.

### Cited Findings
- Stars-подписки делаются через `createInvoiceLink` + `subscription_period=2592000` — [telegram.js docs](https://telegram.js.org/docs/types/CreateInvoiceLinkParams/)
- Lava API поддерживает подписки и вебхуки продлений/отмен — [Lava developers](https://developers.lava.top/ru)
- Аффилиат-программа Stars настраивается одним методом с % и сроком — [bots.updateStarRefProgram](https://core.telegram.org/method/bots.updateStarRefProgram)
- Платные посты в каналах: ~$0.013 за Star — [Telegram Creator ToS](https://telegram.org/tos/content-creator-rewards?setln=id)
- Live-консультанты дают Nebula/Sanctuary основную выручку, но требуют найма, модерации и контроля — [YesPress](https://yespress.io/obrio)

### Inferences (оценки автора, 1–5)

| # | Идея | Выручка | Сложность (стек) | Бренд-фит | Комментарий |
|---|---|---|---|---|---|
| 1 | **Stars в Mini App** (пакеты через `sendInvoice`/`createInvoiceLink` в grammY + вебхук в Fastify → `add_spread_credits`) | 4 | 2 | 5 | Сначала комплаенс: снимает риск скрытия Mini App |
| 2 | **Подписка «Практика»** (Lava recurring на web + Stars 30d в TG): N глубоких раскладов/день + еженедельный обзор паттернов + дневник | 5 | 3 | 5 | Новая колонка `subscription_until` в Supabase, вебхуки Lava `subscription.*` |
| 3 | **Лестница пакетов** 1/5/15 + якорь на большом | 3 | 1 | 4 | Несколько Lava-офферов вместо одного `LAVA_OFFER_ID` |
| 4 | **Премиум-расклады/отчёты** (Кельтский крест, «Месяц/год как рефлексия», «Отношения») | 3 | 2 | 4 | Дорогая модель только здесь — защита маржи |
| 5 | **Уточняющий вопрос к раскладу** (1 бесплатно, далее за кредит) | 3 | 2 | 4 | Паритет с рынком, хороший апсейл |
| 6 | **Реферал / Stars-аффилиаты** («расклад за друга», % тарологам-каналам) | 3 | 2 | 4 | Канал-воронка в RU-TG без закупки рекламы |
| 7 | **«Доступ на 30 дней без автопродления»** | 3 | 1 | 5 | Доверие, и меньше рисков по 376-ФЗ |
| 8 | **Подарочный расклад / сертификат** (Stars-инвойс, который можно переслать) | 2 | 2 | 5 | Multi-chat invoice поддерживается Telegram |
| 9 | **Чаевые / «поддержать проект»** | 1 | 1 | 5 | Низкий доход, хорош для лояльных |
| 10 | **Платный канал-клуб** (Stars-подписка на канал с еженедельными практиками) | 2 | 2 | 4 | Нативно, без кода |
| 11 | **B2B: инструмент для тарологов/коучей** (черновик разбора, white-label) | 3 | 4 | 3 | Tarotari уже продаёт за 590 ₽/мес — спрос есть |
| 12 | **Живые консультанты** | 4 | 5 | 2 | Самая высокая выручка у Nebula, но и максимальный юр./репутационный риск |
| 13 | **Реклама** | 1 | 2 | 1 | Ломает mindful-UX |

- Защита маржи: fair-use кап в подписке, кеширование промптов (cached input у OpenAI в 4–10 раз дешевле), дешёвая модель для карты дня и аффирмаций, дорогая — только для премиума.

### Gaps
- Нет собственных данных конверсии, чтобы откалибровать оценки выручки; оценки экспертные.

---

## 6. Юридические и этические красные линии (RU / Telegram / глобально)

### Takeaway
Эзотерические услуги в РФ не запрещены, и законопроект о запрете их рекламы в 2026 году не прошёл, но риск возвращается регулярно. С 1 марта 2026 действует 376-ФЗ про отказ от автосписаний. Telegram требует Stars и `/paysupport`. Кейс FTC против Nebula — чек-лист того, чего нельзя делать с подписками.

### Cited Findings
- Законопроект № 901048-8 (внесён 23.04.2025) о запрете рекламы эзотерических услуг и блокировке ресурсов — [Гарант](https://base.garant.ru/411624491/); в апреле 2026 профильный комитет ГД не поддержал его (нет определения услуг, нет критериев), правительство тоже не поддержало — [The Moscow Times](https://ru.themoscowtimes.com/2026/04/15/gosduma-ne-reshilas-zapretit-reklamu-uslug-vedm-i-koldunov-a192764), [amic.ru](https://www.amic.ru/news/gosduma-otkazalas-zapreschat-reklamu-uslug-astrologov-tarologov-i-vedm-582066)
- Депутат указала, что с недобросовестными «целителями» уже можно бороться через ст. 38 закона «О рекламе» (недостоверная реклама) — [amic.ru](https://www.amic.ru/news/gosduma-otkazalas-zapreschat-reklamu-uslug-astrologov-tarologov-i-vedm-582066)
- Ранее был похожий законопроект № 824707-8 (январь 2025) — [psy-media.ru](https://psy-media.ru/news/zhiv-kurilka)
- 376-ФЗ (в силе с 01.03.2026): запрещено списывать по подписке с реквизитов, от которых потребитель отказался; сервис обязан обеспечить отказ, в том числе онлайн; норма об уведомлении перед продлением из финальной версии исключена — [Гарант](https://www.garant.ru/news/1884461/), [ppt.ru](https://pravo.ppt.ru/fz/376-fz-319396), [Парламентская газета](https://www.pnp.ru/law/2025/10/15/federalnyy-zakon-376-fz.html)
- FTC (июнь 2026) против Genesis Tech, включая Obrio/Nebula: «$5 personalized reading» скрывал $45 каждые 30 дней; квизы создавали ощущение персонализации; формулировки «Total due today», «only $5»; трудная отмена; двойные списания. Суд выдал временный запрет, затем preliminary injunction — [FTC press release](https://www.ftc.gov/news-events/news/press-releases/2026/06/ftc-sues-stop-sprawling-enterprise-operating-unlawful-subscription-schemes), [Legal500](https://www.legal500.com/intelligence/united-states/consumer-protection/ftc-continues-crackdown-on-subscription-businesses), [YesPress](https://yespress.io/obrio), [TechCrunch](https://techcrunch.com/2026/06/17/ftc-lawsuit-reveals-how-subscription-scam-networks-evade-app-store-enforcement/)
- Telegram: цифровое — только Stars; обязательны `/paysupport`, условия, поддержка; разработчик полностью отвечает за споры — [Telegram Bot Payments](https://core.telegram.org/bots/payments-stars)
- Индустриальная практика дисклеймера: «носит развлекательный и информационный характер… не является медицинской, психологической, юридической или финансовой консультацией» — [Tarotari](https://www.tarotari.com/ru/pricing); Arcana Astra: «не заменяет профессиональную психологическую помощь» — [arcana-astra.ru](https://arcana-astra.ru/)

### Inferences (рекомендации, не юридическая консультация)
- **Красные линии в копирайте:** не обещать исход («узнай, вернётся ли он», «гарантированно»), не делать расклады на здоровье/диагнозы, беременность, юридические и инвестиционные решения; не использовать «порча/снятие/приворот»; никаких «точность 99%». Позиция: «вопросы для размышления».
- **Против гемблинг-фрейминга:** без лутбоксов, «крутки» за Stars и случайных платных наград; платить нужно за определённый контент (расклад/отчёт), а не за шанс. Карта дня остаётся бесплатной.
- **Подписки:** цена, период и дата продления — крупно, рядом с кнопкой; отмена в 1–2 тапа в профиле и через бота; напоминание за 3 дня (сейчас в РФ не обязательно, но снимает чарджбэки и соответствует духу 376-ФЗ); никакого «$1 за персональный разбор», который превращается в подписку. Отдельный опт-ин на автопродление; альтернатива — «30 дней без автопродления».
- **Уязвимые пользователи:** детектор кризисных тем (суицид, насилие) → не интерпретировать, а показывать контакты помощи. Лимит частоты платных раскладов на один и тот же вопрос — защита от компульсивного «перегадывания» (это и бренд, и анти-хищнический сигнал).
- **Реклама:** закон о запрете не принят, но риск вернётся. Mindful-формулировки («практика рефлексии», «дневник») снижают риск попасть под широкое определение «эзотерических услуг».
- **Telegram:** до запуска платных фич в Mini App перевести покупку на Stars, добавить `/paysupport` и `/terms` в grammY-бота, хранить `telegram_payment_charge_id` для `refundStarPayment`.

### Gaps
- Не проверено, как маркировка рекламы (ЕРИР) применяется к посевам в Telegram-каналах для эзотерической тематики; это отдельная тема.
- Нет данных о практике применения Telegram (были ли реальные скрытия Mini Apps за внешние платежи) — только текст правил.
- Налоговые аспекты Stars-выручки (вывод через TON/Fragment для РФ-самозанятого/ИП) не исследованы.
