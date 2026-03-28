import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer style={{
            borderTop: '1px solid var(--border-color)',
            padding: '5rem 0 2rem 0',
            background: 'var(--surface-glass)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            position: 'relative',
        }}>
            {/* Subtle top gradient */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent 10%, var(--brand-blue), var(--brand-purple), transparent 90%)',
                opacity: 0.3,
            }} />

            <div className="container">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '3rem',
                    marginBottom: '4rem',
                }}>
                    {/* Brand */}
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            marginBottom: '1.25rem',
                        }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--gradient-brand)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                </svg>
                            </div>
                            <span style={{
                                fontSize: '1.25rem',
                                fontWeight: 800,
                                letterSpacing: '-0.02em',
                                color: 'var(--text-primary)',
                            }}>
                                Study<span className="text-gradient">Solo</span>
                            </span>
                        </div>
                        <p style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.9rem',
                            lineHeight: 1.8,
                            maxWidth: '280px',
                            margin: 0,
                        }}>
                            基于自然语言的 AI 学习赋能工作流平台。
                            一句话，生成一个结构化的学习闭环。
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            marginBottom: '1.25rem',
                            textTransform: 'uppercase' as const,
                            letterSpacing: '0.06em',
                        }}>
                            产品
                        </h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[
                                { label: '核心功能', href: '#features' },
                                { label: '工作流演示', href: '#workflow' },
                                { label: 'RAG 检索体系', href: '#rag' },
                                { label: '价格方案', href: '#pricing' },
                            ].map((link, i) => (
                                <li key={i}>
                                    <a href={link.href} style={{
                                        color: 'var(--text-muted)',
                                        fontSize: '0.9rem',
                                        transition: 'color var(--duration-fast) var(--ease-out)',
                                    }}>
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            marginBottom: '1.25rem',
                            textTransform: 'uppercase' as const,
                            letterSpacing: '0.06em',
                        }}>
                            快速链接
                        </h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <li><a href="https://1037Solo.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>1037Solo 官网</a></li>
                            <li><a href="https://docs.1037solo.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>平台使用指南</a></li>
                            <li><a href="https://studyflow.1037solo.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>工作流平台 (开发中)</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            marginBottom: '1.25rem',
                            textTransform: 'uppercase' as const,
                            letterSpacing: '0.06em',
                        }}>
                            联系与支持
                        </h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <li>
                                <a href="mailto:feedback@1037solo.com" style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                }}>
                                    <span style={{ fontSize: '0.95rem' }}>✉️</span>
                                    feedback@1037solo.com
                                </a>
                            </li>
                            <li style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                周一至周五 9:00 - 18:00
                            </li>
                            <li style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Pro 以上用户享有工单支持
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div style={{
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    fontSize: '0.82rem',
                    color: 'var(--text-faint)',
                }}>
                    <div>
                        © {new Date().getFullYear()} @1037Solo团队 · 保留所有权利
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span>
                            Powered by React 19 + FastAPI + Supabase
                        </span>
                        <a
                            href="https://beian.miit.gov.cn/"
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--text-faint)', fontSize: '0.82rem' }}
                        >
                            黑ICP备2025046407号-3
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
