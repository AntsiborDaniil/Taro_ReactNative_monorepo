import React from 'react';

type EmojiPickerProps = {
  open?: boolean;
  onClose?: () => void;
  onEmojiSelected?: (emoji: { emoji: string }) => void;
  hideHeader?: boolean;
  [key: string]: unknown;
};

const EMOJIS = [
  '😀','😂','😍','🥰','😎','🤩','🥳','😇','🤗','😌',
  '💪','🌟','✨','🔥','💫','🎯','🎉','🏆','💡','❤️',
  '🌱','🍀','🌸','🌙','☀️','⚡','🦋','🌈','🎵','🎶',
  '🧘','🏃','💤','📝','📚','🎨','🖌️','🎸','🍎','💧',
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  open,
  onClose,
  onEmojiSelected,
}) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a2233',
          borderRadius: '16px 16px 0 0',
          padding: 20,
          width: '100%',
          maxWidth: 480,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          maxHeight: '50vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onEmojiSelected?.({ emoji });
              onClose?.();
            }}
            style={{
              fontSize: 28,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 8,
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
