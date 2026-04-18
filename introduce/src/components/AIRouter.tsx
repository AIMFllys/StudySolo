import { useEffect, useState } from 'react';
import { useInView } from '../hooks/useInView';
import {
  Banknote,
  Bean,
  BrainCircuit,
  Cloud,
  Flame,
  Gem,
  Lock,
  Moon,
  RefreshCcw,
  Target,
  TimerOff,
  TrendingDown,
  Waves,
  Zap,
} from 'lucide-react';

const MD = '\u00b7';
const ND = '\u2013';
const TIMES = '\u00d7';
const ARROW_DN = '\u2193';

const AI_PLATFORMS = [
  { name: 'DeepSeek', models: 'V3 / R1', icon: BrainCircuit, mode: '\u63a8\u7406 + \u901a\u7528', color: '#1a6bd0', usage: '\u4ee3\u7801 / \u6570\u5b66\u8bc1\u660e' },
  { name: '\u901a\u4e49\u5343\u95ee', models: 'Turbo / Plus / Max', icon: Waves, mode: '\u957f\u6587 + \u5de5\u5177', color: '#6c47ff', usage: '\u89c4\u5212 / \u4e2d\u6587\u573a\u666f' },
  { name: '\u667a\u8c31 GLM', models: 'GLM-4.5 / Flash', icon: Zap, mode: '\u89c6\u89c9 + \u5bf9\u8bdd', color: '#1976d2', usage: 'OCR / \u6587\u6863 / \u590d\u6742\u6307\u4ee4' },
  { name: 'Kimi', models: '8K / 128K / K2.5', icon: Moon, mode: '\u957f\u6587 + \u6458\u8981', color: '#7c3aed', usage: '\u8bba\u6587 / \u8bfe\u4ef6\u7cbe\u8bfb' },
  { name: '\u96f6\u4e00\u4e07\u7269 Yi', models: 'Pro-32K / 256K', icon: Bean, mode: '\u957f\u6587 + \u751f\u6210', color: '#059669', usage: '\u5927\u7eb2 / \u521b\u610f\u5199\u4f5c' },
  { name: '\u817e\u8baf\u6df7\u5143', models: '\u6807\u51c6 / Turbo', icon: Cloud, mode: '\u901a\u7528\u5bf9\u8bdd', color: '#d97706', usage: '\u591a\u8f6e / \u89d2\u8272\u626e\u6f14' },
  { name: '\u901a\u4e49\u5f00\u6e90', models: 'Qwen2.5-72B', icon: Gem, mode: '\u672c\u5730\u63a8\u7406', color: '#0891b2', usage: '\u79c1\u6709\u5316\u90e8\u7f72' },
  { name: '\u8c46\u5305', models: 'Doubao \u591a\u6a21\u6001', icon: Flame, mode: '\u5b9e\u65f6\u5bf9\u8bdd', color: '#dc2626', usage: '\u8bed\u97f3 / \u56fe\u50cf\u7406\u89e3' },
];

const ROUTING_STRATEGIES = [
  {
    id: 'native_first',
    name: 'native_first',
    title: '\u5b98\u65b9\u901a\u9053\u4f18\u5148',
    desc: '\u76f4\u8fde\u5382\u5546 API\uff0c\u8df3\u8f6c\u6700\u5c11\u3001\u5ef6\u8fdf\u66f4\u4f4e\uff0c\u9002\u5408\u7a33\u5b9a\u7f51\u7edc\u4e0e\u81ea\u6709\u5bc6\u94a5\u573a\u666f\u3002',
    icon: Target,
    color: 'var(--accent-blue)',
  },
  {
    id: 'proxy_first',
    name: 'proxy_first',
    title: '\u4e2d\u8f6c\u901a\u9053\u4f18\u5148',
    desc: '\u7edf\u4e00\u8ba1\u8d39\u4e0e\u5bc6\u94a5\u6258\u7ba1\uff0c\u4fbf\u4e8e\u9884\u7b97\u3001\u914d\u989d\u4e0e\u7528\u91cf\u5ba1\u8ba1\uff0c\u9002\u5408\u56e2\u961f\u8d26\u53f7\u3002',
    icon: Banknote,
    color: 'var(--accent-green)',
  },
  {
    id: 'capability_fixed',
    name: 'capability_fixed',
    title: '\u80fd\u529b\u4f4d\u56fa\u5b9a',
    desc: '\u6309\u4efb\u52a1\u7ed1\u5b9a\u80fd\u529b\u4f4d\uff1a\u5982 OCR \u56fa\u5b9a\u8d70 GLM\u3001\u8d85\u957f\u4e0a\u4e0b\u6587\u56fa\u5b9a\u8d70 Kimi\u3002',
    icon: Lock,
    color: 'var(--accent-purple)',
  },
];

const FAILOVER_ITEMS = [
  { icon: RefreshCcw, title: '\u81ea\u52a8\u91cd\u8bd5\u4e0e\u5207\u6362', desc: '\u4e3b\u7ebf\u8def\u5f02\u5e38\u65f6\u5728\u6570\u79d2\u5185\u5207\u5230\u5907\u7528 SKU\uff0c\u964d\u4f4e\u8282\u70b9\u5931\u8d25\u7387\u3002', value: `2${ND}3 \u79d2 / \u6b21`, color: 'var(--accent-blue)' },
  { icon: TimerOff, title: '\u8017\u65f6\u9884\u7b97', desc: '\u5355\u6b21\u8def\u7531\u51b3\u7b56\u8bbe\u6709\u8d85\u65f6\u4e0a\u9650\uff0c\u907f\u514d\u957f\u5c3e\u963b\u585e\u6574\u6761 DAG\u3002', value: '< 8s \u51b3\u7b56', color: 'var(--accent-rose)' },
  { icon: TrendingDown, title: '\u6210\u672c\u4f18\u5316', desc: '\u6309\u4e0a\u4e0b\u6587\u957f\u5ea6\u4e0e\u4efb\u52a1\u7c7b\u578b\u9009\u62e9\u89c4\u683c\uff0c\u9ad8\u9891\u573a\u666f\u53ef\u663e\u8457\u8282\u7ea6 Token\u3002', value: `\u7ea6 10${TIMES} \u8282\u7ea6`, color: 'var(--accent-green)' },
];

export default function AIRouter() {
  const [ref, inView] = useInView<HTMLDivElement>(0.15);
  const [activeStrategy, setActiveStrategy] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timer = window.setInterval(() => {
      setActiveStrategy((prev) => (prev + 1) % ROUTING_STRATEGIES.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [inView]);

  return (
    <section id="ai-router" className="grid-bg" style={{ padding: '40px 0 80px', position: 'relative' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        <div className="reveal" style={{ marginBottom: 64, textAlign: 'center' }}>
          <span className="label label-blue" style={{ marginBottom: 20, display: 'inline-flex' }}>
            {`AI MODEL ROUTER ${MD} 8 PLATFORMS`}
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(36px, 5vw, 56px)', color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 24 }}>
            {'8 \u5927\u6a21\u578b\u5e73\u53f0'}
            <br />
            <span className="marker-highlight" style={{ fontSize: 'clamp(32px, 4.5vw, 48px)' }}>
              {`\u667a\u80fd\u8def\u7531 ${MD} \u6210\u672c\u53ef\u63a7`}
            </span>
          </h2>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 680, margin: '0 auto', lineHeight: 1.6 }}>
            {'AI Router \u4f9d\u636e\u4efb\u52a1\u7c7b\u578b\u3001\u4e0a\u4e0b\u6587\u957f\u5ea6\u4e0e\u9884\u7b97\uff0c\u5728 8 \u5927\u5e73\u53f0\u95f4\u81ea\u52a8\u9009\u62e9\u8def\u5f84\uff0c\u5e76\u652f\u6301\u6545\u969c\u8f6c\u79fb\u4e0e\u914d\u989d\u7ba1\u7406\u3002'}
          </p>
        </div>

        <div ref={ref} style={{ background: '#ffffff', borderRadius: 24, border: '1px solid var(--border-subtle)', padding: 40, marginBottom: 32, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.7s var(--ease-standard), transform 0.7s var(--ease-standard)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'inline-block', background: 'var(--bg-canvas)', borderRadius: 16, border: '2px solid var(--accent-blue)', padding: '12px 32px', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 10 }}>
              {`Layer 2 ${MD} DAG \u6267\u884c\u5668 ${MD} 18 \u7c7b\u8282\u70b9`}
            </div>
            <div style={{ fontSize: 24, color: 'var(--text-dim)', marginBottom: 10 }} aria-hidden>{ARROW_DN}</div>
            <div style={{ display: 'inline-block', background: '#fff7ed', borderRadius: 16, border: '2px solid var(--accent-amber)', padding: '12px 32px', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--accent-amber)' }}>
              {`Layer 3 ${MD} AI Router ${MD} \u667a\u80fd\u9009\u578b`}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
            {ROUTING_STRATEGIES.map((strategy, index) => {
              const StrategyIcon = strategy.icon;
              const active = index === activeStrategy && inView;
              return (
                <div
                  key={strategy.id}
                  style={{
                    background: active ? `${strategy.color}15` : 'var(--bg-canvas)',
                    borderRadius: 16,
                    border: `1px solid ${active ? strategy.color : `${strategy.color}30`}`,
                    padding: 20,
                    textAlign: 'center',
                    transform: active ? 'translateY(-3px)' : 'translateY(0)',
                    boxShadow: active ? `0 10px 18px ${strategy.color}25` : 'none',
                    transition: 'all var(--dur-base) var(--ease-standard)',
                  }}
                >
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                    <StrategyIcon size={32} color={strategy.color} strokeWidth={1.5} className={active ? 'flow-pulse' : ''} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: strategy.color, letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>
                    {strategy.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--text-primary)' }}>
                    {strategy.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {strategy.desc}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 24, textAlign: 'center', color: 'var(--text-dim)', marginBottom: 24 }} aria-hidden>{ARROW_DN}</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {AI_PLATFORMS.map((platform, i) => {
              const PlatformIcon = platform.icon;
              const highlighted = inView && i % ROUTING_STRATEGIES.length === activeStrategy;
              return (
                <div
                  key={platform.name}
                  style={{
                    background: `${platform.color}08`,
                    borderRadius: 16,
                    border: `1px solid ${highlighted ? platform.color : `${platform.color}25`}`,
                    padding: '16px 20px',
                    opacity: inView ? 1 : 0,
                    transform: inView ? 'translateY(0)' : 'translateY(12px)',
                    boxShadow: highlighted ? `0 8px 20px ${platform.color}20` : 'none',
                    transition: `opacity 0.4s ease ${i * 0.05}s, transform 0.4s ease ${i * 0.05}s, box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)`,
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <PlatformIcon size={24} color={platform.color} strokeWidth={2} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {platform.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: platform.color, marginBottom: 8, letterSpacing: '0.03em' }}>
                    {platform.models}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {platform.usage}
                  </div>
                  <div style={{ marginTop: 8, display: 'inline-block', padding: '3px 8px', borderRadius: 999, background: `${platform.color}15`, fontFamily: 'var(--font-mono)', fontSize: 10, color: platform.color, fontWeight: 600 }}>
                    {platform.mode}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {FAILOVER_ITEMS.map((item) => {
            const InfoIcon = item.icon;
            return (
              <div key={item.title} style={{ background: '#ffffff', borderRadius: 20, border: '1px solid var(--border-subtle)', padding: 28, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                <div style={{ marginBottom: 16 }}>
                  <InfoIcon size={32} color={item.color} strokeWidth={1.5} />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 8, letterSpacing: '0.05em' }}>{item.value}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 8 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {item.desc}
                </div>
              </div>
            );
          })}
        </div>

        <style>{`
          @media (max-width: 1100px) {
            #ai-router > div > div:nth-child(2) > div:last-child {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (max-width: 768px) {
            #ai-router > div > div:nth-child(2) > div:nth-child(3),
            #ai-router > div > div:nth-child(3) {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </section>
  );
}
