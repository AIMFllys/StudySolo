'use client';

import { useEffect } from 'react';
import { useSettingsStore, type ThemeMode } from '@/stores/use-settings-store';

/**
 * ThemeProvider — syncs Zustand theme state to the <html> element.
 *
 * Adds/removes the "dark" class and sets a data-theme attribute
 * so CSS variables can switch between light and dark palettes.
 * Respects "system" preference via matchMedia listener.
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useSettingsStore((s) => s.theme);

    useEffect(() => {
        function applyTheme(mode: ThemeMode) {
            const root = document.documentElement;
            if (mode === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                root.classList.toggle('dark', prefersDark);
                root.classList.toggle('light', !prefersDark);
                root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            } else {
                root.classList.toggle('dark', mode === 'dark');
                root.classList.toggle('light', mode === 'light');
                root.setAttribute('data-theme', mode);
            }
        }

        applyTheme(theme);

        // Listen for system preference changes when theme is "system"
        if (theme === 'system') {
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = () => applyTheme('system');
            mq.addEventListener('change', handler);
            return () => mq.removeEventListener('change', handler);
        }
    }, [theme]);

    return <>{children}</>;
}
