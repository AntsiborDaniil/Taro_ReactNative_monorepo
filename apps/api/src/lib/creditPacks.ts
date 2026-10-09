/**
 * Пакеты зарядов Lava.top. У каждого пакета — свой оффер (продукт) в кабинете
 * Lava; вебхук один на все. Цена здесь — только для витрины: списывает Lava по
 * цене оффера, поэтому priceRub должен совпадать с ценой в кабинете.
 */
export type CreditPackId = 'plus3' | 'plus9' | 'plus15';

export type CreditPack = {
  id: CreditPackId;
  credits: number;
  priceRub: number;
  /** Переменная окружения с id оффера Lava. */
  offerEnv: string;
  /** Метка для витрины: «Популярный» / «Выгоднее всего». */
  badge?: 'popular' | 'best';
};

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'plus3', credits: 3, priceRub: 129, offerEnv: 'LAVA_OFFER_ID' },
  { id: 'plus9', credits: 9, priceRub: 249, offerEnv: 'LAVA_OFFER_ID_9', badge: 'popular' },
  { id: 'plus15', credits: 15, priceRub: 379, offerEnv: 'LAVA_OFFER_ID_15', badge: 'best' },
];

export const DEFAULT_CREDIT_PACK: CreditPackId = 'plus3';

export function findCreditPack(id: string | undefined | null): CreditPack | null {
  return CREDIT_PACKS.find((pack) => pack.id === id) ?? null;
}

export function getPackOfferId(pack: CreditPack): string | undefined {
  return process.env[pack.offerEnv]?.trim() || undefined;
}

/**
 * Число зарядов в +3: раньше задавалось LAVA_CREDITS_PER_PURCHASE — оставляем
 * совместимость для уже настроенного прода.
 */
export function packCredits(pack: CreditPack): number {
  if (pack.id !== 'plus3') return pack.credits;
  const raw = process.env.LAVA_CREDITS_PER_PURCHASE?.trim();
  const parsed = raw ? Number(raw) : pack.credits;
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : pack.credits;
}

/** Пакеты, для которых настроен оффер, — их и показываем на витрине. */
export function listAvailablePacks(): Array<{ id: CreditPackId; credits: number; priceRub: number; badge?: string }> {
  return CREDIT_PACKS.filter((pack) => getPackOfferId(pack)).map((pack) => ({
    id: pack.id,
    credits: packCredits(pack),
    priceRub: pack.priceRub,
    badge: pack.badge,
  }));
}
