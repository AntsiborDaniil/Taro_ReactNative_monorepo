---
name: web-screen
description: Добавить новый экран (страницу) в apps/web — FSD-слайс в pages, роут в NavigationRoute, ленивая регистрация в стеке таба, переводы ru/en. Использовать, когда просят новый экран/страницу/раздел во фронте.
---

# Новый экран в apps/web

1. **Слайс** `apps/web/src/pages/<camelName>/`:
   - `ui/<PascalName>.tsx` — `function <PascalName>() {...}` + `export default <PascalName>;`, обёрнутый в `ScreenLayout` из `shared/ui`; стили через `StyleSheet.create` на токенах `shared/themes/ds` (`DS_COLORS`) и `Text` из `shared/ui`.
   - `ui/index.ts` → `export { default as <PascalName> } from './<PascalName>';`
   - `index.ts` → `export * from './ui';`
   - Логика/состояние — `model/use<PascalName>.ts`, чистые хелперы — `lib/`.
2. **Роут**: добавить значение в enum `NavigationRoute` (`src/shared/types/navigation.types.ts`).
3. **Lazy**: в `src/app/navigation/lazyScreens.tsx` добавить
   ```ts
   export const Lazy<PascalName> = createLazyScreen(
     () => import('pages/<camelName>').then((m) => ({ default: m.<PascalName> })),
     <PascalName>,
     { fallback: pageFallback }   // + ...CARD_I18N, если экрану нужны значения карт
   );
   ```
   и статический импорт `<PascalName>` рядом с остальными.
4. **Стек таба**: `<Stack>.Screen name={NavigationRoute.X} component={LazyX}` в `src/app/navigation/{main|spreads|library}/*Screen.tsx`, в зависимости от таба, откуда открывается экран.
5. **Переход**: `navigation.navigate(NavigationRoute.X, params)`; из другого таба — хелпер `app/navigation/navigateInTab.ts`.
6. **i18n**: строки в `src/locales/ru/<ns>.json` и `src/locales/en/<ns>.json` (в существующий неймспейс; новый неймспейс требует правок в `i18n.ts` и `shared/lib/i18n/loadNamespaces.ts`).
7. Если экран требует логина — гейт через `webAuthGate.ts` и `UserContext`, не показывать логин при `authSessionLoading`.
8. Проверка: `pnpm --filter web exec tsc --noEmit`.
