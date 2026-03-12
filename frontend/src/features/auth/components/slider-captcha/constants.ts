export const WIDTH = 320;
export const HEIGHT = 160;
export const PIECE_LENGTH = 42;
export const PIECE_RADIUS = 9;
export const PIECE_SIZE = PIECE_LENGTH + PIECE_RADIUS * 2 + 3;
export const PI = Math.PI;
export const TOLERANCE = 6;

export const BG_THEMES = [
  { colors: ['#1e3a5f', '#0f172a', '#1a1a2e'], accent: '#6366f1' },
  { colors: ['#1a2744', '#0d1117', '#16213e'], accent: '#818cf8' },
  { colors: ['#0f2027', '#203a43', '#2c5364'], accent: '#10b981' },
  { colors: ['#1f1c2c', '#2d283e', '#1f1c2c'], accent: '#a78bfa' },
  { colors: ['#141e30', '#243b55', '#141e30'], accent: '#f472b6' },
] as const;
