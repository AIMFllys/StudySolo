'use client';

import { useCallback, useRef, useEffect } from 'react';

interface ResizableHandleProps {
  /** Direction the handle controls */
  side: 'left' | 'right';
  /** Current width value */
  currentWidth: number;
  /** Callback when width changes */
  onWidthChange: (width: number) => void;
  /** Min width constraint */
  minWidth?: number;
  /** Max width constraint */
  maxWidth?: number;
}

/**
 * VS Code-style drag handle for resizable panels.
 * Uses pointer events for smooth, cross-device dragging.
 */
export default function ResizableHandle({
  side,
  currentWidth,
  onWidthChange,
  minWidth = 200,
  maxWidth = 480,
}: ResizableHandleProps) {
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const rafRef = useRef<number>(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = currentWidth;

      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [currentWidth]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const delta = e.clientX - startXRef.current;
        const newWidth =
          side === 'left'
            ? startWidthRef.current + delta
            : startWidthRef.current - delta;

        const clamped = Math.min(maxWidth, Math.max(minWidth, newWidth));
        onWidthChange(clamped);
      });
    },
    [side, onWidthChange, minWidth, maxWidth]
  );

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  return (
    <div
      className="group relative z-20 flex h-full w-1 shrink-0 cursor-col-resize items-center justify-center touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={currentWidth}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      tabIndex={0}
    >
      {/* Visual indicator — subtle line that glows on hover/drag */}
      <div className="h-full w-px bg-border transition-colors duration-150 group-hover:bg-primary/60 group-active:bg-primary" />
    </div>
  );
}
