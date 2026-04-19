export function blurActiveElement(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const active = document.activeElement as HTMLElement | null;
  active?.blur?.();
}

