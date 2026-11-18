/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { makeData, placeholder as data } from '../../engine/__tests__/fixtures';
import { es } from '../../i18n/es';
import { compareChoice } from '../logic/compareChoice';
import { computeMapLayout, wrapText } from '../logic/mapLayout';
import { toggleSelection } from '../logic/selection';
import { colors, cssColorVars, mapGeometry as g } from '../theme';

// Vitest stubs CSS imports, so read the file directly.
const css = readFileSync(new URL('../../index.css', import.meta.url), 'utf8');

describe('theme', () => {
  it('index.css @theme matches theme.ts', () => {
    for (const [key, value] of Object.entries(colors)) {
      const name = cssColorVars[key as keyof typeof colors];
      expect(css).toContain(`${name}: ${value};`);
    }
  });
});

describe('wrapText', () => {
  it('wraps by words and keeps long words whole', () => {
    expect(wrapText('USB o actualización de software', 19)).toEqual([
      'USB o actualización',
      'de software',
    ]);
    expect(wrapText('Correo de phishing', 19)).toEqual(['Correo de phishing']);
    expect(wrapText('supercalifragilístico', 5)).toEqual(['supercalifragilístico']);
  });
});

describe('computeMapLayout', () => {
  const layout = computeMapLayout(data);

  it('has one band per Purdue level, level 4 on top', () => {
    expect(layout.bands.map((band) => band.level)).toEqual([4, 3, 2, 1, 0]);
    expect(layout.height).toBe(5 * g.bandHeight);
  });

  it('places every asset inside its own band and inside the map', () => {
    for (const asset of data.assets) {
      const box = layout.assets[asset.id]!;
      const top = (4 - asset.level) * g.bandHeight;
      expect(box.y - g.cardHeight / 2).toBeGreaterThan(top);
      expect(box.y + g.cardHeight / 2).toBeLessThan(top + g.bandHeight);
      expect(box.x - g.cardWidth / 2).toBeGreaterThanOrEqual(0);
      expect(box.x + g.cardWidth / 2).toBeLessThanOrEqual(g.width);
    }
  });

  it('puts shared assets between the routes', () => {
    const { corporate, hmi, ied } = layout.assets;
    expect(corporate!.x).toBeLessThan(ied!.x);
    expect(hmi!.x).toBeGreaterThan(ied!.x);
  });

  it('has one segment per step, starting at the entry point', () => {
    for (const route of data.routes) {
      const routeLayout = layout.routes.find((item) => item.routeId === route.id)!;
      expect(routeLayout.segments).toHaveLength(route.steps.length);
      expect(routeLayout.entry.lines.join(' ')).toBe(route.entry);
    }
  });

  it('keeps entry boxes inside the map and clear of the first card', () => {
    for (const routeLayout of layout.routes) {
      const route = data.routes.find((item) => item.id === routeLayout.routeId)!;
      const first = layout.assets[route.steps[0]!]!;
      const { entry } = routeLayout;
      expect(entry.x - entry.width / 2).toBeGreaterThanOrEqual(0);
      expect(entry.x + entry.width / 2).toBeLessThanOrEqual(g.width);
      const gap = Math.abs(entry.x - first.x) - entry.width / 2 - g.cardWidth / 2;
      expect(gap).toBeGreaterThan(0);
    }
  });

  it('spreads assets that share a band', () => {
    const crowded = makeData(
      { a: ['x'], b: ['y'], c: ['z'] },
      { k: [{ routeId: 'a', stepIndex: 0 }] },
    );
    const boxes = Object.values(computeMapLayout(crowded).assets).sort((p, q) => p.x - q.x);
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i]!.x - boxes[i - 1]!.x).toBeGreaterThanOrEqual(g.cardWidth);
    }
  });
});

describe('toggleSelection', () => {
  it('budget 1 replaces the choice', () => {
    expect(toggleSelection([], 'a', 1)).toEqual(['a']);
    expect(toggleSelection(['a'], 'b', 1)).toEqual(['b']);
    expect(toggleSelection(['a'], 'a', 1)).toEqual([]);
  });

  it('larger budget ignores taps beyond the budget', () => {
    expect(toggleSelection(['a'], 'b', 2)).toEqual(['a', 'b']);
    expect(toggleSelection(['a', 'b'], 'c', 2)).toEqual(['a', 'b']);
    expect(toggleSelection(['a', 'b'], 'a', 2)).toEqual(['b']);
  });
});

describe('compareChoice', () => {
  it('matches when the user picks the recommendation', () => {
    expect(compareChoice(data, ['usb-policy']).verdict).toBe('match');
  });

  it('every other control: recommendation leaves lower risk', () => {
    expect(compareChoice(data, ['segmentation'])).toMatchObject({
      verdict: 'lowerRisk',
      userRisk: 52,
    });
    expect(compareChoice(data, ['dual-auth'])).toMatchObject({
      verdict: 'lowerRisk',
      userRisk: 76,
    });
    expect(compareChoice(data, ['firmware-check']).verdict).toBe('lowerRisk');
  });

  it('same risk and routes: recommendation blocks earlier', () => {
    const tie = makeData(
      { p: ['x', 'y', 'z'], q: ['x', 'y'] },
      {
        'a-late': [{ routeId: 'p', stepIndex: 1 }],
        'z-early': [{ routeId: 'q', stepIndex: 0 }],
      },
    );
    expect(compareChoice(tie, ['a-late'])).toMatchObject({ verdict: 'earlier', userRisk: 27 });
  });

  it('full tie with a different id is equivalent', () => {
    const tie = makeData(
      { a: ['x'] },
      { alpha: [{ routeId: 'a', stepIndex: 0 }], beta: [{ routeId: 'a', stepIndex: 0 }] },
    );
    expect(compareChoice(tie, ['beta']).verdict).toBe('equivalent');
  });
});

describe('es.result.cityScenario', () => {
  it('lowercases a normal first word but keeps acronyms', () => {
    expect(es.result.cityScenario('Correo de phishing')).toBe(
      'Si el atacante entra por correo de phishing',
    );
    expect(es.result.cityScenario('USB o actualización de software')).toBe(
      'Si el atacante entra por USB o actualización de software',
    );
  });
});
