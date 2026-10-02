/**
 * Ищет кириллицу в пользовательских строках TSX (без комментариев, без /dev/ui).
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

const hits = [];
for (const file of walk(srcRoot)) {
  const rel = path.relative(srcRoot, file);
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue;
    if (CYRILLIC_IN_STRING.test(line)) {
      hits.push(`${rel}:${i + 1}: ${line.slice(0, 120)}`);
    }
  }
}

if (hits.length) {
  console.error('[i18n] Hardcoded Cyrillic in UI TSX (exclude devUi):');
  for (const h of hits) console.error(h);
  process.exit(1);
}

console.log('[i18n] No hardcoded Cyrillic UI strings in TSX.');
