// Single source of truth for colors and sizes.
// Tailwind classes read the same values from @theme in src/index.css;
// src/ui/__tests__/theme.test.ts fails if the two drift apart.
export const colors = {
  navy950: '#050b18',
  navy900: '#0a1630',
  navy800: '#12234a',
  navy700: '#1e3a6e',
  cyan: '#22d3ee',
  attack: '#ef4444',
  blocked: '#22c55e',
  cityLight: '#fbbf24',
  cityOff: '#1f2937',
  dim: '#475569',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
} as const;

/** CSS custom property name used by Tailwind for each color. */
export const cssColorVars: Record<keyof typeof colors, string> = {
  navy950: '--color-navy-950',
  navy900: '--color-navy-900',
  navy800: '--color-navy-800',
  navy700: '--color-navy-700',
  cyan: '--color-cyan-accent',
  attack: '--color-attack',
  blocked: '--color-blocked',
  cityLight: '--color-city-light',
  cityOff: '--color-city-off',
  dim: '--color-dim',
  text: '--color-text',
  textMuted: '--color-text-muted',
};

export const sizes = {
  baseFontPx: 18,
  minTapTargetPx: 48,
} as const;

/** Geometry of the substation map SVG, in viewBox units. */
export const mapGeometry = {
  width: 1000,
  bandHeight: 112,
  cardWidth: 210,
  cardHeight: 64,
  cardMinGap: 24,
  entryWidth: 220,
  routeOffset: 14,
  fontSize: 22,
  labelFontSize: 20,
} as const;
