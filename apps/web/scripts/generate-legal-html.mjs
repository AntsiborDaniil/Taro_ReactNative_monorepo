/**
 * Renders static legal pages into public/legal from the same source the app uses
 * (src/shared/config/legal). Public URLs are required by payment providers and
 * are indexable, unlike the SPA routes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const legalConfigDir = path.join(webRoot, 'src', 'shared', 'config', 'legal');
const outDir = path.join(webRoot, 'public', 'legal');

const SITE_URL = (
  process.env.WEB_APP_URL?.trim() ||
  process.env.EXPO_PUBLIC_WEB_APP_URL?.trim() ||
  'https://taro-react-native-monorepo.vercel.app'
).replace(/\/$/, '');

const entity = JSON.parse(
  fs.readFileSync(path.join(legalConfigDir, 'entity.json'), 'utf8')
);
const { documents: allDocuments } = JSON.parse(
  fs.readFileSync(path.join(legalConfigDir, 'documents.ru.json'), 'utf8')
);

const hasField = (field) => !!String(entity[field] ?? '').trim();
const isAvailable = (item) => (item.requires ?? []).every(hasField);

/** Документы и блоки с незаполненными реквизитами не публикуем. */
const documents = allDocuments.filter(isAvailable).map((document) => ({
  ...document,
  sections: document.sections
    .filter(isAvailable)
    .map((section) => ({
      ...section,
      blocks: section.blocks.filter(isAvailable),
    }))
    .filter((section) => section.blocks.length > 0),
}));

const skipped = allDocuments.filter((document) => !isAvailable(document));

function fill(text) {
  return text.replace(/{{(\w+)}}/g, (_match, key) => {
    const value = entity[key];
    return value && String(value).trim() ? String(value) : '';
  });
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBlock(block) {
  if (block.type === 'p') {
    return `<p>${escapeHtml(fill(block.text))}</p>`;
  }
  if (block.type === 'note') {
    return `<div class="note">${escapeHtml(fill(block.text))}</div>`;
  }
  if (block.type === 'list') {
    const items = block.items
      .map((item) => `<li>${escapeHtml(fill(item))}</li>`)
      .join('\n        ');
    return `<ul>\n        ${items}\n      </ul>`;
  }
  const rows = block.fields
    .map(
      (field) =>
        `<div class="field"><dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(
          fill(field.value)
        )}</dd></div>`
    )
    .join('\n        ');
  return `<dl>\n        ${rows}\n      </dl>`;
}

const STYLES = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 40px 20px 72px;
    background: #12161d;
    color: #f4f4f5;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    line-height: 1.6;
  }
  .wrap { max-width: 760px; margin: 0 auto; }
  a { color: #f6c01b; }
  .back { display: inline-block; margin-bottom: 24px; font-size: 14px; text-decoration: none; }
  .back:hover { text-decoration: underline; }
  h1 { font-size: 28px; line-height: 1.25; margin: 0 0 8px; }
  .short { color: rgba(244, 244, 245, 0.66); margin: 0 0 12px; }
  .badge {
    display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 13px;
    border: 1px solid rgba(132, 176, 230, 0.28); background: rgba(132, 176, 230, 0.1);
    color: rgba(216, 228, 247, 0.9);
  }
  section {
    margin-top: 22px; padding: 18px 20px; border-radius: 16px;
    border: 1px solid rgba(132, 176, 230, 0.16); background: rgba(255, 255, 255, 0.025);
  }
  h2 { font-size: 18px; margin: 0 0 10px; }
  p { margin: 0 0 10px; color: rgba(244, 244, 245, 0.82); }
  ul { margin: 0 0 10px; padding-left: 20px; color: rgba(244, 244, 245, 0.8); }
  li { margin-bottom: 6px; }
  .note {
    border-radius: 12px; padding: 12px 14px; margin: 10px 0;
    border: 1px solid rgba(246, 192, 27, 0.3); background: rgba(246, 192, 27, 0.08);
  }
  dl { margin: 0; }
  .field { margin-bottom: 10px; }
  dt { font-size: 13px; color: rgba(244, 244, 245, 0.5); }
  dd { margin: 2px 0 0; }
  .docs { list-style: none; padding: 0; }
  .docs li { margin-bottom: 12px; }
  .docs a { font-size: 17px; font-weight: 600; text-decoration: none; }
  .docs a:hover { text-decoration: underline; }
  .docs .short { margin: 2px 0 0; font-size: 14px; }
  footer { margin-top: 28px; font-size: 13px; color: rgba(244, 244, 245, 0.45); }
`;

function page({ title, description, canonicalPath, body }) {
  return `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} — ${escapeHtml(entity.brand)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${SITE_URL}${canonicalPath}" />
    <style>${STYLES}</style>
  </head>
  <body>
    <div class="wrap">
${body}
      <footer>
        © ${new Date().getFullYear()} ${escapeHtml(entity.brand)} · 18+ ·
        <a href="${SITE_URL}/legal/">Все документы</a>
      </footer>
    </div>
  </body>
</html>
`;
}

fs.mkdirSync(outDir, { recursive: true });

for (const document of documents) {
  const sections = document.sections
    .map(
      (section) =>
        `      <section>\n        <h2>${escapeHtml(section.title)}</h2>\n        ${section.blocks
          .map(renderBlock)
          .join('\n        ')}\n      </section>`
    )
    .join('\n');

  const body = `      <a class="back" href="${SITE_URL}/legal/">← Все документы</a>
      <h1>${escapeHtml(document.title)}</h1>
      <p class="short">${escapeHtml(document.short)}</p>
      <span class="badge">Редакция от ${escapeHtml(entity.updatedAt)}</span>
${sections}`;

  const html = page({
    title: document.title,
    description: document.short,
    canonicalPath: `/legal/${document.slug}.html`,
    body,
  });

  fs.writeFileSync(path.join(outDir, `${document.slug}.html`), html, 'utf8');
  console.log(`[legal] /legal/${document.slug}.html`);
}

const indexBody = `      <a class="back" href="${SITE_URL}/">← В приложение</a>
      <h1>Документы ${escapeHtml(entity.brand)}</h1>
      <p class="short">Условия использования, правила оплаты и обработка персональных данных.</p>
      <span class="badge">Редакция от ${escapeHtml(entity.updatedAt)}</span>
      <section>
        <ul class="docs">
${documents
  .map(
    (document) =>
      `          <li>\n            <a href="${SITE_URL}/legal/${document.slug}.html">${escapeHtml(
        document.title
      )}</a>\n            <p class="short">${escapeHtml(document.short)}</p>\n          </li>`
  )
  .join('\n')}
        </ul>
      </section>`;

fs.writeFileSync(
  path.join(outDir, 'index.html'),
  page({
    title: 'Документы',
    description:
      'Пользовательское соглашение, политика конфиденциальности, публичная оферта и реквизиты сервиса.',
    canonicalPath: '/legal/',
    body: indexBody,
  }),
  'utf8'
);
console.log('[legal] /legal/index.html');

// Страницы скрытых документов удаляем, чтобы не остались старые версии.
for (const document of skipped) {
  const stale = path.join(outDir, `${document.slug}.html`);
  if (fs.existsSync(stale)) {
    fs.rmSync(stale);
  }
  console.log(`[legal] пропущен: ${document.id} (нет реквизитов)`);
}

const missing = ['legalStatus', 'legalName', 'inn', 'email'].filter(
  (field) => !hasField(field)
);
if (missing.length) {
  console.warn(
    `[legal] ВНИМАНИЕ: не заполнены реквизиты (${missing.join(', ')}) — ` +
      'см. src/shared/config/legal/entity.json. Блоки с реквизитами скрыты.'
  );
}
