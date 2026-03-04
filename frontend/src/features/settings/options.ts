import type { AccentColor, FontSize, ThemeMode } from '@/types/settings';

export const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: '浅色', icon: 'light_mode' },
  { value: 'dark', label: '深色', icon: 'dark_mode' },
  { value: 'system', label: '跟随系统', icon: 'desktop_windows' },
];

export const ACCENT_OPTIONS: {
  value: AccentColor;
  label: string;
  color: string;
}[] = [
  { value: 'indigo', label: '靛蓝', color: '#6366F1' },
  { value: 'emerald', label: '翠绿', color: '#10B981' },
  { value: 'rose', label: '玫红', color: '#F43F5E' },
  { value: 'amber', label: '琥珀', color: '#F59E0B' },
  { value: 'cyan', label: '青蓝', color: '#06B6D4' },
];

export const FONT_OPTIONS: { value: FontSize; label: string }[] = [
  { value: 'small', label: '小' },
  { value: 'default', label: '默认' },
  { value: 'large', label: '大' },
];
