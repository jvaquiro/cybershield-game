import rawData from '../../data/subestacion.json';
import { parseSubstationData, type SubstationData } from '../../data/schema';

export function parseOrThrow(input: unknown): SubstationData {
  const result = parseSubstationData(input);
  if (!result.ok) throw new Error(result.errors.join('\n'));
  return result.data;
}

/** The placeholder substation from subestacion.json (probability = impact = 3, risk 9 each). */
export const placeholder: SubstationData = parseOrThrow(rawData);

type Blocks = { routeId: string; stepIndex: number }[];

/**
 * Small synthetic substation for tie-break tests. Every asset has risk 9.
 * Routes are given as { id: steps }, controls as { id: blocks }.
 */
export function makeData(
  routes: Record<string, string[]>,
  controls: Record<string, Blocks>,
  defenderBudget = 1,
): SubstationData {
  const assetIds = [...new Set(Object.values(routes).flat())];
  return parseOrThrow({
    name: 'Test',
    assets: assetIds.map((id) => ({
      id,
      name: id,
      level: 2,
      protocol: 'test',
      probability: 3,
      impact: 3,
      description: 'test',
    })),
    routes: Object.entries(routes).map(([id, steps]) => ({ id, name: id, entry: id, steps })),
    controls: Object.entries(controls).map(([id, blocks]) => ({
      id,
      name: id,
      description: id,
      blocks,
    })),
    outcomes: [{ level: 2, cityOffPercent: 0 }],
    defenderBudget,
  });
}
