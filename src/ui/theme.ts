// Single source of truth for colors and sizes.
// Tailwind classes read the same values from @theme in src/index.css;
// src/ui/__tests__/theme.test.ts fails if the two drift apart.
export const colors = {
  navy950: '#06101f',
  navy900: '#0b1a33',
  navy800: '#13284d',
  navy700: '#1f3d70',
  cyan: '#38d9f5',
  attack: '#ff4b55',
  blocked: '#2fe39a',
  cityLight: '#ffc04a',
  cityOff: '#1a2436',
  dim: '#4a5b78',
  text: '#e8eef8',
  textMuted: '#93a5c2',
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
