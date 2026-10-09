/**
 * Черновик настроек пары между экранами «описание расклада» → «выбор карт».
 * Вопрос лежит в state.spread, остальное — здесь (sessionStorage переживает перезагрузку вкладки).
 */
import type { PairRelation } from './types';

export type PairDraft = { showQuestion: boolean; inviterName: string; relation: PairRelation };

const KEY = 'mt.pairDraft.v1';
export const PAIR_NAME_MAX = 24;
export const PAIR_QUESTION_MAX = 280;

export function loadPairDraft(): PairDraft {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PairDraft>;
      return {
        showQuestion: parsed.showQuestion === true,
        inviterName: typeof parsed.inviterName === 'string' ? parsed.inviterName.slice(0, PAIR_NAME_MAX) : '',
        // Пара теперь — отдельный «Расклад для парочки»; здесь только друзья и близкие.
        relation: parsed.relation === 'family' ? 'family' : 'friend',
      };
    }
  } catch {
    /* sessionStorage недоступен (private mode) */
  }
  return { showQuestion: false, inviterName: '', relation: 'friend' };
}

export function savePairDraft(draft: PairDraft): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

export function clearPairDraft(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
