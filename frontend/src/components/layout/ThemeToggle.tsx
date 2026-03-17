'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useSettingsStore, type ThemeMode } from '@/stores/use-settings-store';

const THEME_CYCLE: ThemeMode[] = ['dark', 'light', 'system'];
const THEME_ICON: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};
const THEME_LABEL: Record<ThemeMode, string> = {
  light: '浅色模式',
  dark: '深色模式',
  system: '跟随系统',
};

/**
 * Theme toggle button — cycles through dark → light → system.
 */
export default function ThemeToggle() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  function handleToggle() {
    const currentIndex = THEME_CYCLE.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
    setTheme(THEME_CYCLE[nextIndex]);
  }

  const Icon = THEME_ICON[theme];

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/8 hover:text-foreground active:scale-95"
      title={THEME_LABEL[theme]}
      aria-label={`切换主题：${THEME_LABEL[theme]}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
