'use client';

import { ShoppingCart } from 'lucide-react';
import { ADDON_CATEGORIES, getCurrencySymbol, type PaymentRegion } from '../_data/plans';

interface AddonsSectionProps {
  region: PaymentRegion;
}

export default function AddonsSection({ region }: AddonsSectionProps) {
  const sym = getCurrencySymbol(region);

  return (
    <div className="mt-20 w-full max-w-5xl paper-card stitched-border rounded-none p-10 transform rotate-[0.2deg]">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 border-b border-[#e2e2d5] pb-6">
        <h3 className="text-xl font-bold text-[#2c5282] flex items-center gap-3 font-serif">
          <ShoppingCart className="w-5 h-5 text-[#2c5282]" />
          按量加购服务
        </h3>
        <span className="text-xs font-mono text-[#4a5568] uppercase tracking-widest">/ 月度计费</span>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {ADDON_CATEGORIES.map((cat) => (
          <div key={cat.slug}>
            {/* Category title */}
            <div className="flex items-center gap-2 mb-4 border-l-4 border-[#2c5282] pl-3">
              <h4 className="font-bold text-[#1a202c] text-sm uppercase font-mono">{cat.slug}</h4>
            </div>

            {/* Tier rows — each with paper fold hover animation */}
            <div className="flex flex-col">
              {cat.tiers.map((tier, idx) => {
                const price = region === 'domestic' ? tier.priceCny : tier.priceUsd;
                const isLast = idx === cat.tiers.length - 1;

                return (
                  <div
                    key={tier.label}
                    className="group/addon relative cursor-pointer"
                  >
                    {/* Paper strip — folds up on hover to reveal CTA */}
                    <div
                      className={[
                        'relative z-10 flex items-center justify-between px-4 py-3 bg-white transition-all duration-400',
                        'border border-[#e2e2d5]',
                        !isLast ? 'border-b-0' : '',
                        // Fold animation: strip lifts and rotates slightly
                        'group-hover/addon:-translate-y-1 group-hover/addon:rotate-[-0.5deg]',
                        'group-hover/addon:shadow-[0_4px_8px_rgba(0,0,0,0.06)]',
                        'group-hover/addon:bg-[#fdfcf8]',
                      ].join(' ')}
                      style={{ transformOrigin: 'top center' }}
                    >
                      <span className="text-xs font-mono text-[#4a5568] group-hover/addon:text-[#2c5282] transition-colors duration-300">
                        {tier.label}
                      </span>
                      <span className="flex items-baseline gap-0.5">
                        <span className="text-sm font-bold font-mono text-[#1a202c] group-hover/addon:text-[#2c5282] transition-colors duration-300">
                          {sym}{price}
                        </span>
                        <span className="text-[10px] text-[#4a5568] font-mono"> /月</span>
                      </span>
                    </div>

                    {/* Hidden CTA — revealed when paper folds */}
                    <div
                      className={[
                        'absolute inset-x-0 bottom-0 z-0 flex items-center justify-center',
                        'h-full bg-[#2c5282]/[0.03] border border-dashed border-[#2c5282]/20',
                        !isLast ? 'border-b-0' : '',
                        'opacity-0 group-hover/addon:opacity-100 transition-opacity duration-300 delay-100',
                      ].join(' ')}
                    >
                      <span className="text-[10px] font-mono font-bold text-[#2c5282] tracking-widest uppercase">
                        点击订阅
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
