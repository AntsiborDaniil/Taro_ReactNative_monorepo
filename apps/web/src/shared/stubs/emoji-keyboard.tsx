import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Emoji = { emoji: string };
type Props = {
  open?: boolean;
  onClose?: () => void;
  onEmojiSelected?: (emoji: Emoji) => void;
};

const EMOJI = ['😊', '🔥', '🌙', '💡', '🌱', '💪', '🎯', '📚', '🧘', '⭐'];

const blurActiveElement = () => {
  if (typeof document === 'undefined') return;
  const active = document.activeElement as HTMLElement | null;
  active?.blur?.();
};

export default function EmojiPicker({ open, onClose, onEmojiSelected }: Props) {
  if (!open) return null;

  return (
    <View
      style={styles.overlay}
      onTouchEnd={() => {
        blurActiveElement();
      }}
    >
      <View style={styles.modal}>
        <View style={styles.row}>
          {EMOJI.map((item) => (
            <Pressable
              key={item}
              style={styles.cell}
              onPress={() => {
                blurActiveElement();
                onEmojiSelected?.({ emoji: item });
                onClose?.();
              }}
            >
              <Text style={styles.emoji}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'fixed' as any,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modal: {
    width: 320,
    backgroundColor: '#1E232B',
    borderRadius: 16,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333A43',
  },
  emoji: {
    fontSize: 22,
  },
});
