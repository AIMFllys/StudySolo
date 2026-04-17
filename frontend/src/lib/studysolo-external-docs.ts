/**
 * 官方文档站点（docs.1037solo.com）固定入口，供 Wiki 侧栏等复用。
 */
export const STUDYSOLO_EXTERNAL_DOCS = {
  intro: 'https://docs.1037solo.com/#/docs/studysolo-intro',
  terms: 'https://docs.1037solo.com/#/docs/studysolo-terms',
  privacy: 'https://docs.1037solo.com/#/docs/studysolo-privacy',
  cookie: 'https://docs.1037solo.com/#/docs/studysolo-cookie',
} as const;

export const STUDYSOLO_WIKI_PLATFORM_LINKS = [
  { label: 'StudySolo介绍', href: STUDYSOLO_EXTERNAL_DOCS.intro },
  { label: '服务条款', href: STUDYSOLO_EXTERNAL_DOCS.terms },
  { label: '隐私政策', href: STUDYSOLO_EXTERNAL_DOCS.privacy },
  { label: 'Cookie政策', href: STUDYSOLO_EXTERNAL_DOCS.cookie },
] as const;
