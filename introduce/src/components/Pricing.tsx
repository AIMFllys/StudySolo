import React, { useState } from 'react';

/* ============================================
   Pricing data
   ============================================ */
const monthlyPlans = [
    {
        name: '免费版', price: 0, unit: '永久',
        desc: '基础体验，开启 AI 之旅',
        badge: null, style: 'default' as const,
        features: ['1GB 云端存储', '10 个工作流', '2 并发执行', '基础 AI 模型'],
        btnText: '当前计划', btnStyle: 'ghost' as const,
    },
    {
        name: 'Pro 版', price: 25, unit: '月',
        desc: '高性价比，适合个人进阶',
        badge: '入门首选', style: 'default' as const,
        features: ['3GB 云端存储', '50 个工作流', '5 并发执行', '满血模型 (GPT-4/Claude-3)'],
        btnText: '立即订阅', btnStyle: 'outline' as const,
    },
    {
        name: 'Pro+ 版', price: 79, unit: '月',
        desc: '专业生产力工具，全能表现',
        badge: '最受欢迎', style: 'active' as const,
        features: ['10GB 云端存储', '200 个工作流', '10 并发执行', '🎁 赠送 1037soloAI 对话会员'],
        btnText: '立即订阅', btnStyle: 'primary' as const,
    },
    {
        name: 'Ultra 版', price: 1299, unit: '月',
        desc: '企业级性能与专属服务',
        badge: null, style: 'ultra' as const,
        features: ['100GB 云端存储', '无限制 工作流', '100 并发执行', '👤 专属客户经理'],
        btnText: '联系销售', btnStyle: 'amber' as const,
    },
];

const yearlyPlans = monthlyPlans.map(p => ({
    ...p,
    price: p.price === 0 ? 0 : Math.round(p.price * 10),
    unit: p.price === 0 ? '永久' : '年',
    originalMonthly: p.price,
}));

const addons = [
    {
        icon: '💾', title: '存储空间', color: '#3B82F6',
        items: [
            { label: '+ 10GB', price: 5 },
            { label: '+ 50GB', price: 20 },
            { label: '+ 100GB', price: 35, hot: true },
        ],
    },
    {
        icon: '🔀', title: '工作流数量', color: '#8B5CF6',
        items: [
            { label: '+ 50 个', price: 15 },
            { label: '+ 200 个', price: 45 },
            { label: '+ 500 个', price: 99 },
        ],
    },
    {
        icon: '⚡', title: '并发执行', color: '#10B981',
        items: [
            { label: '+ 2 并发', price: 30 },
            { label: '+ 5 并发', price: 65 },
            { label: '+ 10 并发', price: 110 },
        ],
    },
];

const comparisonRows = [
    { label: '云端存储', vals: ['1 GB', '3 GB', '10 GB', '100 GB'] },
    { label: '最大工作流', vals: ['10 个', '50 个', '200 个', '无限制'] },
    { label: '并发执行数', vals: ['2', '5', '10', '100'] },
    { label: 'AI 模型', vals: ['基础', '满血', '满血+优先', '私有部署'] },
    { label: 'SoloAI 会员', vals: ['✗', '✗', '✓', '✓'], isIcon: true },
    { label: '客服支持', vals: ['社区', '邮件', '优先工单', '1v1 经理'] },
    { label: '学生折扣', vals: ['-', '8折', '7折', '-'] },
];

/* ============================================
   Toggle Button component
   ============================================ */
const ToggleGroup: React.FC<{
    options: { key: string; label: string; badge?: string }[];
    value: string;
    onChange: (v: string) => void;
    accentGradient?: boolean;
}> = ({ options, value, onChange, accentGradient }) => (
    <div style={{
        display: 'inline-flex', padding: '3px', borderRadius: '10px',
        background: 'var(--surface-dim)', border: '1px solid var(--border-color)',
    }}>
        {options.map(opt => {
            const isActive = value === opt.key;
            return (
                <button
                    key={opt.key}
                    onClick={() => onChange(opt.key)}
                    style={{
                        padding: '0.4rem 1rem', borderRadius: '8px',
                        fontSize: '0.82rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                        fontFamily: 'inherit',
                        background: isActive
                            ? (accentGradient ? 'var(--gradient-brand)' : 'var(--surface-glass)')
                            : 'transparent',
                        color: isActive
                            ? (accentGradient ? '#fff' : 'var(--text-primary)')
                            : 'var(--text-faint)',
                        boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                        transition: 'all 0.2s ease',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                    }}
                >
                    {opt.label}
                    {opt.badge && isActive && (
                        <span style={{
                            fontSize: '0.6rem', fontWeight: 700,
                            background: accentGradient ? 'rgba(255,255,255,0.2)' : 'var(--brand-emerald)15',
                            color: accentGradient ? '#fff' : 'var(--brand-emerald)',
                            padding: '1px 6px', borderRadius: '999px',
                        }}>
                            {opt.badge}
                        </span>
                    )}
                </button>
            );
        })}
    </div>
);

/* ============================================
   Pricing component
   ============================================ */
const Pricing: React.FC = () => {
    const [payment, setPayment] = useState('domestic');
    const [billing, setBilling] = useState('yearly');
    const [mode, setMode] = useState<'subscription' | 'addon'>('subscription');

    const plans = billing === 'yearly' ? yearlyPlans : monthlyPlans;
    const currencySymbol = payment === 'domestic' ? '¥' : '$';
    const priceMultiplier = payment === 'overseas' ? 0.15 : 1; // rough CNY→USD

    const formatPrice = (price: number) => {
        const adjusted = Math.round(price * priceMultiplier);
        return adjusted === 0 ? `${currencySymbol}0` : `${currencySymbol}${adjusted}`;
    };

    return (
        <section className="section" id="pricing" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Background orbs */}
            <div style={{ position: 'absolute', top: '-10%', left: '20%', width: 500, height: 500, background: 'var(--brand-blue)', opacity: 0.04, borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: 600, height: 600, background: 'var(--brand-emerald)', opacity: 0.03, borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <span className="section-label">💎 定价方案</span>
                    <h2 className="section-title">
                        升级您的生产力，<span className="text-gradient">释放 AI 无限潜能</span>
                    </h2>
                    <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto 1rem auto' }}>
                        专为专业人士打造的高端 AI 工作流平台。选择适合您的计划，解锁无限可能。
                    </p>
                    <a href="#" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        fontSize: '0.88rem', color: 'var(--brand-emerald)', fontWeight: 500,
                        borderBottom: '1px dashed', paddingBottom: '2px', textDecoration: 'none',
                    }}>
                        🎓 学生认证可享专属特权与优惠 &gt;
                    </a>
                </div>

                {/* Toggle bar */}
                <div style={{
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap',
                }}>
                    <ToggleGroup
                        options={[
                            { key: 'domestic', label: '🇨🇳 国内支付' },
                            { key: 'overseas', label: '🌍 海外支付' },
                        ]}
                        value={payment}
                        onChange={setPayment}
                    />

                    <ToggleGroup
                        options={[
                            { key: 'monthly', label: '月付' },
                            { key: 'yearly', label: '年付', badge: '省2个月' },
                        ]}
                        value={billing}
                        onChange={setBilling}
                        accentGradient
                    />

                    <ToggleGroup
                        options={[
                            { key: 'subscription', label: '📦 包月订阅' },
                            { key: 'addon', label: '🛒 按量加购' },
                        ]}
                        value={mode}
                        onChange={(v) => setMode(v as 'subscription' | 'addon')}
                    />
                </div>

                {/* ======================== SUBSCRIPTION VIEW ======================== */}
                {mode === 'subscription' && (
                    <div className="grid-4" style={{
                        alignItems: 'stretch', gap: '1.25rem',
                        maxWidth: '1200px', margin: '0 auto',
                    }}>
                        {plans.map((plan, idx) => {
                            const isActive = plan.style === 'active';
                            const isUltra = plan.style === 'ultra';

                            return (
                                <div
                                    key={idx}
                                    className="glass-card"
                                    style={{
                                        padding: '2rem', position: 'relative',
                                        display: 'flex', flexDirection: 'column',
                                        borderRadius: 'var(--radius-2xl)',
                                        border: isActive ? '1px solid var(--brand-blue)60' : isUltra ? '1px solid var(--brand-amber)30' : '1px solid var(--border-color)',
                                        borderTop: isActive ? '3px solid var(--brand-blue)' : isUltra ? '3px solid var(--brand-amber)40' : '1px solid var(--border-color)',
                                        boxShadow: isActive ? '0 0 30px rgba(99,102,241,0.12), var(--shadow-xl)' : isUltra ? '0 0 20px rgba(245,158,11,0.06)' : 'var(--shadow-md)',
                                        transform: isActive ? 'scale(1.03) translateY(-8px)' : 'none',
                                        zIndex: isActive ? 10 : 1,
                                        background: isActive ? 'linear-gradient(150deg, rgba(99,102,241,0.06) 0%, var(--surface) 100%)' : isUltra ? 'linear-gradient(150deg, rgba(245,158,11,0.04) 0%, var(--surface) 100%)' : undefined,
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    {/* Badge */}
                                    {plan.badge && (
                                        <div style={{
                                            position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                                            background: isActive ? 'var(--gradient-brand)' : 'var(--surface-dim)',
                                            color: isActive ? '#fff' : 'var(--text-muted)',
                                            padding: '0.25rem 1rem', borderRadius: '999px',
                                            fontSize: '0.68rem', fontWeight: 800, whiteSpace: 'nowrap' as const,
                                            boxShadow: isActive ? 'var(--shadow-glow-blue)' : 'var(--shadow-sm)',
                                            border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border-color)',
                                            letterSpacing: '0.05em',
                                        }}>
                                            {plan.badge}
                                        </div>
                                    )}

                                    {/* Plan name */}
                                    <h3 style={{
                                        fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem',
                                        marginTop: plan.badge ? '0.5rem' : 0,
                                        color: isActive ? 'var(--brand-blue)' : isUltra ? 'var(--brand-amber)' : 'var(--text-primary)',
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    }}>
                                        {plan.name}
                                        {isUltra && <span style={{ fontSize: '0.9rem' }}>👑</span>}
                                    </h3>

                                    {/* Price */}
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', marginBottom: '0.4rem' }}>
                                        <span style={{
                                            fontSize: isActive ? '2.6rem' : '2.2rem', fontWeight: 800,
                                            color: 'var(--text-primary)', letterSpacing: '-0.02em',
                                        }}>
                                            {formatPrice(plan.price)}
                                        </span>
                                        <span style={{ fontSize: '0.88rem', color: 'var(--text-faint)', fontWeight: 500 }}>
                                            / {plan.unit}
                                        </span>
                                    </div>

                                    {/* Yearly savings hint */}
                                    {billing === 'yearly' && (plan as any).originalMonthly > 0 && (
                                        <div style={{
                                            fontSize: '0.7rem', color: 'var(--brand-emerald)', fontWeight: 600,
                                            marginBottom: '0.5rem',
                                        }}>
                                            ≈ {formatPrice((plan as any).originalMonthly * 0.83)}/月，省 {formatPrice((plan as any).originalMonthly * 2)}
                                        </div>
                                    )}

                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-faint)', marginBottom: '1.25rem', minHeight: '1.5rem' }}>
                                        {plan.desc}
                                    </p>

                                    {/* CTA */}
                                    <button
                                        className={`btn ${plan.btnStyle === 'primary' ? 'btn-primary' : plan.btnStyle === 'outline' ? 'btn-outline' : ''}`}
                                        style={{
                                            width: '100%', borderRadius: 'var(--radius-lg)',
                                            fontSize: '0.88rem', marginBottom: '1.5rem',
                                            padding: isActive ? '0.7rem' : '0.6rem', fontWeight: 700,
                                            ...(plan.btnStyle === 'amber' ? {
                                                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                                                color: 'var(--brand-amber)',
                                            } : {}),
                                            ...(plan.btnStyle === 'ghost' ? {
                                                background: 'var(--surface-dim)', border: '1px solid var(--border-color)',
                                                color: 'var(--text-faint)',
                                            } : {}),
                                        }}
                                    >
                                        {plan.btnText}
                                    </button>

                                    {/* Features */}
                                    <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        {plan.features.map((feat, fi) => (
                                            <li key={fi} style={{
                                                display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                                                fontSize: '0.85rem', color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                                            }}>
                                                <span style={{
                                                    color: isActive ? 'var(--brand-emerald)' : isUltra ? 'var(--brand-amber)' : 'var(--text-faint)',
                                                    flexShrink: 0, fontSize: '0.85rem',
                                                }}>✓</span>
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ======================== ADD-ON VIEW ======================== */}
                {mode === 'addon' && (
                    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        <div className="grid-3" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
                            {addons.map((addon, i) => (
                                <div key={i} className="glass-card" style={{
                                    padding: '1.5rem', borderRadius: 'var(--radius-xl)',
                                    borderTop: `3px solid ${addon.color}`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                        <span style={{
                                            fontSize: '1.3rem', width: 40, height: 40, borderRadius: '10px',
                                            background: `${addon.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: `1px solid ${addon.color}20`,
                                        }}>
                                            {addon.icon}
                                        </span>
                                        <div>
                                            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{addon.title}</h4>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>灵活扩展 · 按需付费</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {addon.items.map((item, j) => (
                                            <div key={j} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '0.65rem 0.85rem', borderRadius: '8px',
                                                background: (item as any).hot ? `${addon.color}08` : 'var(--surface-dim)',
                                                border: (item as any).hot ? `1px solid ${addon.color}25` : '1px solid var(--border-color)',
                                                cursor: 'pointer', transition: 'all 0.2s ease',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
                                                    {(item as any).hot && (
                                                        <span style={{
                                                            fontSize: '0.55rem', fontWeight: 700, color: addon.color,
                                                            background: `${addon.color}15`, padding: '1px 6px', borderRadius: '4px',
                                                        }}>
                                                            推荐
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{
                                                    fontSize: '0.95rem', fontWeight: 700,
                                                    color: (item as any).hot ? addon.color : 'var(--text-primary)',
                                                }}>
                                                    {formatPrice(item.price)}
                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)', fontWeight: 500 }}>/月</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-faint)' }}>
                            💡 按量加购可叠加在任意订阅计划之上，即买即生效
                        </p>
                    </div>
                )}

                {/* ======================== COMPARISON TABLE ======================== */}
                <div style={{
                    maxWidth: '1100px', margin: '4rem auto 3rem auto',
                    borderRadius: 'var(--radius-2xl)',
                    background: 'var(--surface-glass)', backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid var(--border-color)', overflow: 'hidden',
                    boxShadow: 'var(--shadow-lg)',
                }}>
                    <div style={{
                        padding: '1.25rem 2rem', borderBottom: '1px solid var(--border-color)',
                        background: 'var(--surface-dim)', textAlign: 'center',
                    }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>详细功能对比</h3>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--surface-dim)' }}>
                                    <th style={{ padding: '0.85rem 1.5rem', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)', width: '24%' }}>功能维度</th>
                                    <th style={{ padding: '0.85rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'center', width: '19%' }}>免费版</th>
                                    <th style={{ padding: '0.85rem', fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'center', width: '19%' }}>Pro</th>
                                    <th style={{ padding: '0.85rem', fontSize: '0.82rem', color: 'var(--brand-blue)', fontWeight: 700, textAlign: 'center', width: '19%', background: 'var(--brand-blue)06', borderTop: '2px solid var(--brand-blue)' }}>Pro+</th>
                                    <th style={{ padding: '0.85rem', fontSize: '0.82rem', color: 'var(--brand-amber)', fontWeight: 600, textAlign: 'center', width: '19%' }}>Ultra</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonRows.map((row, ri) => (
                                    <tr key={ri} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.8rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{row.label}</td>
                                        {row.vals.map((val, vi) => (
                                            <td key={vi} style={{
                                                padding: '0.8rem', fontSize: '0.85rem', textAlign: 'center',
                                                fontWeight: vi >= 2 ? 600 : 400,
                                                color: row.isIcon
                                                    ? (val === '✓' ? (vi === 2 ? 'var(--brand-emerald)' : 'var(--brand-amber)') : 'var(--text-faint)')
                                                    : vi === 3 ? 'var(--brand-amber)' : vi === 2 ? 'var(--text-primary)' : vi === 1 ? 'var(--text-secondary)' : 'var(--text-muted)',
                                                background: vi === 2 ? 'var(--brand-blue)04' : 'transparent',
                                                opacity: row.isIcon && val === '✗' ? 0.4 : 1,
                                            }}>
                                                {val}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom notes */}
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '2rem', marginTop: '1.5rem' }}>
                    {[
                        { icon: '🎓', text: '学生认证后，免费版可调用满血模型' },
                        { icon: '📅', text: '年付 ≈ 月付×10（赠送 2 个月）' },
                        { icon: '💬', text: '有疑问？联系 feedback@1037solo.com' },
                    ].map((note, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500,
                        }}>
                            <span style={{ fontSize: '1rem' }}>{note.icon}</span>
                            {note.text}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
