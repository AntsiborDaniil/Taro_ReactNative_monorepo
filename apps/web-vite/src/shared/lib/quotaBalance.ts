/**
 * Баланс «доступных раскладов»: бесплатный дневной слот + платные заряды.
 * Единый источник для бейджа в шапке и модалки пополнения — чтобы цифры не расходились.
 */

export type QuotaBalanceInput = {
  tarotDaily: { used: number; limit: number } | null | undefined;
  spreadCredits: number | null | undefined;
};

export type QuotaBalance = {
  /** Дневная квота известна (иначе показываем «…», а не ложный «0»). */
  quotaReady: boolean;
  /** Остаток бесплатного дневного слота. */
  dailyRemaining: number;
  /** Платные заряды. */
  credits: number;
  /** dailyRemaining + credits. */
  total: number;
};

export function computeQuotaBalance({ tarotDaily, spreadCredits }: QuotaBalanceInput): QuotaBalance {
  const quotaReady = tarotDaily != null;
  const dailyRemaining = tarotDaily ? Math.max(0, tarotDaily.limit - tarotDaily.used) : 0;
  const credits = Math.max(0, Math.floor(spreadCredits ?? 0));
  return { quotaReady, dailyRemaining, credits, total: dailyRemaining + credits };
}
