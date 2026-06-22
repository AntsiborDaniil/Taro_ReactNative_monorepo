import { Platform } from 'react-native';

export const WEB_SCROLL_Y_CLASS = 'tarot-web-scroll-y';
export const WEB_CARD_MEANINGS_CLASS = 'tarot-card-meanings';
export const WEB_SCROLL_Y_DRAGGING_CLASS = 'tarot-web-scroll-y--dragging';
export const WEB_CARD_TILE_CLASS = 'tarot-web-card-tile';

export function webVerticalScrollProps(): { className?: string } {
  return Platform.OS === 'web' ? { className: WEB_SCROLL_Y_CLASS } : {};
}

export function webCardMeaningsProps(): { className?: string } {
  return Platform.OS === 'web' ? { className: WEB_CARD_MEANINGS_CLASS } : {};
}

/** Library card tile: pan-y on touch so parent list scrolls when swiping on cards. */
export function webCardTileProps(): {
  className?: string;
  dataSet?: { tarotCardTile: string };
} {
  return Platform.OS === 'web'
    ? {
        className: WEB_CARD_TILE_CLASS,
        dataSet: { tarotCardTile: 'true' },
      }
    : {};
}
