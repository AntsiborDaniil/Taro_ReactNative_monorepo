/**
 * Copies heavy locale JSON (card, affirmations) to dist/locales for runtime fetch on web.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, '..');
const srcLocales = path.join(webRoot, 'src', 'locales');
const distLocales = path.join(webRoot, 'dist', 'locales');

const LAZY_FILES = ['card.json', 'affirmations.json'];
const LANGUAGES = ['ru', 'en'];

if (!fs.existsSync(path.join(webRoot, 'dist'))) {
  console.warn('[locales] Skip: dist/ not found (run expo export first)');
  process.exit(0);
}

for (const lng of LANGUAGES) {
  for (const file of LAZY_FILES) {
    const src = path.join(srcLocales, lng, file);
    const destDir = path.join(distLocales, lng);
    const dest = path.join(destDir, file);

    if (!fs.existsSync(src)) {
      console.warn(`[locales] Skip missing ${src}`);
      continue;
    }

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
    const sizeMb = (fs.statSync(dest).size / (1024 * 1024)).toFixed(1);
    console.log(`[locales] Copied ${lng}/${file} → dist/locales (${sizeMb} MB)`);
  }
}
