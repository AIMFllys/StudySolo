'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PanelLeft, PanelRight, Cookie } from 'lucide-react';
import { FeedbackChannel } from '@/features/settings/components';
import {
  useSettingsStore,
  type AccentColor,
  type FontSize,
  type ThemeMode,
  type SidebarPosition,
} from '@/stores/use-settings-store';
import {
  ACCENT_OPTIONS,
  FONT_OPTIONS,
  THEME_OPTIONS,
} from '@/features/settings/options';
import {
  fetchConsentStatus,
  updateCookieConsent,
  type CookieConsentLevel,
} from '@/services/consent.service';

function handleChange(name: string, action: () => void) {
  action();
  toast.success('设置已保存', { description: `${name} 偏好已更新`, duration: 2000 });
}

export default function SettingsPanel() {
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    fontSize,
    setFontSize,
    glassEffect,
    setGlassEffect,
    autoSave,
    setAutoSave,
    showMinimap,
    setShowMinimap,
    sidebarPosition,
    setSidebarPosition,
  } = useSettingsStore();

  const [cookieLevel, setCookieLevel] = useState<CookieConsentLevel | null>(null);
  const [cookieSaving, setCookieSaving] = useState(false);
  const [showEssentialConfirm, setShowEssentialConfirm] = useState(false);

  useEffect(() => {
    fetchConsentStatus()
      .then((s) => setCookieLevel(s.cookie_consent_level))
      .catch(() => {});
  }, []);

  /** Route: 'essential' → show confirm dialog; 'all' → save directly */
  function handleCookieRequest(level: CookieConsentLevel) {
    if (level === 'essential') {
      setShowEssentialConfirm(true);
    } else {
      void handleCookieChange(level);
    }
  }

  async function confirmEssentialOnly() {
    await handleCookieChange('essential');
    setShowEssentialConfirm(false);
  }

  async function handleCookieChange(level: CookieConsentLevel) {
    setCookieSaving(true);
    try {
      await updateCookieConsent(level);
      setCookieLevel(level);
      toast.success('Cookie 偏好已更新');
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setCookieSaving(false);
    }
  }

  return (
    <>
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="scrollbar-hide flex-1 overflow-y-auto px-3 py-3">
        {/* Theme mode */}
        <Section title="外观模式">
          <div className="flex gap-1.5">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleChange('外观模式', () => setTheme(opt.value as ThemeMode))}
                className={`node-paper-bg flex flex-1 flex-col items-center gap-1.5 rounded-lg border-[1.5px] px-1.5 py-2 text-[10px] font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                  theme === opt.value
                    ? 'border-primary/40 text-primary scale-[1.02] ring-2 ring-primary/10'
                    : 'border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
              >
                <opt.icon className={`h-4 w-4 stroke-[1.5] ${theme === opt.value ? 'text-primary' : ''}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Accent color */}
        <Section title="主题色">
          <div className="flex flex-wrap gap-2">
            {ACCENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleChange('主题色', () => setAccentColor(opt.value as AccentColor))}
                className="group flex flex-col items-center gap-1"
              >
                <div
                  className={`node-paper-bg h-7 w-7 rounded-full border-[1.5px] transition-all shadow-sm ${
                    accentColor === opt.value ? 'scale-110 border-primary/50 ring-2 ring-primary/20 ring-offset-1 ring-offset-background' : 'border-border/50 hover:scale-105 hover:shadow-md'
                  }`}
                  style={{
                    backgroundColor: opt.color,
                  }}
                />
                <span className={`text-[9px] font-medium tracking-wide mt-1.5 ${accentColor === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </Section>

        {/* Font size */}
        <Section title="字体大小">
          <div className="node-paper-bg flex gap-1.5 rounded-lg border-[1.5px] border-border/50 p-1 shadow-sm">
            {FONT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleChange('字体大小', () => setFontSize(opt.value as FontSize))}
                className={`flex-1 rounded-md py-1.5 text-[10px] transition-all ${
                  fontSize === opt.value
                    ? 'font-bold bg-primary/10 text-primary border-[1.5px] border-primary/30 shadow-sm'
                    : 'font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground border-[1.5px] border-transparent'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Toggles */}
        <Section title="功能">
          <div className="space-y-2">
            <Toggle checked={glassEffect} onChange={(v) => handleChange('毛玻璃', () => setGlassEffect(v))} label="毛玻璃效果" />
            <Toggle checked={autoSave} onChange={(v) => handleChange('自动保存', () => setAutoSave(v))} label="自动保存" />
            <Toggle checked={showMinimap} onChange={(v) => handleChange('小地图', () => setShowMinimap(v))} label="显示小地图" />
          </div>
        </Section>

        {/* Sidebar position */}
        <Section title="菜单栏位置">
          <div className="flex gap-1.5">
            {([
              { value: 'left', label: '左侧', icon: PanelLeft },
              { value: 'right', label: '右侧', icon: PanelRight },
            ] as { value: SidebarPosition; label: string; icon: React.ElementType }[]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleChange('菜单栏位置', () => setSidebarPosition(opt.value))}
                className={`node-paper-bg flex flex-1 flex-col items-center gap-1.5 rounded-lg border-[1.5px] px-1.5 py-2 text-[10px] font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                  sidebarPosition === opt.value
                    ? 'border-primary/40 text-primary scale-[1.02] ring-2 ring-primary/10'
                    : 'border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
              >
                <opt.icon className={`h-4 w-4 stroke-[1.5] ${sidebarPosition === opt.value ? 'text-primary' : ''}`} />
                {opt.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[9px] text-muted-foreground/50">切换后立即生效，无需刷新</p>
        </Section>

        {/* Cookie Privacy */}
        <Section title="隐私偏好">
          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5">
              <button
                onClick={() => handleCookieRequest('essential')}
                disabled={cookieSaving || cookieLevel === 'essential'}
                className={`node-paper-bg flex flex-1 flex-col items-start gap-1 rounded-lg border-[1.5px] px-2 py-2 text-left transition-all shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:hover:shadow-sm ${
                  cookieLevel === 'essential' ? 'border-primary/40' : 'border-border/50 hover:border-primary/30'
                }`}
              >
                <span className={`text-[10px] font-medium ${cookieLevel === 'essential' ? 'text-primary' : 'text-foreground'}`}>仅必要</span>
                <span className="text-[9px] text-muted-foreground leading-[1.2]">维持登录安全</span>
              </button>
              <button
                onClick={() => handleCookieRequest('all')}
                disabled={cookieSaving || cookieLevel === 'all'}
                className={`node-paper-bg flex flex-1 flex-col items-start gap-1 rounded-lg border-[1.5px] px-2 py-2 text-left transition-all shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:hover:shadow-sm ${
                  cookieLevel === 'all' ? 'border-primary/40' : 'border-border/50 hover:border-primary/30'
                }`}
              >
                <span className={`text-[10px] font-medium ${cookieLevel === 'all' ? 'text-primary' : 'text-foreground'}`}>全部接受</span>
                <span className="text-[9px] text-muted-foreground leading-[1.2]">改善体验</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-1 px-1">
              <Cookie className="w-3 h-3 text-muted-foreground/70" />
              <a
                href="https://docs.1037solo.com/#/docs/studysolo-cookie"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] text-muted-foreground hover:text-primary transition-colors hover:underline"
              >
                查看 Cookie 政策
              </a>
            </div>
          </div>
        </Section>

        <div className="mt-6">
          <FeedbackChannel />
        </div>
        <p className="mt-4 text-center text-[9px] text-muted-foreground/50">
          设置自动保存至浏览器本地存储
        </p>
      </div>
    </div>

    {/* Essential Cookie Confirmation Dialog */}
    {showEssentialConfirm && (
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/20 backdrop-blur-[2px]">
        <div className="w-full max-w-sm rounded-2xl border-[1.5px] border-border/50 node-paper-bg shadow-2xl p-5">
          {/* Header */}
          <div className="flex items-start gap-2.5 mb-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 border border-amber-200/60">
              <Cookie className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-foreground tracking-wide">仅使用必要 Cookie？</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">此操作将影响部分体验功能</p>
            </div>
          </div>

          {/* Impact list */}
          <div className="mb-4 rounded-xl bg-amber-50/50 border border-amber-200/40 px-3 py-2.5 text-[10px] text-muted-foreground space-y-1.5">
            <p className="font-medium text-foreground text-[10px] mb-1.5">以下功能可能受到影响：</p>
            <div className="flex items-start gap-1.5">
              <span className="text-amber-500 mt-px">•</span>
              <span>访问数据与会话行为分析将被禁用</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-amber-500 mt-px">•</span>
              <span>偏好记忆（如主题、布局）可能在跨设备间不同步</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-amber-500 mt-px">•</span>
              <span>部分第三方集成功能（如内嵌内容）可能无法正常工作</span>
            </div>
          </div>

          {/* Compliance note */}
          <p className="mb-4 text-[10px] text-muted-foreground leading-relaxed bg-background/50 rounded-lg border border-border/40 px-3 py-2">
            📋 我们承诺：无论您的选择如何，我们均会严格遵照{' '}
            <a
              href="https://docs.1037solo.com/#/docs/studysolo-cookie"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline underline-offset-2 font-medium"
            >
              Cookie 政策
            </a>
            {' '}及 GDPR 等相关法规采集、使用 Cookie 数据，绝不将数据用于授权范围之外的用途。
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowEssentialConfirm(false)}
              className="flex-1 h-8 rounded-lg border-[1.5px] border-border/50 bg-background/50 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all"
            >
              取消
            </button>
            <button
              onClick={confirmEssentialOnly}
              disabled={cookieSaving}
              className="flex-1 h-8 rounded-lg bg-amber-500 text-white text-[10px] font-medium hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {cookieSaving ? '保存中...' : '确认，仅必要 Cookie'}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}


function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 pb-6 border-b border-dashed border-border/50 last:border-0 last:pb-0">
      <p className="mb-3 text-[11px] font-medium tracking-[0.1em] text-muted-foreground/80">
        {title}
      </p>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2.5 text-xs font-medium text-foreground transition-all hover:bg-muted/40"
    >
      {label}
      <div
        className={`node-paper-bg relative h-[22px] w-[38px] rounded-full border-[1.5px] transition-all shadow-sm ${
          checked ? 'border-primary/40' : 'border-border/60'
        }`}
      >
        <div
          className={`absolute top-[1.5px] h-[15px] w-[15px] rounded-full border-[1.5px] bg-background shadow-sm transition-transform ${
            checked ? 'translate-x-[18px] border-primary' : 'translate-x-[2px] border-border/60'
          }`}
        />
      </div>
    </button>
  );
}
