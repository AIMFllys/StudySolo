'use client';

import { useState } from 'react';

/* ═══ MOCK DATA ═══ */
const MOCK_KPI = [
  { label: 'TOTAL USERS', value: '128,492', change: '+12.4%', changeColor: 'text-green-700', sub: '总用户基数' },
  { label: 'DAILY ACTIVE USERS', value: '14,208', change: '+5.2%', changeColor: 'text-green-700', sub: '当日活跃用户' },
  { label: 'ACTIVE WORKFLOWS', value: '3,891', change: '稳定', changeColor: 'text-stone-500', sub: '运行中工作流' },
  { label: 'SUCCESS RATE', value: '99.82%', change: '高精度', changeColor: 'text-[#002045]', sub: '执行成功率' },
];

const MOCK_DISTRIBUTION = [
  { name: '学术分析', pct: 45 },
  { name: '系统同步', pct: 28 },
  { name: '备份维护', pct: 15 },
  { name: '自定义脚本', pct: 12 },
];

const MOCK_ACTIVITY = [
  { id: '#TX-99012', service: '大规模语义分析同步', operator: 'System_Cron', time: '2024.05.24 14:22:10', status: '成功', statusColor: 'bg-green-100 text-green-800', impact: '无错误', impactColor: 'text-green-600' },
  { id: '#TX-99011', service: '用户权限矩阵重构', operator: 'Admin_Zhang', time: '2024.05.24 14:15:45', status: '进行中', statusColor: 'bg-yellow-100 text-yellow-800', impact: '迁移中...', impactColor: 'text-yellow-600' },
  { id: '#TX-99010', service: '全球CDN节点边缘缓存清除', operator: 'Auto_Cleaner', time: '2024.05.24 13:58:22', status: '成功', statusColor: 'bg-green-100 text-green-800', impact: '缓存失效', impactColor: 'text-green-600' },
  { id: '#TX-99009', service: '数据库碎片自动整理', operator: 'DB_Agent_04', time: '2024.05.24 13:40:11', status: '失败', statusColor: 'bg-red-100 text-red-800', impact: 'I/O 超时', impactColor: 'text-red-600' },
  { id: '#TX-99008', service: '新用户欢迎序列触发', operator: 'Marketing_Hub', time: '2024.05.24 13:22:05', status: '成功', statusColor: 'bg-green-100 text-green-800', impact: '邮件已发送', impactColor: 'text-green-600' },
];

/* ═══ Mini Sparkline SVGs ═══ */
const SPARKLINES = [
  'M0 35 Q 20 30, 40 38 T 80 10 T 100 5',
  'M0 30 Q 15 35, 30 20 T 60 25 T 100 15',
  'M0 10 Q 25 15, 50 35 T 75 10 T 100 30',
  'M0 7 Q 50 4, 100 6',
];

export function AdminDashboardPageView() {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 millimeter-grid min-h-full">
      {/* Page Header */}
      <div className="flex justify-between items-end border-b border-[#c4c6cf]/20 pb-6">
        <div>
          <h2 className="font-serif text-4xl font-black text-[#002045] tracking-tight">
            数据概览全景
          </h2>
          <p className="font-mono text-sm text-stone-500 mt-2 uppercase tracking-[0.15em]">
            Data Panorama · System Analytics v2.4.0
          </p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-2 bg-[#002045] text-white font-serif text-sm flex items-center gap-2 hover:opacity-90 active:opacity-80 transition-all">
            <span className="material-symbols-outlined text-sm">download</span>
            导出报告
          </button>
          <button className="px-6 py-2 border border-[#002045] text-[#002045] font-serif text-sm hover:bg-[#002045]/5 transition-all">
            刷新面板
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_KPI.map((kpi, i) => (
          <div
            key={kpi.label}
            className="bg-white border border-[#c4c6cf]/10 p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <p className="font-mono text-[10px] uppercase text-stone-500 tracking-tight">
                {kpi.label}
              </p>
              <h3 className="font-mono text-3xl font-bold mt-1 text-[#1b1c1a]">{kpi.value}</h3>
            </div>
            <div className="mt-4 h-16 w-full relative">
              <svg className="w-full h-full text-[#002045] fill-none" viewBox="0 0 100 40">
                <path d={SPARKLINES[i]} stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <div className={`absolute bottom-0 right-0 font-mono text-[10px] ${kpi.changeColor}`}>
                {kpi.change}
              </div>
            </div>
            <div className="mt-2 text-[10px] font-serif text-stone-400">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Growth Chart */}
        <div className="lg:col-span-2 bg-[#f4f4f0] border border-[#c4c6cf]/10 p-8 shadow-sm relative overflow-hidden">
          <div className="hatched-pattern absolute inset-0 opacity-40 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h4 className="font-serif text-xl font-bold text-[#002045]">用户增长趋势</h4>
                <p className="font-mono text-[10px] uppercase text-stone-500 tracking-[0.15em] mt-1">
                  用户增长趋势 (月度)
                </p>
              </div>
              <span className="px-3 py-1 bg-white text-[10px] font-mono border border-stone-200">
                2023 - 2024
              </span>
            </div>
            <div className="h-64 w-full flex items-end relative border-l border-b border-[#002045]/20">
              <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(0, 32, 69, 0.1)" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 240 L 100 200 L 200 220 L 300 150 L 400 180 L 500 100 L 600 120 L 700 80 L 800 50"
                  fill="none"
                  stroke="#002045"
                  strokeWidth="3"
                />
                <path
                  d="M0 240 L 100 200 L 200 220 L 300 150 L 400 180 L 500 100 L 600 120 L 700 80 L 800 50 V 256 H 0 Z"
                  fill="url(#chartGradient)"
                />
                <circle cx="100" cy="200" fill="#002045" r="4" />
                <circle cx="300" cy="150" fill="#002045" r="4" />
                <circle cx="500" cy="100" fill="#002045" r="4" />
                <circle cx="800" cy="50" fill="#002045" r="4" />
              </svg>
              <div className="absolute -left-10 h-full flex flex-col justify-between text-[10px] font-mono text-stone-400 py-2">
                <span>150k</span><span>100k</span><span>50k</span><span>0</span>
              </div>
            </div>
            <div className="flex justify-between mt-4 px-4 font-mono text-[10px] text-stone-400 uppercase tracking-[0.15em]">
              <span>一月</span><span>三月</span><span>五月</span><span>七月</span><span>九月</span><span>十一月</span>
            </div>
          </div>
        </div>

        {/* Workflow Distribution */}
        <div className="bg-[#efeeea] border border-[#c4c6cf]/10 p-8 shadow-sm">
          <div className="mb-8">
            <h4 className="font-serif text-xl font-bold text-[#002045]">工作流执行分布</h4>
            <p className="font-mono text-[10px] uppercase text-stone-500 tracking-[0.15em] mt-1">
              工作流执行分布
            </p>
          </div>
          <div className="space-y-6">
            {MOCK_DISTRIBUTION.map((item, i) => {
              const barColors = ['bg-[#002045]', 'bg-[#1A365D]', 'bg-[#bdc7db]', 'bg-stone-400'];
              return (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between font-mono text-[10px] uppercase tracking-tight">
                    <span>{item.name}</span>
                    <span>{item.pct}%</span>
                  </div>
                  <div className="h-8 bg-stone-200 w-full relative">
                    <div className={`h-full ${barColors[i]} transition-all`} style={{ width: `${item.pct}%` }} />
                    <div className="absolute inset-0 hatched-pattern opacity-30" />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-10 pt-6 border-t border-stone-300">
            <p className="text-xs text-stone-600 font-serif leading-relaxed">
              注：数据基于过去 24 小时内的执行总量计算。当前峰值出现在协调世界时 14:00。
            </p>
          </div>
        </div>
      </div>

      {/* Activity Ledger Table */}
      <div className="bg-white border border-[#c4c6cf]/10 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-stone-100 flex justify-between items-center">
          <div>
            <h4 className="font-serif text-xl font-bold text-[#002045]">近期系统活动记录</h4>
            <p className="font-mono text-[10px] uppercase text-stone-500 tracking-[0.15em] mt-1">
              近期系统活动记录
            </p>
          </div>
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 font-mono text-[10px] border border-green-100">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            系统正常
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f4f4f0] border-b border-stone-200">
                {['交易ID', '服务项目', '操作者', '时间戳', '状态', '影响范围'].map((h) => (
                  <th key={h} className="px-8 py-4 font-mono text-[10px] text-[#002045] uppercase tracking-[0.15em]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {MOCK_ACTIVITY.map((row) => (
                <tr key={row.id} className="hover:bg-[#e3e2df] transition-colors">
                  <td className="px-8 py-4 font-mono text-xs text-stone-500">{row.id}</td>
                  <td className="px-8 py-4 text-sm font-serif text-[#002045]">{row.service}</td>
                  <td className="px-8 py-4 text-xs">{row.operator}</td>
                  <td className="px-8 py-4 font-mono text-xs">{row.time}</td>
                  <td className="px-8 py-4">
                    <span className={`px-2 py-0.5 ${row.statusColor} text-[10px] font-serif uppercase font-bold tracking-tight`}>
                      {row.status}
                    </span>
                  </td>
                  <td className={`px-8 py-4 text-[10px] font-mono ${row.impactColor}`}>{row.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-6 flex justify-between items-center bg-stone-50/50">
          <p className="font-mono text-[10px] text-stone-400">显示第 1-5 条，共 1,240 条记录</p>
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

      {/* Bottom Info Section */}
      <div className="flex flex-col md:flex-row gap-12 pt-12 border-t border-[#c4c6cf]/10">
        <div className="md:w-1/3">
          <h5 className="font-serif text-lg font-bold text-[#002045] mb-4">学术严谨性报告</h5>
          <p className="text-sm text-stone-600 leading-relaxed mb-6">
            StudySolo 管理系统遵循严格的数据处理标准。所有算法均经过同行评审，确保管理效率与学术公正的平衡。
          </p>
          <div className="p-4 bg-[#002045] text-white relative overflow-hidden">
            <div className="hatched-pattern absolute inset-0 opacity-20" />
            <div className="relative z-10 flex items-center gap-4">
              <span className="material-symbols-outlined text-3xl">verified</span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] opacity-80">认证状态</p>
                <p className="font-serif font-bold">学术数据处理甲级认证</p>
              </div>
            </div>
          </div>
        </div>
        <div className="md:w-2/3 grid grid-cols-2 gap-8">
          <div>
            <h6 className="font-mono text-[10px] uppercase text-stone-500 tracking-[0.15em] mb-4">
              系统健康指数
            </h6>
            <div className="flex items-end gap-2">
              <span className="font-mono text-4xl font-bold">98.4</span>
              <span className="text-xs text-stone-400 font-serif pb-1">/ 100 优异</span>
            </div>
            <p className="text-xs text-stone-500 mt-2">
              基于 CPU 占用率、内存泄露检测及 API 响应延迟综合评估。
            </p>
          </div>
          <div>
            <h6 className="font-mono text-[10px] uppercase text-stone-500 tracking-[0.15em] mb-4">
              存储资源占用
            </h6>
            <div className="flex items-end gap-2">
              <span className="font-mono text-4xl font-bold">62%</span>
              <span className="text-xs text-stone-400 font-serif pb-1">已使用</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-stone-200">
              <div className="h-full bg-[#002045] w-[62%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-8 border-t border-[#c4c6cf]/10 flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em]">
          StudySolo Admin Console © 2024 Intellectual Properties Group.
        </div>
        <div className="flex gap-6 font-mono text-[10px] uppercase tracking-[0.15em]">
          <span>内核 v4.12.0</span>
          <span>节点: HK-01-A</span>
          <span>延迟: 14ms</span>
        </div>
      </footer>
    </div>
  );
}
