import { useInView } from '../hooks/useInView';

const PLANS = [
  {
    id: 'free',
    name: '免费体验',
    price: '¥0',
    period: '',
    desc: '轻量体验，感受平台能力',
    color: 'var(--text-secondary)',
    accent: 'transparent',
    features: [
      { text: '基础工作流编排执行', included: true },
      { text: '社区优质工作流浏览', included: true },
      '15 种标准执行节点',
      { text: '低优模型路由配额', included: true },
      { text: '高优 AI Router', included: false },
      { text: '复杂逻辑节点（switch/loop）', included: false },
      { text: '工作流共享发布', included: false },
    ],
    cta: '开始免费体验',
    ctaStyle: 'secondary',
  },
  {
    id: 'pro',
    name: 'Pro 认证版',
    price: '¥29',
    period: '/月',
    desc: '日常自动化学习场景首选',
    color: 'var(--accent-rose)',
    accent: 'var(--accent-rose)',
    highlight: true,
    features: [
      '全部 18 种执行节点类型',
      '高优 AI Router 调用权',
      '复杂逻辑节点（switch / loop）',
      '工作流共享与社区发布',
      '邮件 + 站内双通道进度通知',
      '历史执行记录查询',
      { text: '独立资源通道', included: false },
    ],
    cta: '升级 Pro →',
    ctaStyle: 'primary',
    badge: 'POPULAR',
  },
  {
    id: 'proplus',
    name: 'Pro+ 极客版',
    price: '¥79',
    period: '/月',
    desc: '高频场景 + 私有化部署',
    color: 'var(--accent-blue)',
    accent: 'transparent',
    features: [
      '不限量 Qwen-MAX 并发推导',
      '全量管理员数据后台',
      '独立私有资源通道',
      '使用量统计与审计日志',
      '工作流 A/B 测试实验场',
      '优先技术支持响应',
      '自定义模型端点接入',
    ],
    cta: '联系获取',
    ctaStyle: 'secondary',
  },
];

function FeatureItem({ feature, color }: { feature: string | { text: string; included: boolean }, color: string }) {
  const text = typeof feature === 'string' ? feature : feature.text;
  const included = typeof feature === 'string' ? true : feature.included;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ 
        color: included ? color : 'var(--border-subtle)', 
        flexShrink: 0, 
        fontFamily: 'var(--font-display)', 
        fontSize: 16,
        fontWeight: 800
      }}>
        {included ? '✓' : '×'}
      </span>
      <span style={{ fontSize: 14, color: included ? 'var(--text-secondary)' : 'var(--text-dim)', lineHeight: 1.4, textDecoration: included ? 'none' : 'line-through' }}>
        {text}
      </span>
    </div>
  );
}

export default function Pricing() {
  const [ref, inView] = useInView<HTMLDivElement>(0.15);

  return (
    <section id="pricing" ref={ref} style={{
      padding: '120px 0 160px',
      position: 'relative',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: 64, textAlign: 'center' }}>
          <span className="label label-blue" style={{ marginBottom: 20, display: 'inline-flex' }}>
            TRANSPARENT PRICING
          </span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(36px, 5vw, 56px)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 24,
          }}>
            透明定价，无隐藏费用
            <br />
            <span className="marker-highlight" style={{ fontSize: 'clamp(32px, 4.5vw, 48px)' }}>基于底层成本核算</span>
          </h2>
          <p style={{
            fontSize: 18,
            color: 'var(--text-secondary)',
            maxWidth: 600,
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            不卖黑盒服务。收益直接反哺算力采购，让高质量学习服务可持续运营。
          </p>
        </div>

        {/* Pricing Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 32,
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          {PLANS.map((plan) => (
            <div key={plan.id} style={{
              background: '#ffffff',
              borderRadius: 24,
              border: plan.highlight ? `2px solid ${plan.accent}` : '1px solid var(--border-subtle)',
              boxShadow: plan.highlight 
                ? '0 20px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)' 
                : '0 10px 15px -3px rgba(0,0,0,0.05)',
              padding: '48px 32px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              transform: plan.highlight ? 'scale(1.02)' : 'scale(1)',
              zIndex: plan.highlight ? 10 : 1,
            }}>
              {/* Soft background glow based on active item color */}
              {plan.highlight && (
                <div style={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  background: plan.accent,
                  opacity: 0.05,
                  filter: 'blur(50px)',
                  pointerEvents: 'none',
                }} />
              )}

              {/* Badge */}
              {plan.badge && (
                <div style={{
                  position: 'absolute',
                  top: -14,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: plan.color,
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  padding: '6px 16px',
                  borderRadius: 999,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}>
                  {plan.badge}
                </div>
              )}

              {/* Plan Header */}
              <div style={{ marginBottom: 32, textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  fontWeight: 700,
                  color: plan.color,
                  marginBottom: 16,
                }}>
                  {plan.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 16 }}>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 48,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span style={{ fontSize: 16, color: 'var(--text-secondary)' }}>{plan.period}</span>
                  )}
                </div>
                <div style={{ fontSize: 15, color: 'var(--text-secondary)' }}>{plan.desc}</div>
              </div>

              {/* Feature List */}
              <div style={{ flex: 1, marginBottom: 40 }}>
                {plan.features.map((f, i) => (
                  <FeatureItem key={i} feature={f} color={plan.highlight ? plan.color : 'var(--text-primary)'} />
                ))}
              </div>

              {/* CTA */}
              <button
                style={{ 
                  width: '100%', 
                  justifyContent: 'center', 
                  fontSize: 16, 
                  padding: '16px',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  background: plan.ctaStyle === 'primary' ? 'var(--text-primary)' : 'transparent',
                  color: plan.ctaStyle === 'primary' ? '#ffffff' : 'var(--text-primary)',
                  border: plan.ctaStyle === 'primary' ? 'none' : '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: plan.ctaStyle === 'primary' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (plan.ctaStyle === 'primary') {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                  } else {
                    e.currentTarget.style.background = 'var(--bg-surface)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (plan.ctaStyle === 'primary') {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                  } else {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div style={{ 
          marginTop: 48, 
          textAlign: 'center', 
          fontFamily: 'var(--font-mono)', 
          fontSize: 13, 
          color: 'var(--text-dim)',
          background: 'var(--bg-surface)',
          padding: '16px 24px',
          borderRadius: 999,
          display: 'inline-block',
          width: 'fit-content',
          margin: '48px auto 0',
          position: 'relative',
          left: '50%',
          transform: 'translateX(-50%)',
          border: '1px solid var(--border-subtle)'
        }}>
          所有方案均不含平台级 AI API 成本，实际调用按量计费。竞赛期间 Pro 版本对参赛学生免费开放。
        </div>

        {/* Responsive Adjustments */}
        <style>{`
          @media (max-width: 1024px) {
            #pricing > div > div:nth-child(2) {
              grid-template-columns: 1fr !important;
              max-width: 500px;
              margin: 0 auto;
            }
            #pricing > div > div:nth-child(2) > div {
              transform: none !important;
            }
          }
        `}</style>
      </div>
    </section>
  );
}
