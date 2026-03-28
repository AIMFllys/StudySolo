import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const steps = [
    {
        number: '01',
        icon: '💬',
        title: '自然语言输入',
        subtitle: 'Natural Language Input',
        desc: '用一句话描述学习目标，例如"系统性学习 React Hooks 的核心原理"。AI 需求分析器（doubao-2.0-pro）自动提炼意图、结构化需求 JSON。',
        color: 'var(--brand-blue)',
        gradient: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.03))',
    },
    {
        number: '02',
        icon: '🧩',
        title: 'AI 自动拆解节点',
        subtitle: 'Workflow Generation',
        desc: '工作流规划器（qwen3-turbo）从预设节点池中智能编排 3-8 个结构化步骤：大纲生成、知识提炼、重点总结、闪卡生成…自动构建完整的学习工作流。',
        color: 'var(--brand-purple)',
        gradient: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.03))',
    },
    {
        number: '03',
        icon: '⚡',
        title: '逐节点流式执行',
        subtitle: 'SSE Streaming Execution',
        desc: '引擎按拓扑排序遍历节点，逐节点调用 AI 并通过 SSE 逐 token 流式推送至画布。每个节点像呼吸灯一样报告进度，Markdown 实时渲染让你看到 AI 思考的全过程。',
        color: 'var(--brand-cyan)',
        gradient: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(6,182,212,0.03))',
    },
    {
        number: '04',
        icon: '📦',
        title: '聚合导出 · 记忆归档',
        subtitle: 'Reduce & Export',
        desc: 'Reduce 节点将分拆的内容汇总润色，消除冗余、统一风格。最终一键导出为排版精美的 PDF / DOCX，同时归档到知识库，支持向量语义检索随时复用。',
        color: 'var(--brand-emerald)',
        gradient: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.03))',
    },
];

/* Animated step card */
const StepCard: React.FC<{ step: typeof steps[0]; index: number }> = ({ step, index: i }) => {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.15 });
    const isEven = i % 2 === 0;

    return (
        <div
            ref={ref}
            style={{
                display: 'flex',
                justifyContent: isEven ? 'flex-start' : 'flex-end',
                width: '100%',
                position: 'relative',
            }}
        >
            {/* Center Connector Dot */}
            <div className="hide-mobile" style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: step.gradient,
                border: `4px solid var(--surface)`,
                boxShadow: `0 0 0 2px ${step.color}50, 0 0 15px ${step.color}`,
                zIndex: 2,
                opacity: isVisible ? 1 : 0,
                transition: `opacity 0.5s ease ${i * 150 + 200}ms`,
            }} />

            <div
                className="glass-card"
                style={{
                    width: 'calc(50% - 3rem)',
                    padding: '2.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    borderLeft: isEven ? `4px solid ${step.color}` : '1px solid var(--border-color)',
                    borderRight: !isEven ? `4px solid ${step.color}` : '1px solid var(--border-color)',
                    position: 'relative',
                    overflow: 'visible',
                    /* Scroll reveal animation */
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible
                        ? 'translateX(0) translateY(0)'
                        : `translateX(${isEven ? '-60px' : '60px'}) translateY(20px)`,
                    transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${i * 150}ms, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${i * 150}ms`,
                }}
            >
                {/* Small arrow pointing to center line */}
                <div className="hide-mobile" style={{
                    position: 'absolute',
                    top: '50%',
                    [isEven ? 'right' : 'left']: '-1rem',
                    transform: 'translateY(-50%)',
                    width: '1rem',
                    height: '2px',
                    background: `${step.color}40`,
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Step number / Icon */}
                    <div style={{
                        minWidth: '70px',
                        height: '70px',
                        borderRadius: 'var(--radius-xl)',
                        background: step.gradient,
                        border: `1px solid ${step.color}30`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: `inset 0 0 20px ${step.color}10, 0 8px 16px ${step.color}15`,
                    }}>
                        <span style={{ fontSize: '1.8rem' }}>{step.icon}</span>
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '0.5rem',
                        }}>
                            <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                color: step.color,
                                fontFamily: 'var(--font-mono)',
                                padding: '0.2rem 0.6rem',
                                borderRadius: 'var(--radius-sm)',
                                background: `${step.color}15`,
                                letterSpacing: '0.08em',
                            }}>
                                STEP {step.number}
                            </span>
                            <span style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-faint)',
                                fontWeight: 600,
                            }}>
                                {step.subtitle}
                            </span>
                        </div>
                        <h3 style={{
                            fontSize: '1.4rem',
                            margin: 0,
                            color: 'var(--text-primary)',
                        }}>
                            {step.title}
                        </h3>
                    </div>
                </div>

                <p style={{
                    color: 'var(--text-muted)',
                    lineHeight: 1.85,
                    fontSize: '1.05rem',
                    margin: 0,
                }}>
                    {step.desc}
                </p>
            </div>
        </div>
    );
};

const HowItWorks: React.FC = () => {
    const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();

    return (
        <section className="section" id="how-it-works">
            <div className="container">
                <div ref={headerRef} style={{
                    textAlign: 'center', marginBottom: '5rem',
                    opacity: headerVisible ? 1 : 0,
                    transform: headerVisible ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                    <span className="section-label">⚙️ 运作方式</span>
                    <h2 className="section-title">四步生成完整学习工作流</h2>
                    <p className="section-subtitle">
                        从一句话到一份完整的学习产出物，StudySolo 用两段式 AI 和可视化工作流将整个过程串联成闭环。
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4rem',
                    maxWidth: '1000px',
                    margin: '0 auto',
                    position: 'relative',
                    padding: '2rem 0',
                }}>
                    {/* Glowing Timeline connector for desktop */}
                    <div className="hide-mobile" style={{
                        position: 'absolute',
                        left: '50%',
                        top: '0',
                        bottom: '0',
                        width: '4px',
                        background: 'linear-gradient(to bottom, var(--brand-blue) 0%, var(--brand-purple) 30%, var(--brand-cyan) 60%, var(--brand-emerald) 100%)',
                        opacity: 0.15,
                        transform: 'translateX(-50%)',
                        borderRadius: '2px',
                    }} />

                    {/* Animated light traversing the timeline */}
                    <div className="hide-mobile" style={{
                        position: 'absolute',
                        left: '50%',
                        top: '0',
                        width: '4px',
                        height: '100px',
                        background: 'linear-gradient(to bottom, transparent, #fff, transparent)',
                        opacity: 0.6,
                        transform: 'translateX(-50%)',
                        animation: 'float 6s linear infinite',
                        borderRadius: '2px',
                        boxShadow: '0 0 15px 2px rgba(255,255,255,0.8)',
                    }} />

                    {steps.map((step, i) => (
                        <StepCard key={i} step={step} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;

