/**
 * Проверка паритета ключей ru/en (без card.json — отдельные большие файлы).
 * Выход с кодом 1 при расхождениях.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '..', 'src', 'locales');
const SKIP_NS = new Set(['card']);

function flat(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flat(v, key));
    else out[key] = v;
  }
  return out;
}

function loadNs(lang, ns) {
  const file = path.join(localesDir, lang, `${ns}.json`);
  if (!fs.existsSync(file)) return null;
  return flat(JSON.parse(fs.readFileSync(file, 'utf8')));
}

const ruFiles = fs.readdirSync(path.join(localesDir, 'ru')).filter((f) => f.endsWith('.json'));
const enFiles = new Set(fs.readdirSync(path.join(localesDir, 'en')).filter((f) => f.endsWith('.json')));

let failed = false;

for (const file of ruFiles) {
  const ns = file.replace('.json', '');
  if (SKIP_NS.has(ns)) continue;
  if (!enFiles.has(file)) {
    console.error(`[i18n] Missing EN namespace: ${ns}`);
    failed = true;
    continue;
  }
  const ru = loadNs('ru', ns);
  const en = loadNs('en', ns);
  for (const key of Object.keys(ru)) {
    if (!(key in en)) {
      console.error(`[i18n] EN missing ${ns}:${key}`);
      failed = true;
    }
  }
  for (const key of Object.keys(en)) {
    if (!(key in ru)) {
      console.error(`[i18n] RU missing ${ns}:${key}`);
      failed = true;
    }
  }
}

for (const file of enFiles) {
  const ns = file.replace('.json', '');
  if (SKIP_NS.has(ns)) continue;
  if (!ruFiles.includes(file)) {
    console.error(`[i18n] Missing RU namespace: ${ns}`);
    failed = true;
  }
}

if (failed) {
  console.error('[i18n] Locale parity check failed.');
  process.exit(1);
}

console.log('[i18n] Locale parity OK (excluding card.json).');
