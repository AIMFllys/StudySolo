'use client';

import { useCallback, useEffect } from 'react';
import { X, Info } from 'lucide-react';

interface CanvasModalProps {
  title: string;
  message: string;
  onClose: () => void;
}

/**
 * Simple overlay modal for canvas notifications.
 * Used for "coming soon" and "not supported" messages.
 */
export default function CanvasModal({ title, message, onClose }: CanvasModalProps) {
  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  return (
    <div className="canvas-modal-backdrop" onClick={handleBackdropClick}>
      <div className="canvas-modal-content">
        <div className="canvas-modal-header">
          <div className="canvas-modal-icon">
            <Info className="h-5 w-5" />
          </div>
          <h3 className="canvas-modal-title">{title}</h3>
          <button
            type="button"
            className="canvas-modal-close"
            onClick={onClose}
            title="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="canvas-modal-message">{message}</p>
        <button
          type="button"
          className="canvas-modal-btn"
          onClick={onClose}
        >
          知道了
        </button>
      </div>
    </div>
  );
}
