/**
 * Список продуктов Lava.top и их офферов — чтобы взять id ОФФЕРА для
 * LAVA_OFFER_ID / LAVA_OFFER_ID_9 / LAVA_OFFER_ID_15 (в ссылке кабинета — id продукта).
 * Запуск: node --env-file=.env scripts/lava-offers.mjs
 */
const key = process.env.LAVA_API_KEY?.trim();
const base = (process.env.LAVA_API_BASE_URL?.trim() || 'https://gate.lava.top').replace(/\/$/, '');
if (!key) {
  console.error('Нет LAVA_API_KEY в окружении.');
  process.exit(1);
}

const response = await fetch(`${base}/api/v2/products`, { headers: { Accept: 'application/json', 'X-Api-Key': key } });
const body = await response.json().catch(() => null);
if (!response.ok) {
  console.error(`Lava ответила ${response.status}:`, body);
  process.exit(1);
}

const items = Array.isArray(body) ? body : body?.items ?? body?.data ?? [];
if (!items.length) {
  console.log(JSON.stringify(body, null, 2));
  process.exit(0);
}
for (const product of items) {
  console.log(`\n${product.title ?? product.name ?? '(без названия)'}\n  product: ${product.id}`);
  for (const offer of product.offers ?? []) {
    const prices = (offer.prices ?? []).map((p) => `${p.amount} ${p.currency}`).join(', ');
    console.log(`  offer:   ${offer.id}  ${offer.name ?? ''} ${prices ? `(${prices})` : ''}`);
  }
}
