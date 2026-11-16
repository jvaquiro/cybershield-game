import { describe, expect, it } from 'vitest';
import { assetRisk, cityOffPercent, riskReduction, routeRisk, totalRisk } from '../risk';
import { combinations, recommend } from '../recommendation';
import { duel, simulate, simulateRoute } from '../simulation';
import { makeData, placeholder as data } from './fixtures';

const route = (id: string) => data.routes.find((item) => item.id === id)!;
const control = (id: string) => data.controls.find((item) => item.id === id)!;
const byRoute = (controlIds: string[]) =>
  Object.fromEntries(simulate(data, controlIds).map((result) => [result.routeId, result]));

describe('assetRisk', () => {
  it('is probability × impact', () => {
    expect(assetRisk(data.assets[0]!)).toBe(9);
    expect(assetRisk({ ...data.assets[0]!, probability: 5, impact: 4 })).toBe(20);
  });
});

describe('no controls', () => {
  it('every route reaches every step and the process level', () => {
    const results = byRoute([]);
    expect(results.remote).toMatchObject({
      blockedAt: null,
      blockingControlId: null,
      reachedAssetIds: ['corporate', 'scada', 'ied', 'breakers'],
      deepestLevel: 0,
    });
    expect(results.local).toMatchObject({
      blockedAt: null,
      reachedAssetIds: ['hmi', 'ied', 'breakers'],
      deepestLevel: 0,
    });
  });

  it('total risk counts shared assets once per route and the whole city goes off', () => {
    // remote 4 × 9 = 36, local 3 × 9 = 27; ied and breakers count in both routes.
    expect(routeRisk(route('remote'), [], data.assets)).toBe(36);
    expect(routeRisk(route('local'), [], data.assets)).toBe(27);
    expect(totalRisk(data, [])).toBe(63);
    expect(cityOffPercent(data, [])).toBe(100);
    expect(riskReduction(data, [])).toEqual({ before: 63, after: 63, reduction: 0, percent: 0 });
  });
});

describe('route blocked at stepIndex 0', () => {
  it('reaches no asset', () => {
    expect(simulateRoute(route('local'), [control('usb-policy')])).toEqual({
      blockedAt: 0,
      blockingControlId: 'usb-policy',
      reachedAssetIds: [],
    });
    expect(byRoute(['usb-policy']).local!.deepestLevel).toBeNull();
  });

  it('duel gives 0 % city off', () => {
    expect(duel(data, 'usb-policy', 'local')).toMatchObject({
      reachedAssetIds: [],
      deepestLevel: null,
      cityOffPercent: 0,
    });
  });
});

describe('route blocked late', () => {
  it('dual-auth stops remote before the breakers', () => {
    expect(duel(data, 'dual-auth', 'remote')).toMatchObject({
      blockedAt: 3,
      blockingControlId: 'dual-auth',
      reachedAssetIds: ['corporate', 'scada', 'ied'],
      deepestLevel: 1,
      cityOffPercent: 30,
    });
  });

  it('the lowest stepIndex wins when several controls block the route', () => {
    const result = simulateRoute(route('remote'), [control('dual-auth'), control('segmentation')]);
    expect(result.blockedAt).toBe(1);
    expect(result.blockingControlId).toBe('segmentation');
  });
});

describe('control that does not touch the chosen route', () => {
  it('leaves the route unblocked', () => {
    expect(duel(data, 'firmware-check', 'remote')).toMatchObject({
      blockedAt: null,
      blockingControlId: null,
      reachedAssetIds: ['corporate', 'scada', 'ied', 'breakers'],
      deepestLevel: 0,
      cityOffPercent: 100,
    });
  });
});

describe('totalRisk, riskReduction and cityOffPercent with controls', () => {
  it('partial blocking keeps assets reached by the other route', () => {
    // segmentation: remote reaches corporate (9); local still reaches hmi, ied, breakers (27).
    expect(routeRisk(route('remote'), [control('segmentation')], data.assets)).toBe(9);
    expect(totalRisk(data, ['segmentation'])).toBe(36);
    expect(cityOffPercent(data, ['segmentation'])).toBe(100);
    const reduction = riskReduction(data, ['segmentation']);
    expect(reduction).toMatchObject({ before: 63, after: 36, reduction: 27 });
    expect(reduction.percent).toBeCloseTo((27 / 63) * 100);
  });

  it('total risk for each single control', () => {
    expect(totalRisk(data, ['segmentation'])).toBe(36);
    expect(totalRisk(data, ['usb-policy'])).toBe(36);
    expect(totalRisk(data, ['firmware-check'])).toBe(45);
    expect(totalRisk(data, ['dual-auth'])).toBe(54);
  });

  it('all routes blocked', () => {
    // remote reaches corporate only (level 4), local nothing.
    expect(totalRisk(data, ['segmentation', 'usb-policy'])).toBe(9);
    expect(cityOffPercent(data, ['segmentation', 'usb-policy'])).toBe(0);
    expect(riskReduction(data, ['segmentation', 'usb-policy']).percent).toBeCloseTo(
      (54 / 63) * 100,
    );
  });

  it('rejects unknown or repeated control ids', () => {
    expect(() => simulate(data, ['ghost'])).toThrow('Unknown control id');
    expect(() => simulate(data, ['dual-auth', 'dual-auth'])).toThrow('Repeated');
    expect(() => duel(data, 'dual-auth', 'ghost')).toThrow('Unknown route id');
  });
});

describe('recommend', () => {
  it('combinations is lexicographic and complete', () => {
    expect(combinations(['a', 'b', 'c'], 2)).toEqual([
      ['a', 'b'],
      ['a', 'c'],
      ['b', 'c'],
    ]);
    expect(combinations(['a', 'b', 'c', 'd', 'e', 'f'], 3)).toHaveLength(20);
    expect(combinations(['a'], 0)).toEqual([[]]);
  });

  it('placeholder data: usb-policy beats segmentation on the earlier-block tie-break', () => {
    // Both leave risk 36 and block one route; usb-policy blocks at 0, segmentation at 1.
    expect(recommend(data)).toEqual({
      controlIds: ['usb-policy'],
      totalRisk: 36,
      routesBlocked: 1,
      blockedAtSum: 0,
    });
  });

  it('with budget 2 picks the early control of each route', () => {
    expect(recommend(data, 2).controlIds).toEqual(['segmentation', 'usb-policy']);
  });

  it('tie on risk: prefers the combination that blocks more routes', () => {
    // Before: 3 routes × 18 = 54. a-one removes 18 from one route; z-two removes 9 from two routes.
    const tie = makeData(
      { a: ['x', 'y'], b: ['x', 'y'], c: ['x', 'y'] },
      {
        'a-one': [{ routeId: 'a', stepIndex: 0 }],
        'z-two': [
          { routeId: 'b', stepIndex: 1 },
          { routeId: 'c', stepIndex: 1 },
        ],
      },
    );
    expect(totalRisk(tie, ['a-one'])).toBe(36);
    expect(recommend(tie)).toMatchObject({
      controlIds: ['z-two'],
      totalRisk: 36,
      routesBlocked: 2,
    });
  });

  it('tie on risk and routes: prefers the earlier block', () => {
    // Both remove 18: a-late cuts y, z off route p at step 1; z-early cuts all of q at step 0.
    const tie = makeData(
      { p: ['x', 'y', 'z'], q: ['x', 'y'] },
      {
        'a-late': [{ routeId: 'p', stepIndex: 1 }],
        'z-early': [{ routeId: 'q', stepIndex: 0 }],
      },
    );
    expect(totalRisk(tie, ['a-late'])).toBe(totalRisk(tie, ['z-early']));
    expect(recommend(tie).controlIds).toEqual(['z-early']);
  });

  it('full tie: alphabetical order of ids', () => {
    const tie = makeData(
      { a: ['x'] },
      {
        beta: [{ routeId: 'a', stepIndex: 0 }],
        alpha: [{ routeId: 'a', stepIndex: 0 }],
      },
    );
    expect(recommend(tie).controlIds).toEqual(['alpha']);
  });

  it('rejects an invalid budget', () => {
    expect(() => recommend(data, 5)).toThrow('Invalid budget');
    expect(() => recommend(data, -1)).toThrow('Invalid budget');
  });

  it('is deterministic', () => {
    expect(recommend(data)).toEqual(recommend(data));
    expect(simulate(data, ['dual-auth'])).toEqual(simulate(data, ['dual-auth']));
  });
});
