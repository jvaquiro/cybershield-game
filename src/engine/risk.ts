import type { Asset, Control, Route, SubstationData } from '../data/schema';
import { outcomeFor, selectControls, simulate, simulateRoute } from './simulation';

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

export interface RouteCityOff {
  routeId: string;
  /** outcomes value for the deepest level this route reaches; 0 if it reaches no asset. */
  cityOffPercent: number;
}

/**
 * Stage 1: one scenario per route ("if the attacker enters this way"), in data.routes order.
 * Stage 2 uses duel(), which gives the same value for the single chosen route.
 */
export function cityOffPercent(
  data: SubstationData,
  selectedControlIds: readonly string[],
): RouteCityOff[] {
  return simulate(data, selectedControlIds).map((result) => ({
    routeId: result.routeId,
    cityOffPercent: outcomeFor(data, result.deepestLevel),
  }));
}
