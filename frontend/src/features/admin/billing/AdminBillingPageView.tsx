'use client';

import { useState } from 'react';

/* ═══ MOCK DATA ═══ */
const MOCK_BILLING_KPI = [
  { labelEn: 'TOTAL REVENUE', labelCn: '累计总收入', value: '¥2,485,900.', change: '↗ +12.4% vs prev. year', changeColor: 'text-green-700' },
  { labelEn: 'MONTHLY FORECAST', labelCn: '本月预计', value: '¥412,050.00', change: '■ Projection confidence: 94%', changeColor: 'text-stone-500' },
  { labelEn: 'ACTIVE SUBS', labelCn: '活跃订阅数', value: '12,842', change: '↗ +840 this week', changeColor: 'text-green-700' },
];

const MOCK_TRANSACTIONS = [
  { id: '#TXN-8429-BB01', user: 'Li Wei (李伟)', initial: 'L', amount: '¥128.00', method: 'Alipay', methodIcon: '💳', status: 'SUCCESSFUL', statusColor: 'bg-green-100 text-green-800 border-green-200', time: '2023-11-24 14:20:05' },
  { id: '#TXN-8429-CC04', user: 'Sarah J. Miller', initial: 'S', amount: '¥599.00', method: 'Stripe', methodIcon: '💳', status: 'SUCCESSFUL', statusColor: 'bg-green-100 text-green-800 border-green-200', time: '2023-11-24 13:45:12' },
  { id: '#TXN-8430-DA11', user: 'Zhang San (张三)', initial: 'Z', amount: '¥19.00', method: 'WeChat Pay', methodIcon: '💬', status: 'FAILED', statusColor: 'bg-red-100 text-red-800 border-red-200', time: '2023-11-24 13:10:44' },
  { id: '#TXN-8431-EE99', user: 'Alex Chen', initial: 'A', amount: '¥128.00', method: 'Alipay', methodIcon: '💳', status: 'PENDING', statusColor: 'bg-stone-100 text-stone-700 border-stone-200', time: '2023-11-24 12:55:01' },
];

const TIER_DIST = [
  { name: 'FREE (45%)', pct: 45, color: 'bg-stone-300' },
  { name: 'PRO (25%)', pct: 25, color: 'bg-[#1A365D]' },
  { name: 'PRO+ (20%)', pct: 20, color: 'bg-[#002045]' },
  { name: 'ULTRA (10%)', pct: 10, color: 'bg-[#002045]' },
];

export function AdminBillingPageView() {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 millimeter-grid min-h-full">
      {/* Page Header */}
      <div className="border-b border-[#c4c6cf]/20 pb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2 border border-stone-300 inline-block px-2 py-0.5">
          Academic Records / Finance
        </p>
        <h2 className="font-serif text-4xl font-black text-[#002045] tracking-tight mt-2">
          账单统计与营收分析
        </h2>
        <div className="h-1 w-24 bg-[#002045] mt-3" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_BILLING_KPI.map((kpi) => (
          <div key={kpi.labelEn} className="bg-white border border-[#c4c6cf]/10 p-6 shadow-sm">
            <p className="font-mono text-[10px] uppercase text-stone-500 tracking-tight">
              {kpi.labelEn} / {kpi.labelCn}
            </p>
            <h3 className="font-mono text-3xl font-bold mt-2 text-[#1b1c1a]">{kpi.value}</h3>
            <p className={`font-mono text-[10px] mt-3 ${kpi.changeColor}`}>{kpi.change}</p>
          </div>
        ))}
        {/* Highlight Card */}
        <div className="bg-[#002045] text-white p-6 shadow-sm relative overflow-hidden">
          <div className="hatched-pattern absolute inset-0 opacity-10" />
          <div className="relative z-10">
            <p className="font-mono text-[10px] uppercase tracking-tight opacity-70">
              AVG. ORDER VALUE / 客单价
            </p>
            <h3 className="font-mono text-3xl font-bold mt-2">¥193.50</h3>
            <p className="font-mono text-[10px] mt-3 opacity-70">■ Premium tier dominance</p>
          </div>
        </div>
      </div>

      {/* Revenue Chart + Category Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-[#f4f4f0] border border-[#c4c6cf]/10 p-8 shadow-sm relative overflow-hidden">
          <div className="hatched-pattern absolute inset-0 opacity-40 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <h4 className="font-serif text-xl font-bold text-[#002045]">月度营收趋势图</h4>
              <div className="flex gap-6 font-mono text-[10px] uppercase text-stone-500">
                <span className="flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-[#002045] inline-block" /> REVENUE
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-[#002045] inline-block border-dashed border-b border-[#002045]" /> PREDICTION
                </span>
              </div>
            </div>
            <div className="h-64 w-full relative border-l border-b border-[#002045]/20">
              <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenueGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(0, 32, 69, 0.08)" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path d="M0 230 Q80 210, 150 200 T 300 190 T 450 140 T 550 120 T 650 80 T 750 40 T 800 30" fill="none" stroke="#002045" strokeWidth="2.5" />
                <path d="M0 230 Q80 210, 150 200 T 300 190 T 450 140 T 550 120 T 650 80 T 750 40 T 800 30 V 256 H 0 Z" fill="url(#revenueGrad)" />
              </svg>
              <div className="absolute -left-12 h-full flex flex-col justify-between text-[10px] font-mono text-stone-400 py-2">
                <span>500k</span><span>400k</span><span>300k</span><span>200k</span><span>100k</span><span>0</span>
              </div>
            </div>
            <div className="flex justify-between mt-4 px-4 font-mono text-[10px] text-stone-400 uppercase tracking-[0.15em]">
              <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span><span>JUL</span><span>AUG</span>
            </div>
          </div>
        </div>

        {/* Category Analysis */}
        <div className="bg-[#efeeea] border border-[#c4c6cf]/10 p-8 shadow-sm space-y-8">
          <div>
            <h4 className="font-serif text-xl font-bold text-[#002045]">分类分析</h4>
          </div>

          {/* Tier Distribution */}
          <div>
            <p className="font-mono text-[10px] uppercase text-stone-500 tracking-[0.12em] mb-3">
              MEMBER TIER DISTRIBUTION / 会员等级
            </p>
            <div className="h-6 w-full flex">
              {TIER_DIST.map((t) => (
                <div key={t.name} className={`h-full ${t.color}`} style={{ width: `${t.pct}%` }} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {TIER_DIST.map((t) => (
                <span key={t.name} className="flex items-center gap-2 font-mono text-[10px] text-stone-600">
                  <span className={`w-2.5 h-2.5 ${t.color}`} />
                  {t.name}
                </span>
              ))}
            </div>
          </div>

          {/* Student Verification */}
          <div className="pt-6 border-t border-stone-300">
            <p className="font-mono text-[10px] uppercase text-stone-500 tracking-[0.12em] mb-4">
              STUDENT VERIFICATION / 学生认证占比
            </p>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e3e2df" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#002045" strokeWidth="3" strokeDasharray="97.4 100" strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold">
                  70%
                </span>
              </div>
              <div>
                <p className="font-serif font-bold text-[#002045]">Academic Integrity</p>
                <p className="text-[10px] text-stone-500 mt-1">
                  7,420 users verified via EduMail API this quarter.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Ledger */}
      <div className="bg-white border border-[#c4c6cf]/10 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-stone-100 flex justify-between items-center">
          <h4 className="font-serif text-xl font-bold text-[#002045]">
            交易流水 (Latest Ledger)
          </h4>
          <button className="px-4 py-2 bg-[#002045] text-white font-mono text-[10px] uppercase tracking-[0.15em] hover:opacity-90 transition-all">
            Export .CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f4f4f0] border-b border-stone-200">
                {['Transaction ID', 'User / Identity', 'Amount', 'Payment Method', 'Status', 'Timestamp'].map((h) => (
                  <th key={h} className="px-8 py-4 font-mono text-[10px] text-[#002045] uppercase tracking-[0.12em]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {MOCK_TRANSACTIONS.map((row) => (
                <tr key={row.id} className="hover:bg-[#e3e2df] transition-colors">
                  <td className="px-8 py-4 font-mono text-xs text-stone-500">{row.id}</td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#1A365D] text-white flex items-center justify-center font-mono text-xs font-bold">
                        {row.initial}
                      </div>
                      <span className="text-sm">{row.user}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 font-mono text-sm font-bold">{row.amount}</td>
                  <td className="px-8 py-4 text-xs flex items-center gap-2">
                    <span>{row.methodIcon}</span> {row.method}
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-2 py-0.5 border ${row.statusColor} text-[10px] font-mono uppercase font-bold tracking-tight`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 font-mono text-xs text-stone-500">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-6 flex justify-between items-center bg-stone-50/50">
          <p className="font-mono text-[10px] text-stone-400">Showing entries 1-4 of 1,208 total records.</p>
          <div className="flex gap-1">
            <button className="w-8 h-8 flex items-center justify-center border border-stone-200 text-stone-400 hover:border-[#002045] hover:text-[#002045] transition-all">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 flex items-center justify-center border font-mono text-xs transition-all ${
                  currentPage === p
                    ? 'border-[#002045] bg-[#002045] text-white'
                    : 'border-stone-200 hover:border-[#002045]'
                }`}
              >
                {p}
              </button>
            ))}
            <button className="w-8 h-8 flex items-center justify-center border border-stone-200 text-stone-400 hover:border-[#002045] hover:text-[#002045] transition-all">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-8 border-t border-[#c4c6cf]/10 flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#002045]">shield</span>
          <div>
            <p className="font-serif text-sm italic text-[#002045]">&quot;Scientia potentia est.&quot;</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone-400">
              Generated by StudySolo Admin Engine v4.2.0-alpha
            </p>
          </div>
        </div>
        <div className="flex gap-6 font-mono text-[10px] uppercase tracking-[0.15em] text-stone-400">
          <span>System Integrity</span>
          <span>API Console</span>
          <span>Legal Ledger</span>
        </div>
      </footer>
    </div>
  );
}
