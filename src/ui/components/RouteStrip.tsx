import { Fragment } from 'react';
import type { Asset, Route } from '../../data/schema';
import { es } from '../../i18n/es';

interface RouteStripProps {
  route: Route;
  assets: readonly Asset[];
  /** The attacker is stopped before route.steps[stepIndex]. */
  stepIndex: number;
}

/**
 * One route as a row of asset chips with a green barrier where the control stops the attack:
 * assets before it are reached (red), assets after it are saved (green).
 * Built from spans only, because it sits inside a <button>.
 */
export function RouteStrip({ route, assets, stepIndex }: RouteStripProps) {
  const t = es.defense;
  const nameOf = new Map(assets.map((asset) => [asset.id, asset.name]));
  const saved = route.steps.length - stepIndex;
  const barrier = (
    <span aria-hidden="true" className="h-8 w-1.5 shrink-0 rounded-full bg-blocked" />
  );

  return (
    <span className="flex flex-col gap-1.5">
      <span className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-bold">{route.name}</span>
        <span className="font-bold text-blocked">{t.savedAssets(saved, route.steps.length)}</span>
        {/* The barrier is visual only; this sentence carries the same fact for screen readers. */}
        <span className="sr-only">
          {stepIndex === 0
            ? t.stopsAtEntry
            : t.stopsBefore(nameOf.get(route.steps[stepIndex]!) ?? '')}
        </span>
      </span>
      <span
        role="list"
        aria-label={t.stripAria(route.name)}
        className="flex flex-wrap items-center gap-x-1 gap-y-1.5"
      >
        {route.steps.map((assetId, i) => {
          const reached = i < stepIndex;
          return (
            <Fragment key={`${assetId}-${i}`}>
              {i === stepIndex && barrier}
              {i > 0 && i !== stepIndex && (
                <span aria-hidden="true" className="text-dim">
                  ›
                </span>
              )}
              <span
                role="listitem"
                className={`rounded-sm border-2 px-1.5 leading-7 whitespace-nowrap ${
                  reached
                    ? 'border-attack/70 bg-attack/15 text-text'
                    : 'border-blocked/60 text-blocked'
                }`}
              >
                {nameOf.get(assetId) ?? assetId}
              </span>
            </Fragment>
          );
        })}
      </span>
    </span>
  );
}
