'use client';

import { memo } from 'react';
import { AlertCircle, Check, GripVertical, RefreshCw } from 'lucide-react';
import { HEIGHT, WIDTH } from './constants';
import { useSliderCaptcha } from './use-slider-captcha';

interface SliderCaptchaProps {
  onVerified: (token: string) => void;
  disabled?: boolean;
}

function SliderCaptcha({ onVerified, disabled = false }: SliderCaptchaProps) {
  const {
    canvasRef,
    blockRef,
    sliderLeft,
    verified,
    verifying,
    failed,
    apiError,
    isDragging,
    canvasReady,
    handleDragStart,
    refresh,
  } = useSliderCaptcha({ disabled, onVerified });

  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0f1e]"
        style={{ width: WIDTH, height: HEIGHT }}
      >
        {canvasReady ? (
          <>
            <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="block" />
            <canvas
              ref={blockRef}
              width={WIDTH}
              height={HEIGHT}
              className="absolute top-0 left-0"
              style={{
                transition: isDragging.current ? 'none' : 'left 0.3s ease',
                filter: verified
                  ? 'drop-shadow(0 0 10px rgba(16,185,129,0.5))'
                  : failed
                    ? 'drop-shadow(0 0 10px rgba(239,68,68,0.5))'
                    : 'drop-shadow(2px 0 6px rgba(0,0,0,0.6))',
              }}
            />
            {verified ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-4 py-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">验证通过</span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={refresh}
                className="absolute top-2 right-2 rounded-lg border border-white/10 bg-black/40 p-1.5 text-white/50 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
                title="刷新验证码"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center text-xs text-slate-500" style={{ height: HEIGHT }}>
            加载验证码…
          </div>
        )}
      </div>

      <div
        className={`relative h-11 select-none overflow-hidden rounded-xl border transition-all duration-300 ${
          verified
            ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
            : failed
              ? 'border-red-500/30 bg-red-500/[0.06]'
              : 'border-white/[0.06] bg-[#0a0f1e]'
        }`}
        style={{ width: WIDTH }}
      >
        <div
          className={`absolute inset-y-0 left-0 transition-colors ${
            verified ? 'bg-emerald-500/15' : failed ? 'bg-red-500/10' : 'bg-indigo-500/10'
          }`}
          style={{ width: sliderLeft + 44 }}
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            className={`text-xs font-medium transition-all ${
              verified
                ? 'text-emerald-400'
                : failed
                  ? 'text-red-400'
                  : sliderLeft > 5
                    ? 'opacity-0'
                    : 'text-slate-500'
            }`}
          >
            {verified
              ? '✓ 人机验证通过'
              : failed
                ? apiError
                  ? '验证服务异常，请稍后重试'
                  : '拼合不准确，请重试'
                : verifying
                  ? '验证中...'
                  : '拖动滑块完成拼图验证'}
          </span>
        </div>

        <div
          className={`absolute left-0 top-0 flex h-full w-11 items-center justify-center rounded-xl transition-all duration-200 ${
            verified
              ? 'cursor-default bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
              : failed
                ? 'cursor-not-allowed bg-red-500/80'
                : 'cursor-grab border border-white/10 bg-white/10 hover:bg-white/15 active:cursor-grabbing active:bg-indigo-500 active:shadow-[0_0_16px_rgba(99,102,241,0.5)]'
          } ${disabled && !verified ? 'cursor-default opacity-50' : ''}`}
          style={{
            transform: `translateX(${sliderLeft}px)`,
            transition: isDragging.current ? 'none' : 'transform 0.3s ease',
          }}
          onMouseDown={(event) => {
            event.preventDefault();
            handleDragStart(event.clientX);
          }}
          onTouchStart={(event) => handleDragStart(event.touches[0].clientX)}
        >
          {verified ? (
            <Check className="h-5 w-5 text-white" strokeWidth={3} />
          ) : failed ? (
            <AlertCircle className="h-4 w-4 text-white" />
          ) : (
            <GripVertical className="h-5 w-5 text-white/60" />
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(SliderCaptcha);
