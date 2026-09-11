import { Platform } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

/**
 * Telegram iOS WebView rejects Clipboard API and ignores off-screen textareas.
 * execCommand must run synchronously in the same tap, with the node in-viewport.
 */
function copyWithTextarea(text: string): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText =
    'position:fixed;top:0;left:0;width:2px;height:2px;padding:0;margin:0;border:0;outline:none;opacity:0.01;z-index:99999;';
  document.body.appendChild(el);
  el.focus();
  el.select();
  el.setSelectionRange(0, text.length);

  const selection = window.getSelection?.();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(el);
  return ok;
}

/** Copy must run in the same user-gesture tick — do not await network or haptics first. */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (Platform.OS !== 'web') {
    Clipboard.setString(text);
    return true;
  }

  // Sync path first: awaits on clipboard.writeText drop the Telegram user gesture.
  if (copyWithTextarea(text)) {
    return true;
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Telegram WebView often rejects Clipboard API.
  }

  return false;
}
