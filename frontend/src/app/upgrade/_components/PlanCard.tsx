'use client';

import { CheckSquare, CheckCircle2, Zap, BadgeCheck, Crown, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import type { TierPlan, PlanFeature, PaymentRegion, BillingCycle } from '../_data/plans';
import { getPrice, getCurrencySymbol } from '../_data/plans';

interface PlanCardProps {
  plan: TierPlan;
  cycle: BillingCycle;
  region: PaymentRegion;
}

function FeatureIcon({ icon }: { icon: PlanFeature['icon'] }) {
  if (icon === 'slash') return null;
  if (icon === 'check-square')
    return <CheckSquare className="w-3.5 h-3.5 text-[#2c5282] mt-0.5 shrink-0" />;
  if (icon === 'check-circle')
    return <CheckCircle2 className="w-3.5 h-3.5 text-[#065f46] mt-0.5 shrink-0" />;
  if (icon === 'bolt')
    return <Zap className="w-3.5 h-3.5 mt-0.5 shrink-0" />;
  return null;
}

export default function PlanCard({ plan, cycle, region }: PlanCardProps) {
  const price = getPrice(plan.prices, region, cycle);
  const symbol = getCurrencySymbol(region);
  const isProPlus = plan.highlighted;
  const isUltra = plan.id === 'ultra';
  const isFree = plan.id === 'free';

  const suffix = isFree
    ? '/ 永久有效'
    : cycle === 'yearly' ? '/ 年' : '/ 月';

  // Yearly monthly display for reference
  const otherCycleRef = cycle === 'monthly' && !isFree
    ? `(${symbol}${region === 'domestic' ? plan.prices.cny.yearly : plan.prices.usd.yearly}/年)`
    : '';

  const cardCls = [
    'paper-card stitched-border rounded-none p-6 flex flex-col h-full relative',
    'group/card transition-all duration-300',
    plan.rotation,
    isProPlus && 'ring-2 ring-[#2c5282] scale-105 z-20 shadow-xl',
    isUltra && 'border-[#065f46]/30',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardCls}>
      {/* ── Hover overlay: book animation + subscribe CTA ── */}
      {!isFree && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/95 opacity-0 group-hover/card:opacity-100 transition-all duration-300 pointer-events-none group-hover/card:pointer-events-auto rounded-none">
          {/* Book flip animation */}
          <div className="relative w-16 h-16 mb-5">
            {/* Spine */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2 w-1 h-12 bg-[#2c5282]/20 rounded-full" />
            {/* Left page */}
            <div
              className="absolute left-[calc(50%-2px)] top-0 w-8 h-14 origin-left bg-[#f8f7f4] border border-[#e2e2d5] rounded-r-sm shadow-sm
                         transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                         group-hover/card:-rotate-[30deg] group-hover/card:translate-x-[-2px]"
              style={{ transformOrigin: 'left center' }}
            >
              <div className="mt-3 ml-1.5 space-y-1">
                <div className="w-4 h-[2px] bg-[#2c5282]/15 rounded" />
                <div className="w-3 h-[2px] bg-[#2c5282]/10 rounded" />
                <div className="w-5 h-[2px] bg-[#2c5282]/15 rounded" />
              </div>
            </div>
            {/* Right page */}
            <div
              className="absolute right-[calc(50%-2px)] top-0 w-8 h-14 origin-right bg-[#fdfcf8] border border-[#e2e2d5] rounded-l-sm shadow-sm
                         transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] delay-75
                         group-hover/card:rotate-[30deg] group-hover/card:translate-x-[2px]"
              style={{ transformOrigin: 'right center' }}
            >
              <div className="mt-3 mr-1.5 space-y-1 flex flex-col items-end">
                <div className="w-4 h-[2px] bg-[#065f46]/15 rounded" />
                <div className="w-5 h-[2px] bg-[#065f46]/10 rounded" />
                <div className="w-3 h-[2px] bg-[#065f46]/15 rounded" />
              </div>
            </div>
            {/* Book icon center */}
            <BookOpen
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#2c5282]/60
                         transition-all duration-500 delay-200
                         group-hover/card:scale-110 group-hover/card:text-[#2c5282]"
            />
          </div>

          {/* CTA text reveal */}
          <span
            className="font-serif font-bold text-sm tracking-widest text-[#2c5282]
                       translate-y-3 opacity-0 transition-all duration-400 delay-200
                       group-hover/card:translate-y-0 group-hover/card:opacity-100"
          >
            {plan.cta.variant === 'outline-emerald' ? '联系销售团队' : '点击订购'}
          </span>
          <span
            className="font-mono text-[10px] text-[#4a5568] mt-1.5
                       translate-y-2 opacity-0 transition-all duration-400 delay-300
                       group-hover/card:translate-y-0 group-hover/card:opacity-70"
          >
            {plan.name} · {symbol}{price}{suffix}
          </span>
        </div>
      )}

      {/* ── Top badge ── */}
      {plan.badge && plan.badge.variant === 'red' && (
        <div className="absolute -top-3 right-4 bg-[#9b2c2c] text-white text-[9px] font-mono font-bold px-2 py-0.5 tracking-tighter uppercase flex items-center gap-1 z-10">
          <Sparkles className="w-2.5 h-2.5" />
          {region === 'domestic' ? plan.badge.text : (plan.badge.textOverseas || plan.badge.text)}
        </div>
      )}
      {plan.badge && plan.badge.variant === 'blue' && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2c5282] text-white text-[10px] font-mono font-bold px-4 py-1 tracking-widest uppercase z-10">
          {plan.badge.text}
        </div>
      )}

      {/* ── Header ── */}
      <div className={`mb-6 ${isProPlus ? 'mt-2' : ''}`}>
        <h3
          className="text-xs font-mono font-bold mb-2 uppercase tracking-tighter"
          style={{ color: isUltra ? '#065f46' : '#2c5282' }}
        >
          {plan.slug}
        </h3>
        <h4 className="text-xl font-bold text-[#1a202c] mb-2 flex items-center gap-2 font-serif">
          {plan.name}
          {isProPlus && <BadgeCheck className="w-[18px] h-[18px] text-[#2c5282]" />}
          {isUltra && <Crown className="w-4 h-4 text-[#065f46]" />}
        </h4>

        {/* Price */}
        <div className="flex items-baseline gap-1 font-mono">
          <span className={`font-bold text-[#1a202c] ${isProPlus ? 'text-4xl text-[#2c5282]' : 'text-3xl'}`}>
            {symbol}{price}
          </span>
          <span className="text-xs text-[#4a5568]">{suffix}</span>
          {otherCycleRef && (
            <span
              className={`text-[10px] ml-2 ${isProPlus ? 'font-bold text-[11px]' : ''}`}
              style={{ color: isUltra ? '#065f46' : '#2c5282' }}
            >
              {otherCycleRef}
            </span>
          )}
        </div>

        <p className="text-[11px] text-[#4a5568] mt-3 h-8 font-serif">{plan.tagline}</p>
      </div>

      {/* ── CTA Button ── */}
      {plan.cta.variant === 'default' && (
        <button className="w-full py-2.5 bg-slate-50 border border-[#e2e2d5] text-[#4a5568] font-bold text-xs uppercase tracking-widest mb-6 cursor-default font-mono">
          {plan.cta.text}
        </button>
      )}
      {plan.cta.variant === 'outline-blue' && (
        <button className="w-full py-2.5 embossed-btn bg-white text-[#2c5282] font-bold text-xs uppercase tracking-widest mb-6 hover:bg-[#2c5282]/5 font-mono transition-colors">
          {plan.cta.text}
        </button>
      )}
      {plan.cta.variant === 'filled-blue' && (
        <button className="w-full py-3 bg-[#2c5282] text-white font-bold text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-[#1a202c] transition-all mb-6 font-mono">
          {plan.cta.text}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
      {plan.cta.variant === 'outline-emerald' && (
        <button className="w-full py-2.5 bg-white border border-[#065f46] text-[#065f46] font-bold text-xs uppercase tracking-widest mb-6 hover:bg-[#065f46]/5 transition-colors font-mono">
          {plan.cta.text}
        </button>
      )}

      {/* ── Features ── */}
      <div className="space-y-3 flex-1">
        {plan.features.map((f) => {
          if (f.highlight) {
            return (
              <div key={f.text} className="flex items-start gap-2 text-xs text-[#2c5282] font-mono p-2 bg-[#2c5282]/5 border border-dashed border-[#2c5282]/30 italic">
                <FeatureIcon icon={f.icon} />
                <span>{f.text}</span>
              </div>
            );
          }
          if (f.icon === 'slash') {
            return (
              <div key={f.text} className="flex items-start gap-2 text-xs text-[#4a5568] font-mono">
                / {f.text}
              </div>
            );
          }
          return (
            <div key={f.text} className={`flex items-start gap-2 text-xs text-[#1a202c] font-mono ${f.bold ? 'font-bold' : ''}`}>
              <FeatureIcon icon={f.icon} />
              <span>{f.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
