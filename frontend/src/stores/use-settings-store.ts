'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AccentColor, FontSize, ThemeMode } from '@/types/settings';

export type { AccentColor, FontSize, ThemeMode } from '@/types/settings';

interface SettingsState {
  theme: ThemeMode;
  accentColor: AccentColor;
  fontSize: FontSize;
  glassEffect: boolean;
  autoSave: boolean;
  showMinimap: boolean;
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setFontSize: (size: FontSize) => void;
  setGlassEffect: (enabled: boolean) => void;
  setAutoSave: (enabled: boolean) => void;
  setShowMinimap: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      accentColor: 'indigo',
      fontSize: 'default',
      glassEffect: true,
      autoSave: true,
      showMinimap: false,
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setFontSize: (fontSize) => set({ fontSize }),
      setGlassEffect: (glassEffect) => set({ glassEffect }),
      setAutoSave: (autoSave) => set({ autoSave }),
      setShowMinimap: (showMinimap) => set({ showMinimap }),
    }),
    {
      name: 'studysolo-settings',
    }
  )
);
