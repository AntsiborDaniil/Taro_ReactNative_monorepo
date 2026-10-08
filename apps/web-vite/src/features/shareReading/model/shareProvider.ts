/**
 * Мост «страница результата → лист шаринга». Лист открывается через реестр
 * модалок (props в redux должны быть сериализуемыми), поэтому функцию
 * «дожать сохранение и вернуть uid» страница регистрирует здесь, а лист берёт её отсюда.
 */
export type ShareProvider = {
  /** Сохраняет расклад в облако (с флагом shareQuestion) и возвращает uid для ссылки либо null. */
  ensureUid: (shareQuestion: boolean) => Promise<string | null>;
  /** Нужен ли вход, чтобы поделиться (гость без облачной записи). */
  isAuthenticated: boolean;
};

let current: ShareProvider | null = null;

export function registerShareProvider(provider: ShareProvider): () => void {
  current = provider;
  return () => {
    if (current === provider) current = null;
  };
}

export function getShareProvider(): ShareProvider | null {
  return current;
}
