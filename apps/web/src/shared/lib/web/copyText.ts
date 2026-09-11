import { Platform } from 'react-native';

/**
 * Copy text in Mini App / Safari. Must run in the same tick as the tap
 * when possible — awaiting network first drops the user-activation token.
 */
function copyTextWithExecCommand(text: string): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.setAttribute('aria-hidden', 'true');
    area.style.position = 'fixed';
    area.style.top = '0';
    area.style.left = '0';
    area.style.width = '1px';
    area.style.height = '1px';
    area.style.padding = '0';
    area.style.border = 'none';
    area.style.outline = 'none';
    area.style.boxShadow = 'none';
    area.style.background = 'transparent';
    area.style.opacity = '0.01';
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/** Same-tick copy for click handlers. Telegram Mini App often blocks Clipboard API. */
export function copyTextToClipboardSync(text: string): boolean {
  if (!text || Platform.OS !== 'web') {
    return false;
  }
  return copyTextWithExecCommand(text);
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) {
    return false;
  }

  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    if (copyTextWithExecCommand(text)) {
      return true;
    }

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  try {
    const Clipboard = require('@react-native-clipboard/clipboard').default;
    Clipboard.setString(text);
    return true;
  } catch {
    return false;
  }
}
