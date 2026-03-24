/** Tier plan definitions — single source of truth for the upgrade page.
 *  Pricing sourced from: docs/Plans/daily_plan/user_auth/vip-01-membership-system-design.md §2.1
 */

export type TierId = 'free' | 'pro' | 'pro_plus' | 'ultra';
export type PaymentRegion = 'domestic' | 'overseas';
export type BillingCycle = 'monthly' | 'yearly';

/* ── Price helpers ── */
export interface PriceSet {
  cny: { monthly: number; yearly: number };
  usd: { monthly: number; yearly: number };
}

export function getPrice(ps: PriceSet, region: PaymentRegion, cycle: BillingCycle) {
  const cur = region === 'domestic' ? ps.cny : ps.usd;
  return cycle === 'yearly' ? cur.yearly : cur.monthly;
}

export function getCurrencySymbol(region: PaymentRegion) {
  return region === 'domestic' ? '¥' : '$';
}

/* ── Plan Features ── */
export interface PlanFeature {
  text: string;
  icon: 'slash' | 'check-square' | 'check-circle' | 'bolt';
  bold?: boolean;
  highlight?: boolean;
}

/* ── Tier Plan ── */
export interface TierPlan {
  id: TierId;
  slug: string;
  name: string;
  prices: PriceSet;
  tagline: string;
  badge?: { text: string; textOverseas?: string; variant: 'red' | 'blue' };
  cta: { text: string; variant: 'default' | 'outline-blue' | 'filled-blue' | 'outline-emerald' };
  features: PlanFeature[];
  highlighted?: boolean;
  accentColor: 'blue' | 'emerald';
  rotation: string;
}

export const TIER_PLANS: TierPlan[] = [
  {
    id: 'free',
    slug: '# Free_Tier',
    name: '免费版',
    prices: { cny: { monthly: 0, yearly: 0 }, usd: { monthly: 0, yearly: 0 } },
    tagline: '基础功能体验，开启 AI 之旅。',
    cta: { text: '当前计划', variant: 'default' },
    accentColor: 'blue',
    rotation: '-rotate-[0.5deg]',
    features: [
      { text: '1GB 云端存储', icon: 'slash' },
      { text: '10 个工作流', icon: 'slash' },
      { text: '每日执行上限 20 次', icon: 'slash' },
      { text: '2 并发执行', icon: 'slash' },
    ],
  },
  {
    id: 'pro',
    slug: '# Pro_Tier',
    name: 'Pro 版',
    // vip-01 §2.1: ¥25/月, ¥199/年, $7.99/月, $79/年
    prices: { cny: { monthly: 25, yearly: 199 }, usd: { monthly: 7.99, yearly: 79 } },
    tagline: '高性价比，适合个人深度使用。',
    badge: { text: '新人专享: ¥3 首月', textOverseas: 'New user: $1 first month', variant: 'red' },
    cta: { text: '立即订阅', variant: 'outline-blue' },
    accentColor: 'blue',
    rotation: 'rotate-[0.5deg]',
    features: [
      { text: '3GB 云端存储', icon: 'check-square' },
      { text: '50 个工作流', icon: 'check-square' },
      { text: '每日 50 次执行', icon: 'check-square' },
      { text: '5 并发执行 / 满血模型', icon: 'check-square' },
    ],
  },
  {
    id: 'pro_plus',
    slug: '# Pro_Plus_Tier',
    name: 'Pro+ 版',
    // vip-01 §2.1: ¥79/月, ¥599/年, $19.99/月, $199/年
    prices: { cny: { monthly: 79, yearly: 599 }, usd: { monthly: 19.99, yearly: 199 } },
    tagline: '专业生产力工具，解锁极致效率。',
    badge: { text: '最受欢迎', variant: 'blue' },
    highlighted: true,
    cta: { text: '立即订阅', variant: 'filled-blue' },
    accentColor: 'blue',
    rotation: '',
    features: [
      { text: '10GB 云端存储', icon: 'check-circle', bold: true },
      { text: '200 个工作流', icon: 'check-circle', bold: true },
      { text: '每日 150 次执行', icon: 'check-circle', bold: true },
      { text: '10 并发 / 优先执行权', icon: 'bolt', highlight: true },
    ],
  },
  {
    id: 'ultra',
    slug: '# Ultra_Tier',
    name: 'Ultra 版',
    // vip-01 §2.1: ¥1299/月, ¥9999/年, $129/月, $1299/年
    prices: { cny: { monthly: 1299, yearly: 9999 }, usd: { monthly: 129, yearly: 1299 } },
    tagline: '旗舰级性能，全方位专属服务。',
    cta: { text: '联系销售团队', variant: 'outline-emerald' },
    accentColor: 'emerald',
    rotation: '-rotate-[0.3deg]',
    features: [
      { text: '100GB 云端存储', icon: 'slash' },
      { text: '无限工作流', icon: 'slash' },
      { text: '每日 500 次执行', icon: 'slash' },
      { text: '全旗舰模型支持', icon: 'slash' },
    ],
  },
];

/* ── Add-on definitions (multi-tier) ──
 *  Pricing sourced from: vip-01 §4.1 加购价格矩阵
 */
export interface AddonTier {
  label: string;
  priceCny: number;
  priceUsd: number;
}

export interface AddonCategory {
  slug: string;
  title: string;
  tiers: AddonTier[];
}

export const ADDON_CATEGORIES: AddonCategory[] = [
  {
    slug: '# 存储空间',
    title: '存储空间',
    tiers: [
      // vip-01: +1GB ¥1/$0.5, +5GB ¥4.5/$2.3, +10GB ¥8.5/$4.5
      { label: '+1 GB', priceCny: 1, priceUsd: 0.5 },
      { label: '+5 GB', priceCny: 4.5, priceUsd: 2.3 },
      { label: '+10 GB', priceCny: 8.5, priceUsd: 4.5 },
    ],
  },
  {
    slug: '# 工作流数量',
    title: '工作流数量',
    tiers: [
      // vip-01: +5个 ¥3/$2, +10个 ¥5/$3.5, +20个 ¥9/$6
      { label: '+5 个', priceCny: 3, priceUsd: 2 },
      { label: '+10 个', priceCny: 5, priceUsd: 3.5 },
      { label: '+20 个', priceCny: 9, priceUsd: 6 },
    ],
  },
  {
    slug: '# 并发数量',
    title: '并发数量',
    tiers: [
      // vip-01: +1个 ¥5/$3, +3个 ¥13/$7.5, +5个 ¥20/$12
      { label: '+1 并发', priceCny: 5, priceUsd: 3 },
      { label: '+3 并发', priceCny: 13, priceUsd: 7.5 },
      { label: '+5 并发', priceCny: 20, priceUsd: 12 },
    ],
  },
];

/* ── Comparison table rows ── */
export interface ComparisonRow {
  label: string;
  free: string;
  pro: string;
  proPlus: string;
  ultra: string;
  isHeader?: boolean;
  headerLabel?: string;
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  { label: '', free: '', pro: '', proPlus: '', ultra: '', isHeader: true, headerLabel: '资源配额 / INFRASTRUCTURE' },
  { label: '云存储配额', free: '1 GB', pro: '3 GB', proPlus: '10 GB', ultra: '100 GB' },
  { label: '工作流数量上限', free: '10 个', pro: '50 个', proPlus: '200 个', ultra: '无限制' },
  { label: '', free: '', pro: '', proPlus: '', ultra: '', isHeader: true, headerLabel: '执行效能 / PERFORMANCE' },
  { label: '每日执行上限', free: '20 次', pro: '50 次', proPlus: '150 次', ultra: '500 次' },
  { label: '单次循环上限', free: '1 次', pro: '1 次', proPlus: '最多 3 次', ultra: '最多 10 次' },
  { label: '并发数', free: '2', pro: '5', proPlus: '10', ultra: '100' },
  { label: '', free: '', pro: '', proPlus: '', ultra: '', isHeader: true, headerLabel: 'AI 模型架构 / MODEL CAPABILITIES' },
  { label: '模型能力支持', free: '基础国内模型', pro: '满血模型', proPlus: '满血模型 + 优先通道', ultra: '全旗舰模型' },
  { label: '联网搜索', free: '仅权威来源', pro: '权威+论坛', proPlus: '权威+论坛+总结', ultra: '全部+深度分析' },
  { label: '知识库检索深度', free: '仅摘要层', pro: '摘要+向量层', proPlus: '摘要+向量+原文', ultra: '全量+缓存优化' },
  { label: '', free: '', pro: '', proPlus: '', ultra: '', isHeader: true, headerLabel: '其它服务 / EXTRA SERVICES' },
  { label: '客户支持', free: '社区', pro: '邮件(24h)', proPlus: '优先邮件(12h)', ultra: '专属客户经理+SLA' },
  { label: '新功能抢先体验', free: '❌', pro: '❌', proPlus: '✅', ultra: '✅' },
];
