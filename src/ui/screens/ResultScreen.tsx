import { useMemo, useState } from 'react';
import type { SubstationData } from '../../data/schema';
import { cityOffPercent, riskReduction, routeRisk } from '../../engine/risk';
import { selectControls, simulate, type RouteResult } from '../../engine/simulation';
import { es } from '../../i18n/es';
import { Button } from '../components/Button';
import { CityLights } from '../components/CityLights';
import { ScreenLayout } from '../components/ScreenLayout';
import { SubstationMap } from '../components/SubstationMap';
import { compareChoice, type Comparison } from '../logic/compareChoice';

interface ResultScreenProps {
  data: SubstationData;
  selected: string[];
  onRetry: () => void;
  onHome: () => void;
}

function verdictText(comparison: Comparison, recName: string): string {
  const t = es.result;
  switch (comparison.verdict) {
    case 'match':
      return t.match;
    case 'equivalent':
      return t.equivalent;
    case 'lowerRisk':
      return t.whyLowerRisk(recName, comparison.recommendation.totalRisk, comparison.userRisk);
    case 'moreRoutes':
      return t.whyMoreRoutes(recName);
    case 'earlier':
      return t.whyEarlier(recName);
  }
}

function RouteStatus({ result, controlName }: { result: RouteResult; controlName: string }) {
  const t = es.result;
  const blocked = result.blockingControlId !== null;
  return (
    <span className={`inline-flex items-center gap-2 ${blocked ? 'text-blocked' : 'text-attack'}`}>
      <span
        aria-hidden="true"
        className={`size-3 rounded-full ${blocked ? 'bg-blocked' : 'bg-attack'}`}
      />
      {blocked ? t.stoppedBy(controlName) : t.notStopped}
    </span>
  );
}

function Legend() {
  const t = es.result;
  return (
    <span className="flex flex-wrap items-center gap-x-5">
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-4 w-7 rounded-xs border-2 border-attack bg-attack/40"
        />
        {t.legendReached}
      </span>
      <span className="inline-flex items-center gap-2">
        <span aria-hidden="true" className="size-5 rounded-full bg-blocked" />
        {t.legendBlocked}
      </span>
    </span>
  );
}

/** Horizontal meter: full width is the risk before; red is what remains, green what was removed. */
function RiskMeter({ before, after }: { before: number; after: number }) {
  const afterPct = before === 0 ? 0 : (after / before) * 100;
  return (
    <div
      role="img"
      aria-label={es.result.riskMeterAria(before, after)}
      className="flex h-6 w-full overflow-hidden rounded-xs border border-navy-700"
    >
      <div className="h-full bg-attack" style={{ width: `${afterPct}%` }} />
      <div className="h-full flex-1 bg-[repeating-linear-gradient(-45deg,var(--color-blocked)_0_6px,transparent_6px_12px)] opacity-70" />
    </div>
  );
}

/**
 * Two views so the map keeps readable text: first the attack on a full-size map, then the
 * outcome (city per route, risk, recommendation).
 */
export function ResultScreen({ data, selected, onRetry, onHome }: ResultScreenProps) {
  const t = es.result;
  const [view, setView] = useState<'attack' | 'risk'>('attack');

  const r = useMemo(() => {
    const controls = selectControls(data, selected);
    const results = simulate(data, selected);
    const controlName = new Map(data.controls.map((control) => [control.id, control.name]));
    const names = (ids: readonly string[]) =>
      ids.map((id) => controlName.get(id) ?? id).join(' + ');
    const comparison = compareChoice(data, selected);
    const cityOff = cityOffPercent(data, selected);
    return {
      results,
      rows: data.routes.map((route, i) => ({
        route,
        result: results[i]!,
        before: routeRisk(route, [], data.assets),
        after: routeRisk(route, controls, data.assets),
        cityOn: 100 - cityOff[i]!.cityOffPercent,
      })),
      risk: riskReduction(data, selected),
      comparison,
      userNames: names(selected),
      recNames: names(comparison.recommendation.controlIds),
      controlName: (id: string | null) => (id ? (controlName.get(id) ?? id) : ''),
    };
  }, [data, selected]);

  if (view === 'attack') {
    return (
      <ScreenLayout
        title={t.attackTitle}
        hint={<Legend />}
        step={2}
        footer={
          <>
            <Button variant="secondary" onClick={onRetry}>
              {t.retry}
            </Button>
            <Button onClick={() => setView('risk')}>{t.showRisk}</Button>
          </>
        }
      >
        <div className="flex h-full flex-col gap-2">
          <div className="min-h-0 flex-1">
            <SubstationMap data={data} results={r.results} />
          </div>
          <ul className="flex flex-wrap justify-center gap-x-10 gap-y-1 text-xl">
            {r.rows.map(({ route, result }) => (
              <li key={route.id}>
                <span className="font-bold">{`${route.name}: `}</span>
                <RouteStatus
                  result={result}
                  controlName={r.controlName(result.blockingControlId)}
                />
              </li>
            ))}
          </ul>
        </div>
      </ScreenLayout>
    );
  }

  const matches = r.comparison.verdict === 'match' || r.comparison.verdict === 'equivalent';

  return (
    <ScreenLayout
      title={t.title}
      step={2}
      footer={
        <>
          <Button variant="secondary" onClick={() => setView('attack')}>
            {t.showAttack}
          </Button>
          <Button variant="secondary" onClick={onHome}>
            {t.home}
          </Button>
          <Button onClick={onRetry}>{t.retry}</Button>
        </>
      }
    >
      <div className="flex h-full flex-col gap-4 overflow-y-auto">
        {/* One city per route: each route is a separate attack scenario. */}
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${r.rows.length}, minmax(0, 1fr))` }}
        >
          {r.rows.map(({ route, result, before, after, cityOn }) => (
            <section
              key={route.id}
              className="flex flex-col gap-1 rounded-md border border-navy-700 bg-navy-900/90 px-5 pt-3 pb-4"
            >
              <h2 className="text-3xl leading-tight">{route.name}</h2>
              <p className="text-text-muted">{t.cityScenario(route.entry)}</p>
              <CityLights onPercent={cityOn} heightClass="h-28" caption={false} />
              <div className="flex flex-wrap items-end justify-between gap-x-4">
                <p
                  className={`font-display text-4xl ${cityOn > 0 ? 'text-city-light' : 'text-text-muted'}`}
                >
                  {t.cityOn(cityOn)}
                </p>
                <p className="text-text-muted">
                  {`${t.routeRisk}: `}
                  <span className="font-bold text-text">{before}</span>
                  {' → '}
                  <span className="font-bold text-attack">{after}</span>
                </p>
              </div>
              <RouteStatus result={result} controlName={r.controlName(result.blockingControlId)} />
            </section>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-2 gap-4">
          <section className="flex flex-col justify-center gap-2 rounded-md border border-navy-700 bg-navy-900/90 px-5 py-3">
            <h2 className="text-2xl text-text-muted">{t.totalRisk}</h2>
            <p className="font-display text-6xl leading-none">
              <span>{r.risk.before}</span>
              <span className="text-text-muted">{' → '}</span>
              <span className="text-attack">{r.risk.after}</span>
            </p>
            <RiskMeter before={r.risk.before} after={r.risk.after} />
            <p className="text-2xl font-bold text-blocked">
              {t.reduction(r.risk.reduction, r.risk.percent)}
            </p>
          </section>

          <section
            className={`flex flex-col justify-center gap-1 rounded-md border-2 px-5 py-3 ${
              matches ? 'border-blocked bg-blocked/10' : 'border-cyan-accent bg-navy-900/90'
            }`}
          >
            <h2 className="text-2xl text-text-muted">{t.recommendation}</h2>
            <p className="font-display text-4xl text-cyan-accent">{r.recNames}</p>
            {!matches && <p className="text-text-muted">{`${t.yourChoice}: ${r.userNames}`}</p>}
            <p className={`mt-1 text-xl ${matches ? 'font-bold text-blocked' : ''}`}>
              {verdictText(r.comparison, r.recNames)}
            </p>
          </section>
        </div>
      </div>
    </ScreenLayout>
  );
}
