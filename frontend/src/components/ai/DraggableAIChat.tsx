'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Bot, X, Minus, GripHorizontal, Maximize2 } from 'lucide-react';
import { useMobileAIStore } from '@/stores/use-mobile-ai-store';
import { SidebarAIPanel } from '@/components/layout/sidebar/SidebarAIPanel';

interface Position {
  x: number;
  y: number;
}

export function DraggableAIChat() {
  const { isOpen, isMinimized, close, minimize, restore, position, setPosition } = useMobileAIStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Compute window size
  const windowSize = isExpanded
    ? { width: typeof window !== 'undefined' ? window.innerWidth : 375, height: typeof window !== 'undefined' ? window.innerHeight - 60 : 600 }
    : { width: Math.min(340, typeof window !== 'undefined' ? window.innerWidth - 16 : 340), height: Math.min(480, typeof window !== 'undefined' ? window.innerHeight - 120 : 480) };

  // Drag handlers
  const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!chatRef.current || isExpanded) return;

    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDragOffset({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  }, [position, isExpanded]);

  const handleDragMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const newX = Math.max(0, Math.min(clientX - dragOffset.x, window.innerWidth - windowSize.width));
    const newY = Math.max(0, Math.min(clientY - dragOffset.y, window.innerHeight - windowSize.height));

    setPosition({ x: newX, y: newY });
  }, [isDragging, dragOffset, windowSize, setPosition]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Attach global drag listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);

      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Prevent body scroll when expanded
  useEffect(() => {
    if (isOpen && isExpanded) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen, isExpanded]);

  if (!isOpen) return null;

  // Minimized state - floating bubble
  if (isMinimized) {
    return (
      <button
        onClick={restore}
        className="fixed z-[200] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center transition-all active:scale-95"
        style={{ left: position.x, top: position.y }}
        aria-label="打开AI助手"
      >
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  // Window position: expanded = fullscreen, normal = draggable
  const windowStyle = isExpanded
    ? { left: 0, top: 0, width: '100vw', height: 'calc(100vh - 56px)' }
    : { left: position.x, top: position.y, width: windowSize.width, height: windowSize.height };

  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[199] bg-black/30 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div
        ref={chatRef}
        className={`fixed z-[200] bg-background flex flex-col overflow-hidden transition-all duration-200 ${
          isExpanded
            ? 'rounded-none shadow-none'
            : `rounded-2xl shadow-2xl border border-border ${isDragging ? 'ring-2 ring-primary/20' : ''}`
        }`}
        style={windowStyle}
      >
        {/* Header - draggable area */}
        <div
          className={`flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border select-none shrink-0 ${
            isExpanded ? '' : 'cursor-grab active:cursor-grabbing'
          }`}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="flex items-center gap-2">
            {!isExpanded && <GripHorizontal className="h-4 w-4 text-muted-foreground" />}
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-medium">AI 助手</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label={isExpanded ? '缩小' : '全屏'}
            >
              <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={minimize}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="最小化"
            >
              <Minus className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => { close(); setIsExpanded(false); }}
              className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/30 hover:text-rose-600 transition-colors"
              aria-label="关闭"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Reuse desktop SidebarAIPanel — full AI logic */}
        <div className="flex-1 overflow-hidden">
          <SidebarAIPanel />
        </div>
      </div>
    </>
  );
}
