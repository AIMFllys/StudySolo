'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface SliderCaptchaProps {
  onVerified: (token: string) => void;
  disabled?: boolean;
}

export default function SliderCaptcha({
  onVerified,
  disabled = false,
}: SliderCaptchaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const threshold = 0.9;

  const getTrackWidth = useCallback(() => {
    return trackRef.current ? trackRef.current.offsetWidth - 44 : 0;
  }, []);

  const handleStart = useCallback(
    (clientX: number) => {
      if (verified || disabled || verifying) return;
      setIsDragging(true);
      setError('');
      startXRef.current = clientX - position;
    },
    [verified, disabled, verifying, position]
  );

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      const trackWidth = getTrackWidth();
      const newPos = Math.min(Math.max(0, clientX - startXRef.current), trackWidth);
      setPosition(newPos);
    },
    [isDragging, getTrackWidth]
  );

  const handleEnd = useCallback(async () => {
    if (!isDragging) return;
    setIsDragging(false);

    const trackWidth = getTrackWidth();
    const ratio = trackWidth > 0 ? position / trackWidth : 0;

    if (ratio >= threshold) {
      setVerifying(true);
      try {
        const res = await fetch('/api/auth/captcha-token', { method: 'POST' });
        if (!res.ok) throw new Error('验证失败');
        const data = await res.json();
        setVerified(true);
        setPosition(trackWidth);
        onVerified(data.token);
      } catch {
        setError('验证失败，请重试');
        setPosition(0);
      } finally {
        setVerifying(false);
      }
      return;
    }

    setPosition(0);
  }, [isDragging, position, getTrackWidth, onVerified, threshold]);

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => {
      void handleEnd();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handleMove, handleEnd]);

  useEffect(() => {
    if (!isDragging) return;
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const onTouchEnd = () => {
      void handleEnd();
    };

    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div className="flex flex-col gap-1.5">
      <div
        ref={trackRef}
        className={`relative h-10 select-none overflow-hidden rounded-lg border transition-colors ${
          verified
            ? 'border-emerald-500/30 bg-emerald-500/10'
            : error
              ? 'border-red-500/30 bg-red-500/10'
              : 'border-white/[0.08] bg-[#0F172A]/50'
        }`}
      >
        <div
          className={`absolute inset-y-0 left-0 transition-colors ${
            verified ? 'bg-emerald-500/20' : 'bg-primary/10'
          }`}
          style={{ width: position + 44 }}
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            className={`text-xs transition-opacity ${
              verified
                ? 'text-emerald-400'
                : position > 10
                  ? 'opacity-0'
                  : 'text-[#94A3B8]/60'
            }`}
          >
            {verified ? '✓ 验证通过' : verifying ? '验证中...' : '请拖动滑块到最右侧'}
          </span>
        </div>

        <div
          className={`absolute left-0 top-0 flex h-full w-11 items-center justify-center rounded-lg transition-shadow ${
            verified
              ? 'cursor-default bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
              : isDragging
                ? 'cursor-grabbing bg-primary shadow-[0_0_16px_rgba(99,102,241,0.5)]'
                : 'cursor-grab bg-[#334155] hover:bg-[#475569]'
          } ${disabled && !verified ? 'cursor-default' : ''}`}
          style={{ transform: `translateX(${position}px)` }}
          onMouseDown={(e) => handleStart(e.clientX)}
          onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        >
          {verified ? (
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-white/70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>

      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
