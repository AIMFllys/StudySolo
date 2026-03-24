'use client';

import { ArrowLeft, Construction } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UpgradeHeader() {
  const router = useRouter();

  return (
    <>
      {/* ── Beta notice banner ── */}
      <div className="w-full bg-[#2c5282] text-white text-center py-2 px-4 text-xs font-mono tracking-wider flex items-center justify-center gap-2 z-50 relative">
        <Construction className="w-3.5 h-3.5 shrink-0" />
        <span>
          订阅支付功能开发中，目前仅可通过<strong className="underline mx-0.5">兑换码</strong>激活会员权益。正式支付将于近期上线。
        </span>
        <Construction className="w-3.5 h-3.5 shrink-0" />
      </div>

      {/* ── Top navigation bar ── */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#4a5568] hover:text-[#2c5282] transition-colors font-mono group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          返回
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1a202c] rounded-sm flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs font-mono leading-none">S</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#1a202c] font-serif tracking-tight leading-none">
              1037Solo
            </span>
            <span className="text-[9px] text-[#4a5568] font-mono tracking-widest uppercase leading-none mt-0.5">
              StudySolo
            </span>
          </div>
        </div>

        {/* Spacer to balance layout */}
        <div className="w-16" />
      </div>
    </>
  );
}
