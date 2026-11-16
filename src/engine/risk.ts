import type { Asset, PurdueLevel, SubstationData } from '../data/schema';
import { outcomeFor, simulate, type RouteResult } from './simulation';

export interface RiskReduction {
  before: number;
  after: number;
  reduction: number;
  /** reduction / before × 100; 0 when there is no risk before. */
  percent: number;
}

/** probability × impact, range 1–25. */
export function assetRisk(asset: Asset): number {
  return asset.probability * asset.impact;
}

function riskOfResults(data: SubstationData, results: readonly RouteResult[]): number {
  const reached = new Set(results.flatMap((result) => result.reachedAssetIds));
  return data.assets
    .filter((asset) => reached.has(asset.id))
    .reduce((sum, asset) => sum + assetRisk(asset), 0);
}

/** Sum of assetRisk of every asset reached by at least one route, each asset counted once. */
export function totalRisk(data: SubstationData, selectedControlIds: readonly string[]): number {
  return riskOfResults(data, simulate(data, selectedControlIds));
}

export function riskReduction(
  data: SubstationData,
  selectedControlIds: readonly string[],
): RiskReduction {
  const before = totalRisk(data, []);
  const after = totalRisk(data, selectedControlIds);
  const reduction = before - after;
  return { before, after, reduction, percent: before === 0 ? 0 : (reduction / before) * 100 };
}

/** Deepest level reached by any route (null if no route reaches an asset). */
export function deepestLevelOverall(results: readonly RouteResult[]): PurdueLevel | null {
  let deepest: PurdueLevel | null = null;
  for (const { deepestLevel } of results) {
    if (deepestLevel !== null && (deepest === null || deepestLevel < deepest)) {
      deepest = deepestLevel;
    }
  }
  return deepest;
}

/** Stage 1: outcome for the deepest level reached by any route. */
export function cityOffPercent(
  data: SubstationData,
  selectedControlIds: readonly string[],
): number {
  return outcomeFor(data, deepestLevelOverall(simulate(data, selectedControlIds)));
}
