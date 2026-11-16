import type { SubstationData } from '../data/schema';
import { totalRisk } from './risk';
import { simulate } from './simulation';

export interface Recommendation {
  /** Recommended control ids, sorted alphabetically. */
  controlIds: string[];
  totalRisk: number;
  routesBlocked: number;
  /** Sum of blockedAt over the blocked routes (lower = blocks earlier). Tie-breaker only. */
  blockedAtSum: number;
}

/** All k-element combinations of `items`, in lexicographic order of the input. */
export function combinations<T>(items: readonly T[], k: number): T[][] {
  if (k === 0) return [[]];
  const result: T[][] = [];
  items.forEach((item, index) => {
    for (const rest of combinations(items.slice(index + 1), k - 1)) {
      result.push([item, ...rest]);
    }
  });
  return result;
}

function evaluate(data: SubstationData, controlIds: string[]): Recommendation {
  const results = simulate(data, controlIds);
  const blocked = results.filter((result) => result.blockedAt !== null);
  return {
    controlIds,
    totalRisk: totalRisk(data, controlIds),
    routesBlocked: blocked.length,
    blockedAtSum: blocked.reduce((sum, result) => sum + (result.blockedAt ?? 0), 0),
  };
}

/** Lexicographic comparison of id lists (same length). */
function compareIds(a: readonly string[], b: readonly string[]): number {
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    const y = b[i]!;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

/** Negative if `a` is the better recommendation. */
function compare(a: Recommendation, b: Recommendation): number {
  return (
    a.totalRisk - b.totalRisk ||
    b.routesBlocked - a.routesBlocked ||
    a.blockedAtSum - b.blockedAtSum ||
    compareIds(a.controlIds, b.controlIds)
  );
}

/**
 * Brute force over every combination of `budget` controls. Lowest total risk wins; ties go to
 * more routes blocked, then earlier blocking (lower blockedAt sum), then alphabetical ids.
 */
export function recommend(
  data: SubstationData,
  budget: number = data.defenderBudget,
): Recommendation {
  if (!Number.isInteger(budget) || budget < 0 || budget > data.controls.length) {
    throw new Error(`Invalid budget ${budget} for ${data.controls.length} controls`);
  }
  const ids = data.controls.map((control) => control.id).sort();
  const ranked = combinations(ids, budget)
    .map((combo) => evaluate(data, combo))
    .sort(compare);
  return ranked[0]!;
}
