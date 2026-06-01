const STORAGE_KEY = 'tarot_slow_connection_banner_dismissed';

export function isSlowConnectionBannerDismissed(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }

  return sessionStorage.getItem(STORAGE_KEY) === '1';
}

export function dismissSlowConnectionBanner(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }

  sessionStorage.setItem(STORAGE_KEY, '1');
}
