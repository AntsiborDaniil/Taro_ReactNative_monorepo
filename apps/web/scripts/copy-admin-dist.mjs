import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const src = path.resolve(webRoot, '../admin/dist');
const dest = path.join(webRoot, 'dist/admin');

if (!fs.existsSync(src)) {
  console.error(`[admin] Missing ${src}. Build tarot-admin first.`);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log(`[admin] Copied ${src} → ${dest}`);
