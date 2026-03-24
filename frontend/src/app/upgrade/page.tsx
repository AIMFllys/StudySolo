'use client';

import { useState } from 'react';
import { TIER_PLANS, type PaymentRegion, type BillingCycle } from './_data/plans';
import UpgradeHeader from './_components/UpgradeHeader';
import StudentVerification from './_components/StudentVerification';
import PaymentToggles from './_components/PaymentToggles';
import PlanCard from './_components/PlanCard';
import AddonsSection from './_components/AddonsSection';
import ComparisonTable from './_components/ComparisonTable';
import RedeemCodeSection from './_components/RedeemCodeSection';
import UpgradeFooter from './_components/UpgradeFooter';
import './upgrade.css';

export default function SubscriptionPage() {
  const [region, setRegion] = useState<PaymentRegion>('domestic');
  const [cycle, setCycle] = useState<BillingCycle>('yearly');

  return (
    <div className="graph-paper-bg text-[#1a202c] min-h-screen flex flex-col selection:bg-[#2c5282]/10 selection:text-[#2c5282]">

      {/* ── Header: banner + nav ── */}
      <UpgradeHeader />

      <main className="flex-1 relative z-10 flex flex-col items-center py-12 px-4 w-full">

        {/* ── Hero ── */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="academic-badge inline-flex items-center gap-2 px-3 py-1 bg-white text-[#2c5282] text-[10px] font-bold mb-6 tracking-widest shadow-sm uppercase">
            Subscription Matrix / 订阅中心
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1a202c] mb-6 tracking-tight leading-tight font-serif">
            升级您的生产力
            <br />
            <span className="text-[#2c5282]">释放 AI 的无限潜能</span>
          </h2>
          <p className="text-lg text-[#4a5568] max-w-2xl mx-auto leading-relaxed mb-8 italic font-serif">
            专为专业人士与学者打造的高端 AI 工作流平台。
          </p>
        </div>

        {/* ── Student Verification ── */}
        <StudentVerification />

        {/* ── Payment Toggles ── */}
        <PaymentToggles
          region={region}
          cycle={cycle}
          onRegionChange={setRegion}
          onCycleChange={setCycle}
        />

        {/* ── Plan Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl w-full items-start">
          {TIER_PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} cycle={cycle} region={region} />
          ))}
        </div>

        {/* ── Add-ons ── */}
        <AddonsSection region={region} />

        {/* ── Comparison Table ── */}
        <ComparisonTable />

        {/* ── Redeem Code ── */}
        <RedeemCodeSection />

      </main>

      {/* ── Footer ── */}
      <UpgradeFooter />
    </div>
  );
}
