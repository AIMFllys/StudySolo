'use client';

import { useState } from 'react';

/* ═══ MOCK DATA ═══ */
const SECTIONS = [
  { id: 'basic', label: '基础设置' },
  { id: 'api', label: 'API 配置' },
  { id: 'payment', label: '支付通道' },
  { id: 'security', label: '安全策略' },
  { id: 'members', label: '成员管理' },
];

const PAYMENT_CHANNELS = [
  { name: 'Alipay / 支付宝企业版', status: 'ACTIVE', statusColor: 'text-green-600', fee: '0.66%', action: 'CONFIGURE' },
  { name: 'WeChat Pay / 微信支付', status: 'ACTIVE', statusColor: 'text-green-600', fee: '0.66%', action: 'CONFIGURE' },
  { name: 'Stripe Global', status: 'SUSPENDED', statusColor: 'text-yellow-600', fee: '2.90% + $0.3', action: 'RE-ENABLE' },
];

export function AdminConfigPageView() {
  const [activeSection, setActiveSection] = useState('api');
  const [twoFaEnabled, setTwoFaEnabled] = useState(true);

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-full millimeter-grid space-y-10">
      {/* Page Header */}
      <div className="border-b border-[#c4c6cf]/20 pb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2">
          System Configuration Terminal
        </p>
        <h2 className="font-serif text-4xl font-black text-[#002045] tracking-tight">
          系统全局配置中心
        </h2>
        <div className="flex items-center gap-4 mt-3 font-mono text-[10px] text-stone-400">
          <span>◷ 最后同步: 2023.10.27 14:30:05</span>
          <span>·</span>
          <span>◉ 状态: 受保护节点</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Section Index / Side Nav */}
        <div className="lg:col-span-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone-500 mb-4">
            Section Index
          </p>
          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`block w-full text-left px-4 py-2.5 font-serif text-sm transition-all ${
                  activeSection === s.id
                    ? 'font-bold text-[#002045] border-l-4 border-[#002045] bg-stone-100'
                    : 'text-stone-500 hover:text-[#002045] border-l-4 border-transparent'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>

          {/* Service Integrity */}
          <div className="mt-8 border border-stone-200 p-4 bg-white">
            <h5 className="font-serif text-sm font-bold text-[#002045] mb-4">服务完整性</h5>
            <div className="space-y-3 font-mono text-[10px]">
              <div className="flex justify-between uppercase tracking-tight">
                <span className="text-stone-500">DB Uptime</span>
                <span className="text-green-600 font-bold">99.99%</span>
              </div>
              <div className="flex justify-between uppercase tracking-tight">
                <span className="text-stone-500">SSL Cert</span>
                <span className="text-stone-700">Valid (240d)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Config Content */}
        <div className="lg:col-span-3 space-y-10">
          {/* API Configuration */}
          <section className="bg-white border border-[#c4c6cf]/10 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#002045]">settings</span>
              <h3 className="font-serif text-xl font-bold text-[#002045]">API 调用配置</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="font-mono text-[10px] uppercase text-stone-500 tracking-[0.1em] block mb-2">
                  全局模型调用配额 (Tokens/Month)
                </label>
                <input
                  type="text"
                  defaultValue="50,000,000"
                  className="w-full border-b-2 border-stone-300 bg-transparent px-0 py-2 font-mono text-lg focus:border-[#002045] focus:ring-0 transition-all"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase text-stone-500 tracking-[0.1em] block mb-2">
                  单次请求 Token 限制
                </label>
                <input
                  type="text"
                  defaultValue="4,096"
                  className="w-full border-b-2 border-stone-300 bg-transparent px-0 py-2 font-mono text-lg focus:border-[#002045] focus:ring-0 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase text-stone-500 tracking-[0.1em] block mb-2">
                Master API Key (Encrypted)
              </label>
              <div className="flex items-center gap-3 border-b-2 border-stone-300 py-2">
                <input
                  type="password"
                  defaultValue="sk_admin_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="flex-1 bg-transparent font-mono text-lg tracking-[0.3em] focus:ring-0 border-none p-0"
                  readOnly
                />
                <button className="text-stone-400 hover:text-stone-600 transition-colors">
                  <span className="material-symbols-outlined">visibility</span>
                </button>
              </div>
              <p className="font-mono text-[10px] text-red-500 mt-2">
                警告：该密钥具有全局最高权限。任何泄露可能导致严重的学术数据损失。
              </p>
            </div>
          </section>

          {/* Payment Channels */}
          <section className="bg-white border border-[#c4c6cf]/10 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#002045]">account_balance</span>
              <h3 className="font-serif text-xl font-bold text-[#002045]">支付通道与网关</h3>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200">
                  {['通道名称', '服务商状态', '手续费率', '操作'].map((h) => (
                    <th key={h} className="py-3 font-mono text-[10px] text-stone-500 uppercase tracking-[0.1em]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {PAYMENT_CHANNELS.map((ch) => (
                  <tr key={ch.name} className="hover:bg-[#f4f4f0] transition-colors">
                    <td className="py-4 font-serif text-sm text-[#002045] font-bold">{ch.name}</td>
                    <td className={`py-4 font-mono text-xs font-bold ${ch.statusColor}`}>
                      ● {ch.status}
                    </td>
                    <td className="py-4 font-mono text-xs">{ch.fee}</td>
                    <td className="py-4">
                      <button className={`px-3 py-1 border font-mono text-[10px] uppercase transition-all ${
                        ch.action === 'RE-ENABLE'
                          ? 'border-[#002045] bg-[#002045] text-white hover:opacity-90'
                          : 'border-stone-300 text-stone-600 hover:border-[#002045]'
                      }`}>
                        {ch.action}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Security Policies */}
          <section className="bg-white border border-[#c4c6cf]/10 shadow-sm p-8 space-y-8">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#002045]">shield</span>
              <h3 className="font-serif text-xl font-bold text-[#002045]">核心安全策略</h3>
            </div>

            {/* 2FA */}
            <div className="flex justify-between items-start">
              <div className="max-w-lg">
                <h4 className="font-serif font-bold text-[#002045]">二次验证 (2FA) 强制策略</h4>
                <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                  开启后，所有具有"管理员"或"财务"角色的账户在登录时必须进行 TOTP 身份验证。
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-stone-500 uppercase">
                  STATUS: {twoFaEnabled ? 'MANDATORY' : 'OPTIONAL'}
                </span>
                <button
                  onClick={() => setTwoFaEnabled(!twoFaEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    twoFaEnabled ? 'bg-[#002045]' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      twoFaEnabled ? 'left-6' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Lockout & Backup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-stone-100">
              <div>
                <label className="font-mono text-[10px] uppercase text-stone-500 tracking-[0.1em] block mb-2">
                  登录尝试限制 (Lockout Threshold)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    defaultValue={5}
                    className="w-20 border-b-2 border-stone-300 bg-transparent px-0 py-2 font-mono text-lg text-center focus:border-[#002045] focus:ring-0 transition-all"
                  />
                  <span className="text-xs text-stone-500">次尝试失败后锁定 30 分钟</span>
                </div>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase text-stone-500 tracking-[0.1em] block mb-2">
                  自动备份频率 (Frequency)
                </label>
                <select className="w-full border-b-2 border-stone-300 bg-transparent px-0 py-2 font-mono text-sm focus:border-[#002045] focus:ring-0 transition-all">
                  <option>每隔 24 小时 (Standard)</option>
                  <option>每隔 12 小时 (Enhanced)</option>
                  <option>每隔 6 小时 (Critical)</option>
                </select>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 border border-red-200 p-6 mt-6">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-red-600 text-xl mt-0.5">warning</span>
                <div>
                  <h4 className="font-serif font-bold text-red-700">高级维护命令</h4>
                  <p className="text-xs text-red-600 mt-1 leading-relaxed">
                    此操作将立即使所有当前活动的管理员会话失效，并强制执行一次全局安全突然性检查。
                  </p>
                  <button className="mt-4 px-4 py-2 bg-red-600 text-white font-mono text-[10px] uppercase tracking-[0.15em] hover:bg-red-700 transition-all">
                    Flash All Sessions
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex justify-end items-center gap-4 pt-8 border-t border-[#c4c6cf]/10">
        <button className="px-6 py-2 text-stone-500 font-serif text-sm hover:text-stone-700 transition-all">
          放弃所有修改
        </button>
        <button className="px-8 py-3 bg-[#002045] text-white font-serif text-sm hover:opacity-90 transition-all">
          应用并同步配置 (Commit)
        </button>
      </div>

      {/* Footer */}
      <footer className="pt-6 border-t border-[#c4c6cf]/10 flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
        <p className="font-mono text-[10px] text-stone-400 uppercase tracking-[0.15em]">
          Document_Ref: System_Config_Alpha_V2.0.4
        </p>
        <p className="font-mono text-[10px] text-stone-400 uppercase tracking-[0.15em]">
          © 2023 StudySolo Academic Core Engine
        </p>
      </footer>
    </div>
  );
}
