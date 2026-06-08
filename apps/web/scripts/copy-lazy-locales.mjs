/**
 * Copies all locale JSON to dist/locales and public/locales for runtime fetch on web.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, '..');
const srcLocales = path.join(webRoot, 'src', 'locales');
const LANGUAGES = ['ru', 'en'];

const targets = [];
if (fs.existsSync(path.join(webRoot, 'dist'))) {
  targets.push(path.join(webRoot, 'dist', 'locales'));
}
targets.push(path.join(webRoot, 'public', 'locales'));

for (const lng of LANGUAGES) {
  const srcDir = path.join(srcLocales, lng);
  if (!fs.existsSync(srcDir)) {
    continue;
  }

  for (const file of fs.readdirSync(srcDir).filter((f) => f.endsWith('.json'))) {
    const src = path.join(srcDir, file);

    for (const base of targets) {
      const destDir = path.join(base, lng);
      const dest = path.join(destDir, file);
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, dest);
      const sizeKb = Math.round(fs.statSync(dest).size / 1024);
      const label = base.includes('dist') ? 'dist/locales' : 'public/locales';
      console.log(`[locales] ${lng}/${file} → ${label} (${sizeKb} KB)`);
    }
  }
}
