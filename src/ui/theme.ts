// Single source of truth for colors and sizes. Keep in sync with @theme in src/index.css.
export const colors = {
  navy950: '#050b18',
  navy900: '#0a1630',
  navy800: '#12234a',
  cyan: '#22d3ee',
  attack: '#ef4444',
  blocked: '#22c55e',
  cityLight: '#fbbf24',
  text: '#e2e8f0',
} as const;

export const sizes = {
  baseFontPx: 18,
  minTapTargetPx: 48,
} as const;
