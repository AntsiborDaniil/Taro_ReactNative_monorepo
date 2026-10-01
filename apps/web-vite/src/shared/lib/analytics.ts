/**
 * Заглушка аналитики (AppMetrica/Яндекс.Метрика подключаются в фазе 6 паритета).
 * Имена событий скопированы 1-в-1 из apps/web/src/shared/types/analytic.types.ts
 * (AnalyticAction) — только значения, реально используемые на перенесённых экранах,
 * чтобы не тащить импорт всего shared/types (barrel тянет RN-типы в других файлах).
 */
export enum AnalyticAction {
  ClickDayCard = 'Клик на карту дня',
  ClickCategoryMainPage = 'Клик категории главная',
  ClickPopularMainPage = 'Клик популярные расклады',
  ClickSpreadInCategory = 'Клик расклад в категории',
  ClickMakeSpread = 'Клик Сделать расклад',
  ClickCompleteSpread = 'Клик Читать объяснение',
  GetAIGeneration = 'Генерация AI',
  ClickLikeTarotCard = 'Клик лайк карты',
  ShowLastCardSpread = 'Показана последняя карта расклада',
  ClickShareSpread = 'Клик поделиться раскладом',
  ClickSettingsSegment = 'Клик Раздел из настроек',
  ClickChangeLanguage = 'Клик Смена языка',
  ClickChangeDeckStyle = 'Клик Смена стиля колоды',
}

export function track(event: AnalyticAction, params?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[analytics]', event, params ?? {});
  }
}
