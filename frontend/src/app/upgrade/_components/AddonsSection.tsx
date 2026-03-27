import { ShoppingCart } from 'lucide-react';
import { ADDON_CATEGORIES, getCurrencySymbol, type PaymentRegion } from '../_data/plans';

interface AddonsSectionProps {
  region: PaymentRegion;
}

export default function AddonsSection({ region }: AddonsSectionProps) {
  const sym = getCurrencySymbol(region);

  return (
    <div id="addons" className="mt-20 w-full max-w-5xl paper-card stitched-border rounded-none p-10 transform rotate-[0.2deg]">
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

            {/* Tier rows */}
            <div className="flex flex-col">
              {cat.tiers.map((tier, idx) => {
                const price = region === 'domestic' ? tier.priceCny : tier.priceUsd;
                const isSelected = tier.selected;
                const isLast = idx === cat.tiers.length - 1;

                return (
                  <div
                    key={tier.label}
                    className={[
                      'flex items-center justify-between px-4 py-3 transition-colors cursor-pointer group/addon',
                      isSelected
                        ? 'border-2 border-[#2c5282] bg-white'
                        : `border border-[#e2e2d5] bg-white hover:bg-slate-50 ${!isLast ? 'border-b-0' : ''}`,
                      isSelected ? '' : (!isLast && !cat.tiers[idx + 1]?.selected ? '' : ''),
                    ].filter(Boolean).join(' ')}
                  >
                    <span className={`text-xs font-mono ${isSelected ? 'text-[#2c5282] font-bold' : 'text-[#4a5568]'}`}>
                      + {tier.label}
                    </span>
                    <span className="flex items-baseline gap-0.5">
                      <span className={`text-sm font-bold font-mono ${isSelected ? 'text-[#2c5282]' : 'text-[#1a202c]'}`}>
                        {sym}{price}
                      </span>
                      <span className="text-[10px] text-[#4a5568] font-mono"> /月</span>
                    </span>
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
