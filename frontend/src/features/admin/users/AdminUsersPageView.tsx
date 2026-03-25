'use client';

import { useState } from 'react';

/* ═══ MOCK DATA ═══ */
const MOCK_USERS = [
  {
    name: '陈墨林 (Mo Lin Chen)',
    email: 'm.chen@academic.edu',
    avatar: '陈',
    tiers: [{ label: '专', color: 'bg-[#002045]' }, { label: '业', color: 'bg-[#1A365D]' }, { label: '版', color: 'bg-[#002045]' }],
    status: '已验证',
    statusColor: 'text-green-700',
    storage: 84.2,
  },
  {
    name: '李思睿 (Siri Li)',
    email: 'siri.li_22@gmail.com',
    avatar: '李',
    tiers: [{ label: '专', color: 'bg-stone-400' }, { label: '业', color: 'bg-stone-400' }, { label: '增', color: 'bg-stone-300' }, { label: '强', color: 'bg-stone-300' }, { label: '版', color: 'bg-stone-300' }],
    status: '审核中',
    statusColor: 'text-yellow-600',
    storage: 12.5,
  },
  {
    name: '王志华 (Zhihua Wang)',
    email: 'w.zhihua@arch.com',
    avatar: '王',
    tiers: [{ label: '免', color: 'bg-stone-300' }, { label: '费', color: 'bg-stone-300' }, { label: '版', color: 'bg-stone-300' }],
    status: '已验证',
    statusColor: 'text-green-700',
    storage: 98.9,
  },
  {
    name: '张曼 (Man Zhang)',
    email: 'zhangman@studio.cn',
    avatar: '张',
    tiers: [{ label: '专', color: 'bg-[#002045]' }, { label: '业', color: 'bg-[#1A365D]' }, { label: '版', color: 'bg-[#002045]' }],
    status: '已验证',
    statusColor: 'text-green-700',
    storage: 45.0,
  },
];

const SELECTED_USER = {
  name: '陈墨林',
  uuid: '88-XJ-9921-A',
  lastActive: '2023.10.24 14:02',
  joined: '2021.05.12',
};

export function AdminUsersPageView() {
  const [selectedIdx, setSelectedIdx] = useState(0);

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-full millimeter-grid">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: User List */}
        <div className="lg:col-span-2 space-y-8">
          {/* Page Header */}
          <div className="flex justify-between items-end border-b border-[#c4c6cf]/20 pb-6">
            <div>
              <h2 className="font-serif text-4xl font-black text-[#002045] tracking-tight">
                用户档案库
              </h2>
              <p className="font-mono text-sm text-stone-500 mt-2 uppercase tracking-[0.12em]">
                Repository // TOTAL_USERS: 12,842
              </p>
            </div>
            <div className="flex gap-4">
              <button className="px-5 py-2 border border-[#002045] text-[#002045] font-serif text-sm hover:bg-[#002045]/5 transition-all">
                导出清单
              </button>
              <button className="px-5 py-2 bg-[#002045] text-white font-serif text-sm hover:opacity-90 transition-all">
                新增档案
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white border border-[#c4c6cf]/10 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="px-8 py-4 font-mono text-[10px] text-[#002045] uppercase tracking-[0.1em]">
                    用户信息 / User Profile
                  </th>
                  <th className="px-4 py-4 font-mono text-[10px] text-[#002045] uppercase tracking-[0.1em]">
                    订阅层级 / Tier
                  </th>
                  <th className="px-4 py-4 font-mono text-[10px] text-[#002045] uppercase tracking-[0.1em]">
                    验证状态 / Status
                  </th>
                  <th className="px-4 py-4 font-mono text-[10px] text-[#002045] uppercase tracking-[0.1em]">
                    存储配额 / Storage
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {MOCK_USERS.map((user, i) => (
                  <tr
                    key={user.email}
                    onClick={() => setSelectedIdx(i)}
                    className={`hover:bg-[#e3e2df] transition-colors cursor-pointer ${
                      selectedIdx === i ? 'bg-[#f4f4f0]' : ''
                    }`}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-stone-200 flex items-center justify-center font-serif text-lg font-bold text-[#002045] border border-stone-300">
                          {user.avatar}
                        </div>
                        <div>
                          <p className="font-serif font-bold text-[#002045]">{user.name}</p>
                          <p className="font-mono text-[10px] text-stone-400 mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex gap-0.5">
                        {user.tiers.map((t, ti) => (
                          <span key={ti} className={`${t.color} text-white text-[10px] px-1.5 py-0.5 font-bold`}>
                            {t.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className={`text-xs font-bold ${user.statusColor}`}>
                        {user.statusColor.includes('green') ? '●' : '◐'} {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="space-y-1.5">
                        <span className="font-mono text-xs">{user.storage}%</span>
                        <div className="h-1.5 w-24 bg-stone-200">
                          <div className="h-full bg-[#002045]" style={{ width: `${user.storage}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-8 py-5 border-t border-stone-100 flex justify-between items-center">
              <p className="font-mono text-[10px] text-stone-400">
                显示第 1-10 条，共 12,842 条记录
              </p>
              <div className="flex gap-2">
                <button className="px-3 py-1 border border-stone-300 font-mono text-[10px] hover:border-[#002045] transition-all">
                  上一页
                </button>
                <button className="px-3 py-1 border border-stone-300 font-mono text-[10px] hover:border-[#002045] transition-all">
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: User Detail Panel */}
        <div className="space-y-6">
          <div className="bg-white border border-[#c4c6cf]/10 shadow-sm p-8 space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 bg-stone-200 border border-stone-300 flex items-center justify-center relative">
                <span className="font-serif text-4xl font-bold text-[#002045]">
                  {SELECTED_USER.name[0]}
                </span>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#002045] mt-4">
                {SELECTED_USER.name}
              </h3>
              <p className="font-mono text-[10px] text-stone-400 mt-1 uppercase tracking-[0.1em]">
                UUID: {SELECTED_USER.uuid}
              </p>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-stone-200 p-3">
                <p className="font-mono text-[10px] text-stone-400 uppercase tracking-tight">
                  最后活动 / LAST ACTIVE
                </p>
                <p className="font-mono text-sm font-bold mt-1">{SELECTED_USER.lastActive}</p>
              </div>
              <div className="border border-stone-200 p-3">
                <p className="font-mono text-[10px] text-stone-400 uppercase tracking-tight">
                  入驻日期 / JOINED
                </p>
                <p className="font-mono text-sm font-bold mt-1">{SELECTED_USER.joined}</p>
              </div>
            </div>

            {/* Activity Chart placeholder */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="font-mono text-[10px] text-stone-500 uppercase tracking-[0.1em]">
                  活跃度分析 / ACTIVITY_PLOTTING
                </p>
                <span className="font-mono text-[10px] text-stone-400">过去 30 天</span>
              </div>
              <div className="h-28 bg-[#f4f4f0] border border-stone-200 relative overflow-hidden p-2">
                <svg className="w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="activityGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgba(0,32,69,0.1)" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                  <path d="M0 60 L30 55 L60 50 L90 65 L120 40 L150 35 L180 45 L200 25" fill="none" stroke="#002045" strokeWidth="2" />
                  <path d="M0 60 L30 55 L60 50 L90 65 L120 40 L150 35 L180 45 L200 25 V80 H0 Z" fill="url(#activityGrad)" />
                </svg>
              </div>
            </div>
          </div>

          {/* Admin Commands */}
          <div className="bg-white border border-[#c4c6cf]/10 shadow-sm p-6 space-y-1">
            <p className="font-mono text-[10px] text-stone-500 uppercase tracking-[0.1em] mb-3">
              管理操作 / ADMIN_CMDS
            </p>
            {[
              { icon: 'history', label: '重置安全凭证' },
              { icon: 'tune', label: '调整配额权限' },
              { icon: 'block', label: '永久封禁此账户', danger: true },
            ].map((cmd) => (
              <button
                key={cmd.label}
                className={`w-full flex items-center gap-3 px-4 py-3 border border-stone-100 text-sm hover:bg-[#f4f4f0] transition-all text-left ${
                  cmd.danger ? 'text-red-600 hover:bg-red-50' : 'text-stone-700'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{cmd.icon}</span>
                {cmd.label}
                <span className="material-symbols-outlined text-sm ml-auto text-stone-300">chevron_right</span>
              </button>
            ))}
          </div>

          {/* System Note */}
          <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-yellow-700 font-bold mb-2">
              系统注释 / SYS_NOTE
            </p>
            <p className="text-xs text-stone-600 leading-relaxed">
              该用户近期频繁触及API限流阈值。建议观察其工作流是否存在异常自动化循环。—— 节点管理员 A-14
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 pt-6 border-t border-[#c4c6cf]/10 flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1A365D] text-white flex items-center justify-center font-mono text-xs font-bold">
            管
          </div>
          <div>
            <p className="text-xs font-bold text-stone-700">管理员</p>
            <p className="font-mono text-[10px] text-stone-400 uppercase tracking-tight">ADMIN-0922</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
