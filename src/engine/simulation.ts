import type { Control, PurdueLevel, Route, SubstationData } from '../data/schema';

/** Result of running one route against a set of controls. */
export interface RouteSimulation {
  /** Lowest stepIndex blocked by the selected controls, or null if the route is not blocked. */
  blockedAt: number | null;
  /** Control that blocks at `blockedAt` (alphabetically first id if several do), or null. */
  blockingControlId: string | null;
  /** Asset ids reached, in route order: steps before `blockedAt`, or all steps if not blocked. */
  reachedAssetIds: string[];
}

export interface RouteResult extends RouteSimulation {
  routeId: string;
  /** Lowest Purdue level among the reached assets, or null if no asset is reached. */
  deepestLevel: PurdueLevel | null;
}

export interface DuelResult extends RouteResult {
  controlId: string;
  cityOffPercent: number;
}

export function simulateRoute(route: Route, selectedControls: readonly Control[]): RouteSimulation {
  let blockedAt: number | null = null;
  let blockingControlId: string | null = null;

  for (const control of selectedControls) {
    for (const block of control.blocks) {
      if (block.routeId !== route.id) continue;
      const earlier = blockedAt === null || block.stepIndex < blockedAt;
      const sameStepFirstId =
        block.stepIndex === blockedAt &&
        blockingControlId !== null &&
        control.id < blockingControlId;
      if (earlier || sameStepFirstId) {
        blockedAt = block.stepIndex;
        blockingControlId = control.id;
      }
    }
  }

  const reachedAssetIds = blockedAt === null ? [...route.steps] : route.steps.slice(0, blockedAt);
  return { blockedAt, blockingControlId, reachedAssetIds };
}

/** Looks up the selected controls by id. Throws on unknown or repeated ids. */
export function selectControls(data: SubstationData, controlIds: readonly string[]): Control[] {
  const byId = new Map(data.controls.map((control) => [control.id, control]));
  if (new Set(controlIds).size !== controlIds.length) {
    throw new Error(`Repeated control id in selection: ${controlIds.join(', ')}`);
  }
  return controlIds.map((id) => {
    const control = byId.get(id);
    if (!control) throw new Error(`Unknown control id: ${id}`);
    return control;
  });
}

/** Deepest (lowest-numbered) Purdue level among the given assets, or null if none. */
export function deepestLevel(
  data: SubstationData,
  assetIds: readonly string[],
): PurdueLevel | null {
  const levels = new Map(data.assets.map((asset) => [asset.id, asset.level]));
  let deepest: PurdueLevel | null = null;
  for (const id of assetIds) {
    const level = levels.get(id);
    if (level === undefined) throw new Error(`Unknown asset id: ${id}`);
    if (deepest === null || level < deepest) deepest = level;
  }
  return deepest;
}

function runRoute(data: SubstationData, route: Route, controls: readonly Control[]): RouteResult {
  const result = simulateRoute(route, controls);
  return { routeId: route.id, ...result, deepestLevel: deepestLevel(data, result.reachedAssetIds) };
}

export function simulate(
  data: SubstationData,
  selectedControlIds: readonly string[],
): RouteResult[] {
  const controls = selectControls(data, selectedControlIds);
  return data.routes.map((route) => runRoute(data, route, controls));
}

/** City percentage turned off for a deepest level. No asset reached (null) means 0 %. */
export function outcomeFor(data: SubstationData, level: PurdueLevel | null): number {
  if (level === null) return 0;
  const outcome = data.outcomes.find((item) => item.level === level);
  if (!outcome) throw new Error(`No outcome defined for Purdue level ${level}`);
  return outcome.cityOffPercent;
}

/** Stage 2: one chosen control against one chosen route. */
export function duel(data: SubstationData, controlId: string, routeId: string): DuelResult {
  const route = data.routes.find((item) => item.id === routeId);
  if (!route) throw new Error(`Unknown route id: ${routeId}`);
  const result = runRoute(data, route, selectControls(data, [controlId]));
  return { ...result, controlId, cityOffPercent: outcomeFor(data, result.deepestLevel) };
}
