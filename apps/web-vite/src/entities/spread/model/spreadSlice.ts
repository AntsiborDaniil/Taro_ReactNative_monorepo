import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TSelectedTarotCard, TSpreadFollowUp, TSpreadMemoryNote, TSpreadMemoryStats } from '@legacy-data';
import type { TSpread } from './catalog';

export type SpreadFlowStatus = 'choosing' | 'interpreting' | 'done' | 'error';

export type SpreadState = {
  /** Клон выбранного расклада каталога (не мутирует catalog.ts) + runtime-поля (selectedCards/question/interpretation). */
  selectedSpread: TSpread | null;
  question: string;
  status: SpreadFlowStatus;
  errorCode: string | null;
  /** Расклад открыт по шаренной ссылке — читатель видит уточнения, но не может задавать новые. */
  openedAsShared: boolean;
};

const initialState: SpreadState = {
  selectedSpread: null,
  question: '',
  status: 'choosing',
  errorCode: null,
  openedAsShared: false,
};

const spreadSlice = createSlice({
  name: 'spread',
  initialState,
  reducers: {
    /** Клонируем из каталога — selectedCards/question/interpretation runtime, catalog.ts остаётся неизменным эталоном. */
    selectSpread(state, action: PayloadAction<TSpread>) {
      state.selectedSpread = {
        ...action.payload,
        selectedCards: [],
        question: '',
        interpretation: '',
      };
      state.question = '';
      state.status = 'choosing';
      state.errorCode = null;
      state.openedAsShared = false;
    },
    setQuestion(state, action: PayloadAction<string>) {
      state.question = action.payload;
      if (state.selectedSpread) {
        state.selectedSpread.question = action.payload;
      }
    },
    addSelectedCard(state, action: PayloadAction<TSelectedTarotCard>) {
      if (!state.selectedSpread) return;
      if (state.selectedSpread.selectedCards.length >= state.selectedSpread.cardsCount) return;
      state.selectedSpread.selectedCards.push(action.payload);
    },
    /** Сразу заполнить оставшиеся слоты (кнопка «вытянуть все» в CardChoice). */
    addSelectedCards(state, action: PayloadAction<TSelectedTarotCard[]>) {
      if (!state.selectedSpread || action.payload.length === 0) return;
      const room = state.selectedSpread.cardsCount - state.selectedSpread.selectedCards.length;
      if (room <= 0) return;
      state.selectedSpread.selectedCards.push(...action.payload.slice(0, room));
    },
    clearSelectedCards(state) {
      if (!state.selectedSpread) return;
      state.selectedSpread.selectedCards = [];
    },
    setInterpretation(state, action: PayloadAction<string>) {
      if (!state.selectedSpread) return;
      state.selectedSpread.interpretation = action.payload;
      state.status = 'done';
      state.errorCode = null;
    },
    /** Результат /interpret: текст + факт памяти + пометка «Глубокий разбор». */
    setInterpretationResult(
      state,
      action: PayloadAction<{
        interpretation: string;
        memoryNote?: TSpreadMemoryNote | null;
        memoryStats?: TSpreadMemoryStats | null;
        mode?: 'deep';
      }>,
    ) {
      if (!state.selectedSpread) return;
      state.selectedSpread.interpretation = action.payload.interpretation;
      state.selectedSpread.memoryNote = action.payload.memoryNote ?? undefined;
      state.selectedSpread.memoryStats = action.payload.memoryStats ?? undefined;
      state.selectedSpread.mode = action.payload.mode;
      state.status = 'done';
      state.errorCode = null;
    },
    setStatus(state, action: PayloadAction<SpreadFlowStatus>) {
      state.status = action.payload;
      // Новый запрос толкования — убираем прошлую ошибку, иначе UI залипает на error.
      if (action.payload === 'interpreting') {
        state.errorCode = null;
      }
    },
    setError(state, action: PayloadAction<string | null>) {
      state.status = 'error';
      state.errorCode = action.payload;
    },
    /** После сохранения в историю (локально/облако) — uid/date/packKey нужны для повторного сохранения и шаринга. */
    setSpreadMeta(state, action: PayloadAction<{ uid?: string; date?: string; packKey?: string; shareQuestion?: boolean }>) {
      if (!state.selectedSpread) return;
      Object.assign(state.selectedSpread, action.payload);
    },
    /**
     * Открыть уже сохранённый расклад (история /history, шаренная ссылка) —
     * в отличие от selectSpread, НЕ сбрасывает selectedCards/interpretation:
     * экран /reading увидит его уже «завершённым» и покажет готовый ответ
     * без повторной интерпретации.
     */
    openSavedSpread(state, action: PayloadAction<TSpread>) {
      state.selectedSpread = action.payload;
      state.question = action.payload.question ?? '';
      state.status = action.payload.interpretation ? 'done' : 'choosing';
      state.errorCode = null;
      state.openedAsShared = false;
    },
    /** Открыть чужой расклад по шаренной ссылке: уточнения только для чтения. */
    openSharedSpread(state, action: PayloadAction<TSpread>) {
      state.selectedSpread = action.payload;
      state.question = action.payload.question ?? '';
      state.status = action.payload.interpretation ? 'done' : 'choosing';
      state.errorCode = null;
      state.openedAsShared = true;
    },
    /** Обновить список уточнений выбранного расклада (после ответа AI и сохранения). */
    setFollowUps(state, action: PayloadAction<TSpreadFollowUp[]>) {
      if (!state.selectedSpread) return;
      state.selectedSpread.followUps = action.payload;
    },
    clearSpread(state) {
      state.selectedSpread = null;
      state.question = '';
      state.status = 'choosing';
      state.errorCode = null;
      state.openedAsShared = false;
    },
  },
});

export const {
  selectSpread,
  setQuestion,
  addSelectedCard,
  addSelectedCards,
  clearSelectedCards,
  setInterpretation,
  setInterpretationResult,
  setStatus,
  setError,
  setSpreadMeta,
  openSavedSpread,
  openSharedSpread,
  setFollowUps,
  clearSpread,
} = spreadSlice.actions;
export const spreadReducer = spreadSlice.reducer;
