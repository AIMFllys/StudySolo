'use client';

import { useState } from 'react';

/* ═══ MOCK DATA ═══ */
const MOCK_AUDIT_KPI = [
  { label: 'TOTAL OPS (24H)', value: '128,492', note: '↗ +14.2% from mean', noteColor: 'text-green-700', bg: '' },
  { label: 'ABNORMAL ALARMS', value: '04', note: 'Requires Immediate Review', noteColor: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  { label: 'SYSTEM HEALTH INDEX', value: '99.98%', note: '', noteColor: '', bg: '' },
  { label: 'SECURITY PASS RATE', value: '100%', note: '● Compliant ISO-27001', noteColor: 'text-green-700', bg: '' },
];

const MOCK_AUDIT_ENTRIES = [
  { id: 'TX-8829-AF', operator: 'zhang_wei', ip: '192.168.1.104', os: '(MacOS)', action: 'LOGIN_AUTH', actionStyle: 'border-stone-300 text-stone-700', ref: 'User_Portal_...', isAlert: false },
  { id: 'TX-8830-BC', operator: 'sys_daemon', ip: 'Internal_Host_09', os: '', action: 'CREATE_WFLOW', actionStyle: 'border-stone-300 text-stone-700', ref: 'Node_Cluster...', isAlert: false },
  { id: 'TX-8831-FE', operator: 'unknown_ip', ip: '45.2.19.102', os: '(Linux)', action: 'DATA_EXPORT', actionStyle: 'border-red-300 text-red-700', ref: 'Financial_R...', isAlert: true },
  { id: 'TX-8832-KL', operator: 'li_na', ip: '192.168.1.112', os: '(iPhone)', action: 'MOD_CONFIG', actionStyle: 'border-stone-300 text-stone-700', ref: 'SLA_Settings...', isAlert: false },
  { id: 'TX-8833-PP', operator: 'zhang_wei', ip: '192.168.1.104', os: '(MacOS)', action: 'LOGOUT', actionStyle: 'border-stone-300 text-stone-700', ref: 'User_Portal_...', isAlert: false },
];

const MOCK_INSPECTION = {
  traceId: '8831-FE',
  lat: '31.2304° N',
  lon: '121.4737° E',
  payload: `{
  "header": {
    "trace_id": "8831-FE",
    "priority": "HIGH_SEC"
  },
  "body": {
    "action": "SEC_EXPORT",
    "resource": "/api/v2/finance/reports",
    "params": {
      "range": "Q3-2023",
      "fmt": "parquet"
    }
  },
  "context": {
    "suspicion_score": 0.94,
    "mfa_bypass_attempt": true
  }
}`,
};

export function AdminAuditPageView() {
  const [selectedEntry, setSelectedEntry] = useState<string | null>('TX-8831-FE');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 millimeter-grid min-h-full">
      {/* Page Header */}
      <div className="flex justify-between items-start border-b border-[#c4c6cf]/20 pb-6">
        <div className="flex gap-3">
          <div className="w-1 bg-[#002045] self-stretch" />
          <div>
            <h2 className="font-serif text-4xl font-black text-[#002045] tracking-tight">
              全量审计与安全日志
            </h2>
            <p className="font-mono text-sm text-stone-500 mt-2 uppercase tracking-[0.12em]">
              ■ SYSTEM_AUDIT_PROTOCOL_V4.2.0-STABLE
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-2 bg-[#002045] text-white font-mono text-xs uppercase tracking-[0.12em] flex items-center gap-2 hover:opacity-90 transition-all">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Ledger
          </button>
          <button className="px-6 py-2 border border-[#002045] text-[#002045] font-mono text-xs uppercase tracking-[0.12em] hover:bg-[#002045]/5 transition-all">
            Filter Parameters
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_AUDIT_KPI.map((kpi) => (
          <div key={kpi.label} className={`border border-[#c4c6cf]/10 p-6 shadow-sm ${kpi.bg || 'bg-white'}`}>
            <p className={`font-mono text-[10px] uppercase tracking-tight ${kpi.bg ? 'text-red-600' : 'text-stone-500'}`}>
              {kpi.label}
            </p>
            <h3 className={`font-mono text-3xl font-bold mt-2 ${kpi.bg ? 'text-red-700' : 'text-[#1b1c1a]'}`}>
              {kpi.value}
            </h3>
            {kpi.note ? (
              <>
                <div className={`mt-3 h-0.5 w-full ${kpi.bg ? 'bg-red-200' : 'bg-[#002045]'}`} />
                <p className={`font-mono text-[10px] mt-2 ${kpi.noteColor}`}>{kpi.note}</p>
              </>
            ) : (
              <div className="mt-3 h-0.5 w-full bg-[#002045]" />
            )}
          </div>
        ))}
      </div>

      {/* Audit Stream + Inspection Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Audit Stream Table */}
        <div className="lg:col-span-3 bg-white border border-[#c4c6cf]/10 shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-stone-100 flex justify-between items-center">
            <h4 className="font-mono text-xs uppercase tracking-[0.15em] text-[#002045] font-bold">
              Active Audit Stream
            </h4>
            <span className="font-mono text-[10px] text-stone-400">
              Synced: 2023-11-24 14:22:01 UTC
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200">
                  {['TRANSACTION_ID', 'OPERATOR_ENTITY', 'ACTION_TYPE', 'OBJECT_REF'].map((h) => (
                    <th key={h} className="px-8 py-4 font-mono text-[10px] text-[#002045] uppercase tracking-[0.1em]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {MOCK_AUDIT_ENTRIES.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry.id)}
                    className={`hover:bg-[#e3e2df] transition-colors cursor-pointer ${
                      selectedEntry === entry.id ? 'bg-[#f4f4f0]' : ''
                    }`}
                  >
                    <td className="px-8 py-4 font-mono text-xs text-stone-500">{entry.id}</td>
                    <td className="px-8 py-4">
                      <div>
                        <p className={`text-sm font-bold ${entry.isAlert ? 'text-red-600' : 'text-[#1b1c1a]'}`}>
                          {entry.operator}
                        </p>
                        <p className={`font-mono text-[10px] mt-0.5 ${entry.isAlert ? 'text-red-400' : 'text-stone-400'}`}>
                          {entry.ip} {entry.os}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-2 py-1 border ${entry.actionStyle} font-mono text-[10px] uppercase tracking-tight`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-8 py-4 font-mono text-xs text-stone-500 truncate max-w-[120px]">
                      {entry.ref}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-8 py-4 border-t border-stone-100 flex justify-between items-center">
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-stone-300 font-mono text-[10px] uppercase hover:border-[#002045] transition-all">
                PREV_BATCH
              </button>
              <button className="px-3 py-1 border border-stone-300 font-mono text-[10px] uppercase hover:border-[#002045] transition-all">
                NEXT_BATCH
              </button>
            </div>
            <p className="font-mono text-[10px] text-stone-400">Showing indices 001 - 025 of 12,402</p>
          </div>
        </div>

        {/* Inspection Pane */}
        <div className="lg:col-span-2 bg-white border border-[#c4c6cf]/10 shadow-sm p-8 space-y-6">
          <div className="flex justify-between items-start">
            <h4 className="font-serif text-xl font-bold text-[#002045]">Inspection_Pane</h4>
            <button className="p-1 text-stone-400 hover:text-stone-600 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Map Placeholder */}
          <div>
            <p className="font-mono text-[10px] uppercase text-stone-500 tracking-[0.12em] mb-2">
              ACCESS_COORDINATES
            </p>
            <div className="w-full h-36 bg-[#e3e2df] border border-stone-200 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(0,32,69,0.1) 15px, rgba(0,32,69,0.1) 16px), repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(0,32,69,0.1) 15px, rgba(0,32,69,0.1) 16px)',
              }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500/60 rounded-full border-2 border-red-600" />
            </div>
            <div className="flex justify-between mt-2 font-mono text-[10px] text-stone-400">
              <span>LAT: {MOCK_INSPECTION.lat}</span>
              <span>LON: {MOCK_INSPECTION.lon}</span>
            </div>
          </div>

          {/* Raw JSON Payload */}
          <div>
            <p className="font-mono text-[10px] uppercase text-stone-500 tracking-[0.12em] mb-2">
              RAW_JSON_PAYLOAD
            </p>
            <pre className="bg-[#1b1c1a] text-green-400 p-4 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-64 overflow-y-auto">
              {MOCK_INSPECTION.payload}
            </pre>
          </div>

          {/* Threat Profile */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="font-mono text-[10px] uppercase text-stone-500 tracking-[0.12em]">
                THREAT_PROFILE
              </p>
              <span className="px-2 py-0.5 bg-red-600 text-white font-mono text-[10px] uppercase font-bold">
                CRITICAL
              </span>
            </div>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`h-1.5 flex-1 ${i <= 4 ? 'bg-red-500' : 'bg-stone-200'}`} />
              ))}
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              The signature matches known patterns of data exfiltration via unauthorized terminal injection.
            </p>
          </div>

          {/* Action Button */}
          <button className="w-full py-3 bg-red-600 text-white font-mono text-xs uppercase tracking-[0.15em] hover:bg-red-700 transition-all">
            Revoke_Access_Keys
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-6 border-t border-[#c4c6cf]/10 flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
        <p className="font-mono text-[10px] text-stone-400 uppercase tracking-[0.15em]">
          CORE_VERSION: 1.8.4-R || NODE: CLUSTER_01_PROD
        </p>
        <p className="font-mono text-[10px] text-stone-400 uppercase tracking-[0.15em]">
          © 2024 STUDY_SOLO ARCHITECTURAL AUDIT SYSTEM
        </p>
      </footer>
    </div>
  );
}
