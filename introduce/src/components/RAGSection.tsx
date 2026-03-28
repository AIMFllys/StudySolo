import React from 'react';

const layers = [
    {
        number: '01',
        name: '摘要层',
        nameEn: 'Summary Layer',
        coverage: '~80%',
        icon: '📋',
        color: 'var(--brand-blue)',
        tokenCost: '极低',
        desc: '文档上传后 AI 自动摘取核心观点、目录架构和深度摘要。日常概念性问答在此层即可直接解答。搜索迅速，几近零 Token 开销。',
        details: '500-1000 字自动摘要 · 核心观点列表 · 目录架构指针',
    },
    {
        number: '02',
        name: '向量层',
        nameEn: 'Vector Layer',
        coverage: '~15%',
        icon: '🧬',
        color: 'var(--brand-purple)',
        tokenCost: '中等',
        desc: '利用 Supabase pgvector 将文档分块（500-800 tokens）后向量化存储，通过高维语义比对精准定位最相关的 3-5 个原文片段。',
        details: '768 维嵌入向量 · 余弦相似度 · Top-K 精确匹配',
    },
    {
        number: '03',
        name: '原文层',
        nameEn: 'Raw Text Layer',
        coverage: '~5%',
        icon: '📖',
        color: 'var(--brand-emerald)',
        tokenCost: '较高',
        desc: '只在面对极端复杂的学术论文细节分析、深度引证时，模型才根据目录指针阅读完整原文段落。绝大多数场景无需触达此层。',
        details: '目录指针定位 · 完整段落回溯 · 精确引证溯源',
    },
];

/** Custom SVG funnel visualization */
const FunnelVisualization = () => (
    <div style={{
        background: 'linear-gradient(165deg, #0B1221 0%, #0F172A 100%)',
        borderRadius: 'var(--radius-2xl)',
        padding: '2rem',
        border: '1px solid rgba(255,255,255,0.06)',
        color: '#F8FAFC',
        fontFamily: 'var(--font-mono)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4), 0 0 60px -10px rgba(139,92,246,0.15)',
    }}>
        {/* Grid pattern */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundSize: '24px 24px', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)' }} />

        <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '0.6rem', color: '#64748B', letterSpacing: '0.12em', textTransform: 'uppercase' as const, fontWeight: 700, marginBottom: '1.5rem' }}>
                THREE-LAYER RAG FUNNEL
            </div>

            {/* Query input */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 0.75rem', borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: '1.5rem',
            }}>
                <span style={{ fontSize: '0.7rem' }}>🔍</span>
                <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Query: "useEffect 闭包陷阱的解决方案?"</span>
            </div>

            {/* Funnel layers */}
            <svg viewBox="0 0 240 180" width="100%" style={{ maxWidth: '100%' }}>
                <defs>
                    <linearGradient id="funnel1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id="funnel2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id="funnel3" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
                    </linearGradient>
                </defs>

                {/* Layer 1: Summary — widest */}
                <polygon points="10,5 230,5 210,55 30,55" fill="url(#funnel1)" stroke="#3B82F6" strokeWidth="0.5" strokeOpacity="0.3" />
                <text x="120" y="25" textAnchor="middle" fill="#60A5FA" fontSize="7" fontWeight="700" fontFamily="var(--font-mono)">摘要层 · SUMMARY</text>
                <text x="120" y="37" textAnchor="middle" fill="#3B82F6" fontSize="12" fontWeight="800" fontFamily="var(--font-mono)">~80%</text>
                <text x="120" y="48" textAnchor="middle" fill="#475569" fontSize="5.5" fontFamily="var(--font-mono)">概念性问答直接回答 · 极低 Token</text>

                {/* Layer 2: Vector — medium */}
                <polygon points="30,60 210,60 185,110 55,110" fill="url(#funnel2)" stroke="#8B5CF6" strokeWidth="0.5" strokeOpacity="0.3" />
                <text x="120" y="80" textAnchor="middle" fill="#A78BFA" fontSize="7" fontWeight="700" fontFamily="var(--font-mono)">向量层 · VECTOR</text>
                <text x="120" y="92" textAnchor="middle" fill="#8B5CF6" fontSize="12" fontWeight="800" fontFamily="var(--font-mono)">~15%</text>
                <text x="120" y="103" textAnchor="middle" fill="#475569" fontSize="5.5" fontFamily="var(--font-mono)">768维语义匹配 · Top-K 精确检索</text>

                {/* Layer 3: Raw — narrowest */}
                <polygon points="55,115 185,115 160,165 80,165" fill="url(#funnel3)" stroke="#10B981" strokeWidth="0.5" strokeOpacity="0.3" />
                <text x="120" y="135" textAnchor="middle" fill="#34D399" fontSize="7" fontWeight="700" fontFamily="var(--font-mono)">原文层 · RAW TEXT</text>
                <text x="120" y="147" textAnchor="middle" fill="#10B981" fontSize="12" fontWeight="800" fontFamily="var(--font-mono)">~5%</text>
                <text x="120" y="158" textAnchor="middle" fill="#475569" fontSize="5.5" fontFamily="var(--font-mono)">完整段落回溯 · 精确引证</text>

                {/* Flow arrows between layers */}
                <line x1="120" y1="56" x2="120" y2="59" stroke="#60A5FA" strokeWidth="1" strokeDasharray="2,2" opacity="0.4" />
                <line x1="120" y1="111" x2="120" y2="114" stroke="#A78BFA" strokeWidth="1" strokeDasharray="2,2" opacity="0.4" />
            </svg>

            {/* Result footer */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem',
                padding: '0.5rem 0.75rem', borderRadius: '8px',
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
            }}>
                <span style={{ fontSize: '0.7rem' }}>✅</span>
                <span style={{ fontSize: '0.6rem', color: '#34D399' }}>命中：向量层 4 条 · Token 消耗降低 87%</span>
            </div>
        </div>
    </div>
);

const RAGSection: React.FC = () => {
    return (
        <section className="section" id="rag" style={{ position: 'relative' }}>
            {/* Background glow */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)', width: '60%', height: '60%',
                background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 60%)',
                filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
            }} />

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                    <span className="section-label">🔍 智能检索</span>
                    <h2 className="section-title">知识库 RAG 三层漏斗体系</h2>
                    <p className="section-subtitle">
                        核心思想：<strong style={{ color: 'var(--text-primary)' }}>不要让大模型每次都读全文</strong>。
                        构建"摘要 – 向量 – 原文"三层数据漏斗，将 Token 消耗降低一个数量级。
                    </p>
                </div>

                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr',
                    gap: '4rem', alignItems: 'center',
                    maxWidth: '1100px', margin: '0 auto',
                }}>
                    {/* Funnel + Layer cards */}
                    <div className="grid-2" style={{ gap: '3rem', alignItems: 'center' }}>
                        {/* Custom funnel diagram */}
                        <div style={{ position: 'relative' }}>
                            <FunnelVisualization />
                            <div style={{
                                position: 'absolute', top: '40%', left: '50%', width: '80%', height: '80%',
                                background: 'var(--brand-purple)', opacity: 0.12,
                                transform: 'translate(-50%, -50%)', filter: 'blur(80px)', zIndex: -1, borderRadius: '50%',
                            }} />
                        </div>

                        {/* Layer cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {layers.map((layer, i) => (
                                <div
                                    key={i}
                                    className="glass-card"
                                    style={{
                                        padding: '1.75rem 2rem',
                                        borderLeft: `4px solid ${layer.color}`,
                                        display: 'flex',
                                        gap: '1.25rem',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <div style={{ fontSize: '1.75rem', lineHeight: 1, flexShrink: 0, marginTop: '0.1rem' }}>
                                        {layer.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            marginBottom: '0.5rem', flexWrap: 'wrap',
                                        }}>
                                            <h3 style={{ fontSize: '1.2rem', color: layer.color, margin: 0 }}>
                                                {layer.name}
                                            </h3>
                                            <span style={{
                                                fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
                                                color: 'var(--text-faint)', fontWeight: 500,
                                            }}>
                                                {layer.nameEn}
                                            </span>
                                            <span style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                                <span style={{
                                                    fontSize: '0.7rem', fontWeight: 700,
                                                    padding: '0.15rem 0.6rem', borderRadius: 'var(--radius-full)',
                                                    background: `${layer.color}12`, color: layer.color,
                                                    fontFamily: 'var(--font-mono)',
                                                }}>
                                                    覆盖 {layer.coverage}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.7rem', fontWeight: 600,
                                                    padding: '0.15rem 0.6rem', borderRadius: 'var(--radius-full)',
                                                    background: 'var(--surface-dim)', color: 'var(--text-faint)',
                                                    fontFamily: 'var(--font-mono)',
                                                }}>
                                                    Token: {layer.tokenCost}
                                                </span>
                                            </span>
                                        </div>
                                        <p style={{
                                            color: 'var(--text-muted)', fontSize: '0.92rem',
                                            lineHeight: 1.75, margin: 0, marginBottom: '0.5rem',
                                        }}>
                                            {layer.desc}
                                        </p>
                                        <div style={{
                                            fontSize: '0.78rem', fontFamily: 'var(--font-mono)',
                                            color: 'var(--text-faint)', fontWeight: 500,
                                        }}>
                                            {layer.details}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Query flow diagram */}
                    <div className="glass-card-static" style={{ padding: '2rem', background: 'var(--surface)' }}>
                        <div style={{
                            fontSize: '0.75rem', fontFamily: 'var(--font-mono)',
                            color: 'var(--text-faint)', fontWeight: 600,
                            textTransform: 'uppercase' as const, letterSpacing: '0.08em',
                            marginBottom: '1.25rem',
                        }}>
                            问答检索三级策略 · Query Flow
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            flexWrap: 'wrap', justifyContent: 'center',
                        }}>
                            {[
                                { label: '用户提问', icon: '🙋', color: 'var(--text-primary)' },
                                { label: '→' },
                                { label: '检索摘要层', icon: '📋', color: 'var(--brand-blue)' },
                                { label: '→' },
                                { label: '能回答？', icon: '✅', color: 'var(--brand-emerald)' },
                                { label: '/ 不够 →' },
                                { label: '深入向量层', icon: '🧬', color: 'var(--brand-purple)' },
                                { label: '→' },
                                { label: '精确回答', icon: '✅', color: 'var(--brand-emerald)' },
                                { label: '/ 极少 →' },
                                { label: '定位原文', icon: '📖', color: 'var(--brand-cyan)' },
                            ].map((item, i) => (
                                item.icon ? (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)',
                                        background: `${item.color}08`, border: `1px solid ${item.color}15`,
                                        fontSize: '0.82rem', fontWeight: 600, color: item.color,
                                    }}>
                                        <span>{item.icon}</span><span>{item.label}</span>
                                    </div>
                                ) : (
                                    <span key={i} style={{ color: 'var(--text-faint)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                                        {item.label}
                                    </span>
                                )
                            ))}
                        </div>
                    </div>

                    {/* Supported formats */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {[
                            { format: 'Word', icon: '📄' },
                            { format: 'PDF', icon: '📕' },
                            { format: 'Markdown', icon: '📝' },
                            { format: 'TXT', icon: '📃' },
                            { format: '图片', icon: '🖼️' },
                        ].map((f, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
                                background: 'var(--surface-glass)', border: '1px solid var(--border-color)',
                                fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500,
                            }}>
                                <span>{f.icon}</span>{f.format}
                            </div>
                        ))}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.5rem 1rem', fontSize: '0.82rem', color: 'var(--text-faint)',
                        }}>
                            支持上传格式
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default RAGSection;
