import React from 'react';

const techStack = [
    {
        category: '前端技术',
        icon: '🎨',
        color: 'var(--brand-blue)',
        items: [
            { name: 'Next.js 16.1', desc: 'App Router · SSR/SSG/ISR · Turbopack' },
            { name: 'React 19.2', desc: '最新并发特性 · Server Components' },
            { name: '@xyflow/react 12.x', desc: '工作流可视化画布 · 拖拽连线缩放' },
            { name: 'Shadcn/UI + Tailwind v4', desc: 'OKLCH 色彩空间 · CSS-first' },
            { name: 'Zustand 5.x', desc: '状态管理 · 配合 localforage 离线缓存' },
        ]
    },
    {
        category: '后端技术',
        icon: '⚙️',
        color: 'var(--brand-purple)',
        items: [
            { name: 'FastAPI (Python 3.11+)', desc: 'ASGI 异步 · Pydantic V2 自动验证' },
            { name: 'Supabase Pro', desc: 'PostgreSQL + RLS + pgvector + Auth' },
            { name: 'SSE + WebSocket', desc: '流式推送 · 实时状态同步' },
            { name: 'Gunicorn + Uvicorn', desc: '多 Worker ASGI 服务' },
        ]
    },
    {
        category: 'AI 引擎',
        icon: '🧠',
        color: 'var(--brand-cyan)',
        items: [
            { name: '火山引擎 doubao-2.0-pro', desc: '简单任务 · 200W Token/日免费池' },
            { name: '阿里云百炼 qwen3-turbo', desc: '复杂推理 · 高质量长文生成' },
            { name: 'OpenAI SDK 统一调用', desc: '两家均兼容 · 零适配成本' },
            { name: '容灾降级', desc: 'timeout/rate limit → 自动切换' },
        ]
    },
    {
        category: '基础设施',
        icon: '🏗️',
        color: 'var(--brand-emerald)',
        items: [
            { name: '阿里云 ECS 2核4G', desc: '宝塔面板 · 完全控制 · 无冷启动' },
            { name: 'Nginx 反向代理', desc: '静态资源 · SSL · 限流防护' },
            { name: 'PM2 进程管理', desc: '前端常驻 · 自动重启' },
            { name: 'Let\'s Encrypt SSL', desc: 'HTTPS · 自动证书续期' },
        ]
    },
];

const securityLayers = [
    { layer: '第1层', name: '阿里云安全组', desc: '仅开放 80/443/22', icon: '🔒', color: 'var(--brand-blue)' },
    { layer: '第2层', name: 'Nginx WAF', desc: '防 CC · SQL 注入 · XSS', icon: '🛡️', color: 'var(--brand-purple)' },
    { layer: '第3层', name: 'Nginx 限流', desc: 'API: 10r/s · AI: 2r/s', icon: '⚡', color: 'var(--brand-cyan)' },
    { layer: '第4层', name: '应用层防护', desc: 'JWT · Pydantic · CORS · Prompt安全', icon: '🔐', color: 'var(--brand-emerald)' },
];

const Architecture: React.FC = () => {
    return (
        <section className="section" id="architecture">
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                    <span className="section-label">🏛️ 技术架构</span>
                    <h2 className="section-title">企业级技术底座</h2>
                    <p className="section-subtitle">
                        前后端分离架构，独立管理、故障隔离、后端端口不暴露。AI 生态最佳实践 + 生产级安全防护。
                    </p>
                </div>

                {/* Architecture diagram */}
                <div className="glass-card-static" style={{
                    padding: '2.5rem',
                    marginBottom: '4rem',
                    maxWidth: '900px',
                    margin: '0 auto 4rem auto',
                    background: 'var(--surface)',
                }}>
                    <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.82rem',
                        lineHeight: 2,
                        color: 'var(--text-secondary)',
                    }}>
                        <pre style={{
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            overflowX: 'auto',
                        }}>
                            {`用户浏览器
    │
    ▼
阿里云 ECS（2核4G · 宝塔面板）
    │
    ├── Nginx 反向代理（SSL · WAF · 限流）
    │     ├── /         → Next.js 前端  (PM2 · port 3377)
    │     └── /api/     → FastAPI 后端  (Gunicorn · port 2038)
    │
    └── 外部服务
          ├── Supabase Pro（PostgreSQL + Auth + pgvector + RLS）
          ├── 🔥 火山引擎 doubao-2.0-pro（简单任务 · 免费池）
          └── ☁️ 阿里云百炼 qwen3-turbo（复杂推理）`}
                        </pre>
                    </div>
                </div>

                {/* Tech stack grid */}
                <div className="grid-2" style={{ gap: '2rem', marginBottom: '4rem' }}>
                    {techStack.map((category, i) => (
                        <div key={i} className="glass-card" style={{ padding: '2rem' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '1.5rem',
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>{category.icon}</span>
                                <h3 style={{
                                    fontSize: '1.2rem',
                                    color: category.color,
                                    margin: 0,
                                }}>
                                    {category.category}
                                </h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {category.items.map((item, j) => (
                                    <div key={j} style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.75rem',
                                        padding: '0.6rem 0',
                                        borderBottom: j < category.items.length - 1 ? '1px solid var(--border-color)' : 'none',
                                    }}>
                                        <span style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            background: category.color,
                                            marginTop: '0.45rem',
                                            flexShrink: 0,
                                            opacity: 0.6,
                                        }} />
                                        <div>
                                            <div style={{
                                                fontWeight: 600,
                                                fontSize: '0.92rem',
                                                color: 'var(--text-primary)',
                                                marginBottom: '0.15rem',
                                            }}>
                                                {item.name}
                                            </div>
                                            <div style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--text-faint)',
                                            }}>
                                                {item.desc}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Security layers */}
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <h3 style={{
                        textAlign: 'center',
                        marginBottom: '2rem',
                        fontSize: '1.3rem',
                    }}>
                        🛡️ 四层纵深防御体系
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '1rem',
                    }}>
                        {securityLayers.map((layer, i) => (
                            <div key={i} className="glass-card" style={{
                                padding: '1.25rem 1.5rem',
                                textAlign: 'center',
                            }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{layer.icon}</div>
                                <div style={{
                                    fontSize: '0.7rem',
                                    fontFamily: 'var(--font-mono)',
                                    color: layer.color,
                                    fontWeight: 700,
                                    marginBottom: '0.25rem',
                                    letterSpacing: '0.05em',
                                }}>
                                    {layer.layer}
                                </div>
                                <div style={{
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    color: 'var(--text-primary)',
                                    marginBottom: '0.35rem',
                                }}>
                                    {layer.name}
                                </div>
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-muted)',
                                }}>
                                    {layer.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Architecture;
