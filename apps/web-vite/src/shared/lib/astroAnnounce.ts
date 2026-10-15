const KEY = 'astroAnnounceSeen';

/** Анонс «Новое: твоё небо» на Таро-Главной виден, пока человек ни разу не заходил в /astro. */
export function isAstroAnnounceVisible(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== '1';
  } catch {
    return true;
  }
}

/** Вызывается при первом заходе в астро-мир: анонс прячется навсегда. */
export function markAstroVisited(): void {
  try {
    window.localStorage.setItem(KEY, '1');
  } catch {
    /* приватный режим — просто покажем анонс снова */
  }
}
