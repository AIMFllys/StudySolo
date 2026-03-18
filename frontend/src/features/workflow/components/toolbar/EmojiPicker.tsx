'use client';

import { useCallback } from 'react';
import { X } from 'lucide-react';

const EMOJI_LIST = [
  '⭐', '❤️', '🔥', '💡', '⚡', '✅', '❌', '⚠️',
  '📌', '🎯', '🚀', '💬', '📝', '🔍', '🎨', '🧩',
  '📊', '🔧', '🐛', '💎', '🏆', '🎉', '👍', '👎',
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

/**
 * Simple emoji picker panel that appears above the toolbar.
 * User picks an emoji to place on the canvas as an annotation.
 */
export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const handleSelect = useCallback(
    (emoji: string) => {
      onSelect(emoji);
      onClose();
    },
    [onSelect, onClose]
  );

  return (
    <div className="canvas-emoji-picker">
      <div className="canvas-emoji-header">
        <span className="canvas-emoji-title">添加标注</span>
        <button
          type="button"
          className="canvas-emoji-close"
          onClick={onClose}
          title="关闭"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="canvas-emoji-grid">
        {EMOJI_LIST.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="canvas-emoji-btn"
            onClick={() => handleSelect(emoji)}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
