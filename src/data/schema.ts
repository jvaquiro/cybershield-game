import { z } from 'zod';
import { es } from '../i18n/es';

const msg = es.schemaErrors;

export const purdueLevelSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

const scoreSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

const nonEmpty = z.string().trim().min(1, msg.emptyText);

export const assetSchema = z.object({
  id: nonEmpty,
  name: nonEmpty,
  level: purdueLevelSchema,
  protocol: nonEmpty,
  // Risk matrix validated by the electrical team (scale 1–4 used; schema allows 1–5).
  probability: scoreSchema,
  impact: scoreSchema,
  description: nonEmpty,
});

export const routeSchema = z.object({
  id: nonEmpty,
  name: nonEmpty,
  entry: nonEmpty,
  steps: z.array(nonEmpty).min(1, msg.emptySteps),
});

export const blockSchema = z.object({
  routeId: nonEmpty,
  // The attacker is stopped BEFORE reaching route.steps[stepIndex]. 0 = stopped at the entry point.
  stepIndex: z.int().nonnegative(),
});

export const controlSchema = z.object({
  id: nonEmpty,
  name: nonEmpty,
  description: nonEmpty,
  blocks: z.array(blockSchema).min(1, msg.emptyBlocks),
});

export const outcomeSchema = z.object({
  level: purdueLevelSchema,
  // TODO(electrical-team): cityOffPercent values are placeholders.
  cityOffPercent: z.number().min(0).max(100),
});

function findDuplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  return [...dupes];
}

export const substationDataSchema = z
  .object({
    // Metadata for the team; JSON has no comments, so pending items are listed in _todo.
    _status: z.string().optional(),
    _todo: z.array(z.string()).optional(),
    name: nonEmpty,
    assets: z.array(assetSchema).min(1),
    routes: z.array(routeSchema).min(1),
    controls: z.array(controlSchema).min(1),
    outcomes: z.array(outcomeSchema).min(1),
    defenderBudget: z.int().positive(),
  })
  .superRefine((data, ctx) => {
    for (const [key, items] of [
      ['assets', data.assets],
      ['routes', data.routes],
      ['controls', data.controls],
    ] as const) {
      for (const id of findDuplicates(items.map((item) => item.id))) {
        ctx.addIssue({ code: 'custom', path: [key], message: msg.duplicateId(key, id) });
      }
    }

    const assetsById = new Map(data.assets.map((asset) => [asset.id, asset]));
    const routesById = new Map(data.routes.map((route) => [route.id, route]));

    data.routes.forEach((route, routeIndex) => {
      route.steps.forEach((assetId, stepIndex) => {
        if (!assetsById.has(assetId)) {
          ctx.addIssue({
            code: 'custom',
            path: ['routes', routeIndex, 'steps', stepIndex],
            message: msg.unknownAsset(route.id, assetId),
          });
        }
      });
    });

    data.controls.forEach((control, controlIndex) => {
      control.blocks.forEach((block, blockIndex) => {
        const path = ['controls', controlIndex, 'blocks', blockIndex];
        const route = routesById.get(block.routeId);
        if (!route) {
          ctx.addIssue({
            code: 'custom',
            path: [...path, 'routeId'],
            message: msg.unknownRoute(control.id, block.routeId),
          });
        } else if (block.stepIndex >= route.steps.length) {
          ctx.addIssue({
            code: 'custom',
            path: [...path, 'stepIndex'],
            message: msg.invalidStepIndex(
              control.id,
              route.id,
              block.stepIndex,
              route.steps.length,
            ),
          });
        }
      });
    });

    const outcomeLevels = data.outcomes.map((outcome) => outcome.level);
    for (const level of findDuplicates(outcomeLevels.map(String))) {
      ctx.addIssue({ code: 'custom', path: ['outcomes'], message: msg.duplicateOutcome(level) });
    }

    const usedLevels = new Set<number>();
    for (const route of data.routes) {
      for (const assetId of route.steps) {
        const asset = assetsById.get(assetId);
        if (asset) usedLevels.add(asset.level);
      }
    }
    const coveredLevels = new Set<number>(outcomeLevels);
    for (const level of [...usedLevels].sort()) {
      if (!coveredLevels.has(level)) {
        ctx.addIssue({ code: 'custom', path: ['outcomes'], message: msg.missingOutcome(level) });
      }
    }

    if (data.defenderBudget > data.controls.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['defenderBudget'],
        message: msg.budgetTooLarge(data.defenderBudget, data.controls.length),
      });
    }
  });

export type PurdueLevel = z.infer<typeof purdueLevelSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type Route = z.infer<typeof routeSchema>;
export type Block = z.infer<typeof blockSchema>;
export type Control = z.infer<typeof controlSchema>;
export type Outcome = z.infer<typeof outcomeSchema>;
export type SubstationData = z.infer<typeof substationDataSchema>;

export type ParseResult = { ok: true; data: SubstationData } | { ok: false; errors: string[] };

/** Validates raw substation data and returns readable errors ("path: message") on failure. */
export function parseSubstationData(input: unknown): ParseResult {
  const result = substationDataSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    errors: result.error.issues.map((issue) =>
      issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
    ),
  };
}

/** True while the data is still marked as placeholder (shows the "Datos de prueba" badge). */
export function isPlaceholder(data: SubstationData): boolean {
  return data._status !== undefined;
}
