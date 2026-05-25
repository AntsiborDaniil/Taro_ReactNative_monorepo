/**
 * Генерирует responsive-tokens-css-content.ts из responsive-tokens.css.
 * Запуск: pnpm sync:responsive-tokens (из apps/web)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themesDir = path.join(__dirname, '../src/shared/themes');
const cssPath = path.join(themesDir, 'responsive-tokens.css');
const outPath = path.join(themesDir, 'responsive-tokens-css-content.ts');

const css = fs.readFileSync(cssPath, 'utf8');

const banner = `/**
 * AUTO-GENERATED — не редактируйте вручную.
 * Источник: responsive-tokens.css
 * Обновление: pnpm sync:responsive-tokens
 */
`;

const body = `${banner}export const RESPONSIVE_TOKENS_CSS = ${JSON.stringify(css)};\n`;

fs.writeFileSync(outPath, body, 'utf8');
console.log('Wrote', outPath);
