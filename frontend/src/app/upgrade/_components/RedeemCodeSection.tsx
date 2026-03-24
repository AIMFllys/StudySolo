'use client';

import { useState } from 'react';
import { Ticket, Loader2, CheckCircle2, XCircle } from 'lucide-react';

type RedeemStatus = 'idle' | 'loading' | 'success' | 'error';

interface RedeemResult {
  type: string;
  description: string;
  duration_days: number | null;
}

export default function RedeemCodeSection() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<RedeemStatus>('idle');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<RedeemResult | null>(null);

  async function handleRedeem() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setStatus('loading');
    setMessage('');
    setResult(null);

    try {
      // Query Supabase for the code (via API or direct client)
      // For now, use a simple fetch to our backend or direct Supabase REST
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        setStatus('error');
        setMessage('系统配置缺失，请联系管理员。');
        return;
      }

      const res = await fetch(
        `${supabaseUrl}/rest/v1/redeem_codes?code=eq.${encodeURIComponent(trimmed)}&is_active=eq.true&select=code,type,description,duration_days,max_uses,used_count`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );

      if (!res.ok) {
        setStatus('error');
        setMessage('查询失败，请稍后重试。');
        return;
      }

      const data = await res.json();

      if (!data || data.length === 0) {
        setStatus('error');
        setMessage('兑换码无效或已过期。');
        return;
      }

      const codeData = data[0];

      if (codeData.used_count >= codeData.max_uses) {
        setStatus('error');
        setMessage('该兑换码已达到使用上限。');
        return;
      }

      // Code found and valid
      setStatus('success');
      setResult({
        type: codeData.type,
        description: codeData.description,
        duration_days: codeData.duration_days,
      });
      setMessage('兑换码验证成功！');

    } catch {
      setStatus('error');
      setMessage('网络错误，请检查连接后重试。');
    }
  }

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      student_verify: '🎓 学生认证',
      tier_pro: '💎 Pro 会员',
      tier_pro_plus: '💠 Pro+ 会员',
      tier_ultra: '👑 Ultra 旗舰',
    };
    return map[type] || type;
  };

  return (
    <div className="mt-20 w-full max-w-2xl paper-card stitched-border rounded-none p-8 transform -rotate-[0.3deg]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 border-b border-[#e2e2d5] pb-4">
        <Ticket className="w-5 h-5 text-[#2c5282]" />
        <h3 className="text-lg font-bold text-[#2c5282] font-serif">兑换码激活</h3>
        <span className="text-[10px] font-mono text-[#4a5568] uppercase tracking-widest ml-auto">
          Redeem Code
        </span>
      </div>

      <p className="text-xs text-[#4a5568] mb-5 font-serif leading-relaxed">
        输入您获得的兑换码以激活对应的会员权益。兑换码可从官方活动、社区奖励或合作伙伴渠道获取。
      </p>

      {/* Input + Button */}
      <div className="flex gap-3">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (status !== 'idle') {
              setStatus('idle');
              setMessage('');
              setResult(null);
            }
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
          placeholder="输入兑换码，如 SOLO-PRO-TRIAL"
          className="flex-1 px-4 py-2.5 border border-[#e2e2d5] bg-white text-sm font-mono tracking-wider
                     placeholder:text-[#4a5568]/40 focus:outline-none focus:border-[#2c5282] focus:ring-1 focus:ring-[#2c5282]/20
                     transition-all uppercase"
          disabled={status === 'loading'}
        />
        <button
          type="button"
          onClick={handleRedeem}
          disabled={!code.trim() || status === 'loading'}
          className="px-6 py-2.5 bg-[#2c5282] text-white font-bold text-xs font-mono uppercase tracking-widest
                     hover:bg-[#1a202c] transition-all disabled:opacity-40 disabled:cursor-not-allowed
                     flex items-center gap-2 shrink-0"
        >
          {status === 'loading' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            '立即兑换'
          )}
        </button>
      </div>

      {/* Result feedback */}
      {message && (
        <div className={`mt-4 p-3 border text-xs font-mono flex items-start gap-2 transition-all ${
          status === 'success'
            ? 'border-[#065f46]/30 bg-[#065f46]/5 text-[#065f46]'
            : 'border-[#9b2c2c]/30 bg-[#9b2c2c]/5 text-[#9b2c2c]'
        }`}>
          {status === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div className="flex flex-col gap-1">
            <span className="font-bold">{message}</span>
            {result && (
              <>
                <span>权益类型: {getTypeLabel(result.type)}</span>
                <span className="text-[10px] opacity-80">{result.description}</span>
                {result.duration_days && (
                  <span>有效期: {result.duration_days} 天</span>
                )}
                <span className="text-[10px] mt-1 opacity-60">
                  ⚠️ 兑换码验证通过。实际权益激活需登录后操作（功能开发中）。
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
