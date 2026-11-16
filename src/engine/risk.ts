import type { Asset, Control, PurdueLevel, Route, SubstationData } from '../data/schema';
import {
  outcomeFor,
  selectControls,
  simulate,
  simulateRoute,
  type RouteResult,
} from './simulation';

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

/**
 * Sum of assetRisk of the assets the attacker reaches on this route. `assets` is needed to look up
 * probability and impact, since a route only stores asset ids.
 */
export function routeRisk(
  route: Route,
  selectedControls: readonly Control[],
  assets: readonly Asset[],
): number {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  return simulateRoute(route, selectedControls).reachedAssetIds.reduce((sum, id) => {
    const asset = byId.get(id);
    if (!asset) throw new Error(`Unknown asset id: ${id}`);
    return sum + assetRisk(asset);
  }, 0);
}

/**
 * Sum of routeRisk over all routes. Each route is a separate attack scenario, so an asset shared
 * by two routes counts once per route that reaches it.
 */
export function totalRisk(data: SubstationData, selectedControlIds: readonly string[]): number {
  const controls = selectControls(data, selectedControlIds);
  return data.routes.reduce((sum, route) => sum + routeRisk(route, controls, data.assets), 0);
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
