'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  memo,
} from 'react';
import { RefreshCw, Check, GripVertical, AlertCircle } from 'lucide-react';

/* ─── Types ─── */
interface SliderCaptchaProps {
  onVerified: (token: string) => void;
  disabled?: boolean;
}

/* ─── Constants ─── */
const W = 320;          // canvas width  (logical & CSS)
const H = 160;          // canvas height (logical & CSS)
const PIECE_L = 42;     // puzzle piece side length
const PIECE_R = 9;      // puzzle piece tab radius
const L = PIECE_L + PIECE_R * 2 + 3; // actual bounding size of piece
const PI = Math.PI;
const TOLERANCE = 6;    // px tolerance for matching

/* ─── BG themes (no external image needed) ─── */
const BG_THEMES = [
  { colors: ['#1e3a5f', '#0f172a', '#1a1a2e'], accent: '#6366f1' },
  { colors: ['#1a2744', '#0d1117', '#16213e'], accent: '#818cf8' },
  { colors: ['#0f2027', '#203a43', '#2c5364'], accent: '#10b981' },
  { colors: ['#1f1c2c', '#2d283e', '#1f1c2c'], accent: '#a78bfa' },
  { colors: ['#141e30', '#243b55', '#141e30'], accent: '#f472b6' },
];

/* ─── Seeded PRNG ─── */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randRange(rng: () => number, min: number, max: number) {
  return Math.floor(min + rng() * (max - min));
}

/* ─────────────────────────────────────────────────
 * Draw the standard jigsaw piece path.
 * Reference: venkatmcajj/react-puzzle-captcha
 *
 * Shape: square with tab on top + tab on right +
 *        indent on left side.
 * ───────────────────────────────────────────────── */
function drawPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  op: 'fill' | 'clip',
) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  // top tab
  ctx.arc(x + PIECE_L / 2, y - PIECE_R + 2, PIECE_R, 0.72 * PI, 2.26 * PI);
  ctx.lineTo(x + PIECE_L, y);
  // right tab
  ctx.arc(x + PIECE_L + PIECE_R - 2, y + PIECE_L / 2, PIECE_R, 1.21 * PI, 2.78 * PI);
  ctx.lineTo(x + PIECE_L, y + PIECE_L);
  // bottom (flat)
  ctx.lineTo(x, y + PIECE_L);
  // left indent
  ctx.arc(x + PIECE_R - 2, y + PIECE_L / 2, PIECE_R + 0.4, 2.76 * PI, 1.24 * PI, true);
  ctx.lineTo(x, y);
  ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.stroke();
  ctx.globalCompositeOperation = 'destination-over';
  if (op === 'fill') ctx.fill();
  else ctx.clip();
}

/* ─── Generate abstract background pattern ─── */
function paintBackground(ctx: CanvasRenderingContext2D, seed: number) {
  const rng = mulberry32(seed + 9999);
  const theme = BG_THEMES[seed % BG_THEMES.length];

  // gradient base
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, theme.colors[0]);
  grad.addColorStop(0.5, theme.colors[1]);
  grad.addColorStop(1, theme.colors[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // circles for complexity
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    ctx.arc(rng() * W, rng() * H, 8 + rng() * 50, 0, PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${(0.02 + rng() * 0.06).toFixed(3)})`;
    ctx.fill();
  }

  // accent blobs
  for (let i = 0; i < 4; i++) {
    const bx = rng() * W;
    const by = rng() * H;
    const br = 20 + rng() * 60;
    const rg = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    rg.addColorStop(0, theme.accent + '18');
    rg.addColorStop(1, 'transparent');
    ctx.fillStyle = rg;
    ctx.fillRect(bx - br, by - br, br * 2, br * 2);
  }

  // grid dots
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let gx = 0; gx < W; gx += 20) {
    for (let gy = 0; gy < H; gy += 20) {
      ctx.fillRect(gx, gy, 1, 1);
    }
  }
}

/* ─────────────────────────────────────────────────
 * Main component
 * ───────────────────────────────────────────────── */
function SliderCaptcha({ onVerified, disabled = false }: SliderCaptchaProps) {
  const [mounted, setMounted] = useState(false);
  const [sliderLeft, setSliderLeft] = useState(0);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000));

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blockRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const originX = useRef(0);
  const trailY = useRef<number[]>([]);
  const targetXRef = useRef(0);

  // --------------- mount ---------------
  useEffect(() => { setMounted(true); }, []);

  // --------------- draw ---------------
  const draw = useCallback(() => {
    const cvs = canvasRef.current;
    const blk = blockRef.current;
    if (!cvs || !blk) return;

    const cCtx = cvs.getContext('2d');
    const bCtx = blk.getContext('2d');
    if (!cCtx || !bCtx) return;

    // reset
    cvs.width = W;
    cvs.height = H;
    blk.width = W;
    blk.height = H;
    blk.style.left = '0px';

    // random target position
    const rng = mulberry32(seed);
    const tx = randRange(rng, L + 10, W - L - 10);
    const ty = randRange(rng, PIECE_R * 2 + 10, H - L - 10);
    targetXRef.current = tx;

    // paint background onto main canvas
    paintBackground(cCtx, seed);

    // draw hole shape onto main canvas (semi-transparent fill)
    cCtx.save();
    drawPath(cCtx, tx, ty, 'fill');
    cCtx.restore();

    // clip piece shape onto block canvas
    bCtx.save();
    drawPath(bCtx, tx, ty, 'clip');

    // copy background image onto block canvas (only the clipped region shows)
    bCtx.drawImage(cvs, 0, 0, W, H);
    bCtx.restore();

    // extract the clipped piece to the left edge
    const y1 = ty - PIECE_R * 2 - 1;
    const imgData = bCtx.getImageData(tx - 3, y1, L, L);
    blk.width = L; // this clears the block canvas
    bCtx.putImageData(imgData, 0, y1);
  }, [seed]);

  useEffect(() => {
    if (mounted) draw();
  }, [mounted, draw]);

  // --------------- refresh ---------------
  const refresh = useCallback(() => {
    setSliderLeft(0);
    setVerified(false);
    setVerifying(false);
    setFailed(false);
    setApiError(false);
    trailY.current = [];
    setSeed(Math.floor(Math.random() * 100000));
  }, []);

  // --------------- drag handlers ---------------
  const handleDragStart = useCallback((clientX: number) => {
    if (verified || disabled || verifying) return;
    isDragging.current = true;
    originX.current = clientX;
    trailY.current = [];
    setFailed(false);
    setApiError(false);
  }, [verified, disabled, verifying]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    const moveX = clientX - originX.current;
    if (moveX < 0 || moveX + 38 >= W) return;

    setSliderLeft(moveX);

    // Position the block canvas – compensate for the slider btn width
    const blockLeft = ((W - 40 - 20) / (W - 40)) * moveX;
    if (blockRef.current) {
      blockRef.current.style.left = blockLeft + 'px';
    }

    trailY.current.push(clientY);
  }, []);

  const handleDragEnd = useCallback(async () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const blk = blockRef.current;
    if (!blk) return;

    const left = parseInt(blk.style.left || '0', 10);
    const spliced = Math.abs(left - targetXRef.current) < TOLERANCE;

    if (spliced) {
      setVerifying(true);
      try {
        const res = await fetch('/api/auth/captcha-token', { method: 'POST' });
        if (!res.ok) throw new Error('验证失败');
        const data = await res.json();
        setVerified(true);
        onVerified(data.token);
      } catch {
        setFailed(true);
        setApiError(true);
        setTimeout(refresh, 1500);
      } finally {
        setVerifying(false);
      }
    } else {
      setFailed(true);
      setTimeout(() => {
        setSliderLeft(0);
        if (blockRef.current) blockRef.current.style.left = '0px';
        setFailed(false);
      }, 500);
    }
  }, [onVerified, refresh]);

  // --------------- global event listeners ---------------
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const onMouseUp = () => void handleDragEnd();
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => void handleDragEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  // ─── Render ───
  return (
    <div className="flex flex-col gap-2">
      {/* ─── Canvas area ─── */}
      <div
        className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0f1e]"
        style={{ width: W, height: H }}
      >
        {mounted ? (
          <>
            {/* Background canvas (with hole) */}
            <canvas ref={canvasRef} width={W} height={H} className="block" />

            {/* Block canvas (the sliding piece) */}
            <canvas
              ref={blockRef}
              width={W}
              height={H}
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

            {/* Verified overlay */}
            {verified && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 border border-emerald-500/30">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">验证通过</span>
                </div>
              </div>
            )}

            {/* Refresh button */}
            {!verified && (
              <button
                type="button"
                onClick={refresh}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                title="刷新验证码"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        ) : (
          <div
            className="flex items-center justify-center text-slate-500 text-xs"
            style={{ height: H }}
          >
            加载验证码…
          </div>
        )}
      </div>

      {/* ─── Slider track ─── */}
      <div
        className={`relative h-11 select-none overflow-hidden rounded-xl border transition-all duration-300 ${verified
          ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
          : failed
            ? 'border-red-500/30 bg-red-500/[0.06]'
            : 'border-white/[0.06] bg-[#0a0f1e]'
          }`}
        style={{ width: W }}
      >
        {/* Progress fill */}
        <div
          className={`absolute inset-y-0 left-0 transition-colors ${verified
            ? 'bg-emerald-500/15'
            : failed
              ? 'bg-red-500/10'
              : 'bg-indigo-500/10'
            }`}
          style={{ width: sliderLeft + 44 }}
        />

        {/* Hint text */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            className={`text-xs font-medium transition-all ${verified
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
                ? (apiError ? '验证服务异常，请稍后重试' : '拼合不准确，请重试')
                : verifying
                  ? '验证中...'
                  : '拖动滑块完成拼图验证'}
          </span>
        </div>

        {/* Slider thumb */}
        <div
          className={`absolute left-0 top-0 flex h-full w-11 items-center justify-center rounded-xl transition-all duration-200 ${verified
            ? 'cursor-default bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
            : failed
              ? 'cursor-not-allowed bg-red-500/80'
              : 'cursor-grab bg-white/10 hover:bg-white/15 border border-white/10 active:cursor-grabbing active:bg-indigo-500 active:shadow-[0_0_16px_rgba(99,102,241,0.5)]'
            } ${disabled && !verified ? 'cursor-default opacity-50' : ''}`}
          style={{
            transform: `translateX(${sliderLeft}px)`,
            transition: isDragging.current ? 'none' : 'transform 0.3s ease',
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            handleDragStart(e.clientX, e.clientY);
          }}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
        >
          {verified ? (
            <Check className="w-5 h-5 text-white" strokeWidth={3} />
          ) : failed ? (
            <AlertCircle className="w-4 h-4 text-white" />
          ) : (
            <GripVertical className="w-5 h-5 text-white/60" />
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(SliderCaptcha);
