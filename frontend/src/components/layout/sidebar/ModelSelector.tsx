'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Crown, Zap } from 'lucide-react';
import {
  canAccessModel,
  groupModelsByProvider,
  type AIModelOption,
} from '@/features/workflow/constants/ai-models';
import type { TierType } from '@/services/auth.service';

interface ModelSelectorProps {
  value: AIModelOption;
  options: AIModelOption[];
  onChange: (model: AIModelOption) => void;
  userTier?: TierType;
}

export function ModelSelector({ value, options, onChange, userTier }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const groups = groupModelsByProvider(options);

  const handleSelect = (model: AIModelOption) => {
    if (!canAccessModel(userTier, model)) {
      return;
    }
    onChange(model);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-border/50 node-paper-bg px-2.5 py-1.5 text-[11px] font-medium text-foreground/80 transition-all hover:border-primary/30 hover:shadow-sm"
      >
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: value.brandColor }}
        />
        <span className="truncate max-w-[120px]">{value.displayName}</span>
        <ChevronDown
          className={`h-3 w-3 text-muted-foreground/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[260px] rounded-xl border-[1.5px] border-border/50 node-paper-bg p-1.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70 font-serif">
            选择模型
          </div>

          <div className="max-h-[320px] overflow-y-auto scrollbar-hide">
            {Object.entries(groups).map(([provider, models]) => (
              <div key={provider} className="mt-1">
                <div className="flex items-center gap-1.5 px-2 py-1">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: models[0].brandColor }}
                  />
                  <span className="text-[10px] font-semibold text-muted-foreground/60">
                    {provider}
                  </span>
                </div>

                {models.map((model) => {
                  const isSelected = value.skuId === model.skuId;
                  const isLocked = !canAccessModel(userTier, model);

                  return (
                    <button
                      key={model.skuId}
                      type="button"
                      onClick={() => handleSelect(model)}
                      disabled={isLocked}
                      className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all ${
                        isLocked
                          ? 'cursor-not-allowed opacity-60'
                          : 'hover:bg-white/5'
                      } ${
                        isSelected
                          ? 'bg-primary/8 ring-1 ring-primary/20'
                          : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[12px] font-medium truncate ${
                              isSelected
                                ? 'text-foreground'
                                : 'text-foreground/80'
                            }`}
                          >
                            {model.displayName}
                          </span>
                          {model.isPremium ? (
                            <span className="flex items-center gap-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-500 shrink-0">
                              <Crown className="h-2.5 w-2.5" />
                              {model.requiredTier.toUpperCase()}
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[10px] text-muted-foreground/50 truncate block">
                          {model.description}
                        </span>
                      </div>

                      {isSelected ? (
                        <Zap className="h-3 w-3 text-primary shrink-0" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
