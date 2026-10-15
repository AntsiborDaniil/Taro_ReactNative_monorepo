/**
 * Ищет захардкоженные пользовательские строки в TSX (без комментариев, без /dev/ui):
 * кириллицу, латинский текст между JSX-тегами и латинские литералы в a11y/UI-атрибутах;
 * а также кириллицу в значениях en-локалей (опечатки вроде кириллической «Т» в «The»).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(__dirname, '..', 'src');

const CYRILLIC_IN_STRING = /(['"`][^'"`]*[а-яА-ЯёЁ][^'"`]*['"`])/;

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === 'devUi') continue;
      walk(full, out);
    } else if (name.name.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

// Латинский текст между тегами: `>Some text</` (два слова и больше или одно от 4 букв).
const LATIN_JSX_TEXT = />\s*([A-Za-z][A-Za-z'’,.!?-]*(?:\s+[A-Za-z][A-Za-z'’,.!?-]*)*)\s*<\//;
// Литералы в атрибутах, которые видит пользователь или скринридер.
const LATIN_UI_ATTR = /\b(aria-label|title|placeholder|alt|label)="([^"{]*[A-Za-z]{3,}[^"]*)"/;
// Технические подписи, которые не переводятся.
const LATIN_ALLOW = new Set(['ASC', 'MC', 'DSC', 'IC']);

const hits = [];
for (const file of walk(srcRoot)) {
  const rel = path.relative(srcRoot, file);
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue;
    if (CYRILLIC_IN_STRING.test(line)) {
      hits.push(`${rel}:${i + 1}: ${line.slice(0, 120)}`);
      continue;
    }
    const text = LATIN_JSX_TEXT.exec(line);
    if (text && (/\s/.test(text[1]) || text[1].length >= 4) && !LATIN_ALLOW.has(text[1])) {
      hits.push(`${rel}:${i + 1}: latin JSX text: ${line.slice(0, 120)}`);
      continue;
    }
    const attr = LATIN_UI_ATTR.exec(line);
    if (attr && !LATIN_ALLOW.has(attr[2])) {
      hits.push(`${rel}:${i + 1}: latin ${attr[1]}: ${line.slice(0, 120)}`);
    }
  }
}

// Кириллица в en-локалях (кроме названия языка в переключателе).
const enDir = path.join(srcRoot, 'locales', 'en');
const CYRILLIC_ALLOWED_IN_EN = new Set(['settings.json:language.options.ru']);
for (const name of fs.readdirSync(enDir)) {
  if (!name.endsWith('.json') || name === 'card.json' || name === 'affirmations.json') continue;
  const data = JSON.parse(fs.readFileSync(path.join(enDir, name), 'utf8'));
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && /[а-яА-ЯёЁ]/.test(value) && !CYRILLIC_ALLOWED_IN_EN.has(`${name}:${key}`)) {
      hits.push(`locales/en/${name}: "${key}" содержит кириллицу: ${value.slice(0, 80)}`);
    }
  }
}

if (hits.length) {
  console.error('[i18n] Hardcoded UI strings / Cyrillic in en (exclude devUi):');
  for (const h of hits) console.error(h);
  process.exit(1);
}

console.log('[i18n] No hardcoded UI strings in TSX, no Cyrillic in en locales.');
