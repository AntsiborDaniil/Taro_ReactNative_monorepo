/** Копирование в буфер — с запасными путями для Telegram WebView (Clipboard API часто блокируется). */

function copyViaEvent(text: string): boolean {
  if (typeof document === 'undefined') return false;
  let copied = false;
  const onCopy = (event: ClipboardEvent) => {
    event.clipboardData?.setData('text/plain', text);
    event.preventDefault();
    copied = true;
  };
  document.addEventListener('copy', onCopy);
  try {
    copied = document.execCommand('copy') || copied;
  } catch {
    copied = false;
  }
  document.removeEventListener('copy', onCopy);
  return copied;
}

function copyWithField(text: string): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText =
    'position:fixed;top:12px;left:12px;width:8px;height:8px;padding:0;margin:0;border:0;opacity:0.01;z-index:2147483647;';
  document.body.appendChild(el);
  el.focus();
  el.select();
  el.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(el);
  return ok;
}

/** Синхронно в том же click-тике — без await до вызова. */
export function copyTextToClipboardSync(text: string): boolean {
  if (copyViaEvent(text)) return true;
  return copyWithField(text);
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (copyTextToClipboardSync(text)) return true;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Telegram WebView часто отклоняет Clipboard API.
  }
  return false;
}
