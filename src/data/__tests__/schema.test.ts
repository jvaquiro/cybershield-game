import { describe, expect, it } from 'vitest';
import rawData from '../subestacion.json';
import { isPlaceholder, parseSubstationData, type SubstationData } from '../schema';

// Deep copy of the real JSON so each test can break it independently.
function validData(): SubstationData {
  return structuredClone(rawData) as SubstationData;
}

function expectError(input: unknown, fragment: string): void {
  const result = parseSubstationData(input);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.errors.some((error) => error.includes(fragment))).toBe(true);
  }
}

describe('subestacion.json', () => {
  it('loads and passes validation', () => {
    const result = parseSubstationData(rawData);
    if (!result.ok) throw new Error(result.errors.join('\n'));
    expect(result.data.assets).toHaveLength(5);
    expect(result.data.routes).toHaveLength(2);
    expect(result.data.controls).toHaveLength(4);
    expect(result.data.defenderBudget).toBe(1);
  });

  it('is marked as placeholder data', () => {
    const result = parseSubstationData(rawData);
    expect(result.ok && isPlaceholder(result.data)).toBe(true);
  });
});

describe('substationDataSchema rejects invalid data', () => {
  it('duplicate asset id', () => {
    const data = validData();
    data.assets.push({ ...data.assets[0]! });
    expectError(data, 'Id repetido en assets: "corporate"');
  });

  it('duplicate route id', () => {
    const data = validData();
    data.routes.push({ ...data.routes[0]! });
    expectError(data, 'Id repetido en routes: "remote"');
  });

  it('duplicate control id', () => {
    const data = validData();
    data.controls.push({ ...data.controls[0]! });
    expectError(data, 'Id repetido en controls: "segmentation"');
  });

  it('unknown asset in a route', () => {
    const data = validData();
    data.routes[0]!.steps.push('ghost');
    expectError(data, 'usa el activo "ghost"');
  });

  it('block pointing to an unknown route', () => {
    const data = validData();
    data.controls[0]!.blocks = [{ routeId: 'ghost', stepIndex: 0 }];
    expectError(data, 'bloquea la ruta "ghost"');
  });

  it('stepIndex out of range', () => {
    const data = validData();
    // Route "local" has 3 steps, so valid indexes are 0..2.
    data.controls[2]!.blocks = [{ routeId: 'local', stepIndex: 3 }];
    expectError(data, 'stepIndex 3');
  });

  it('negative or non-integer stepIndex', () => {
    const negative = validData();
    negative.controls[0]!.blocks[0]!.stepIndex = -1;
    expect(parseSubstationData(negative).ok).toBe(false);

    const fractional = validData();
    fractional.controls[0]!.blocks[0]!.stepIndex = 1.5;
    expect(parseSubstationData(fractional).ok).toBe(false);
  });

  it('missing outcome for a level used by the routes', () => {
    const data = validData();
    data.outcomes = data.outcomes.filter((outcome) => outcome.level !== 1);
    expectError(data, 'Falta un outcome para el nivel 1');
  });

  it('probability outside 1..5', () => {
    const data = validData() as unknown as { assets: { probability: number }[] };
    data.assets[0]!.probability = 6;
    expect(parseSubstationData(data).ok).toBe(false);
  });

  it('defenderBudget larger than the number of controls', () => {
    const data = validData();
    data.defenderBudget = 5;
    expectError(data, 'defenderBudget (5)');
  });

  it('errors include the path to the bad field', () => {
    const data = validData();
    data.routes[1]!.steps[0] = 'ghost';
    expectError(data, 'routes.1.steps.0:');
  });
});
