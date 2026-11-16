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
  return (
    <span className={result.blockingControlId ? 'text-blocked' : 'text-attack'}>
      {result.blockingControlId ? t.stoppedBy(controlName) : t.notStopped}
    </span>
  );
}

/**
 * Two views so the map keeps readable text: first the attack on a full-size map, then the
 * numbers (risk, city lights, recommendation).
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
        hint={t.attackHint}
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
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-1">
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
      <div className="grid h-full grid-cols-2 gap-6 overflow-y-auto">
        <div className="flex flex-col gap-3">
          <section className="rounded-xl bg-navy-900 px-5 py-2">
            <p className="text-text-muted">{t.totalRisk}</p>
            <p className="text-4xl font-bold">
              <span>{r.risk.before}</span>
              <span className="text-text-muted">{' → '}</span>
              <span className="text-attack">{r.risk.after}</span>
            </p>
            <p className="text-2xl font-bold text-blocked">
              {t.reduction(r.risk.reduction, r.risk.percent)}
            </p>
          </section>

          <table className="w-full border-separate border-spacing-y-1 text-left">
            <thead className="text-text-muted">
              <tr>
                <th className="px-3 font-normal">{t.route}</th>
                <th className="px-3 text-right font-normal">{t.before}</th>
                <th className="px-3 text-right font-normal">{t.after}</th>
              </tr>
            </thead>
            <tbody>
              {r.rows.map(({ route, result, before, after }) => (
                <tr key={route.id} className="bg-navy-900">
                  <td className="rounded-l-lg px-3 py-2">
                    <span className="block font-bold">{route.name}</span>
                    <RouteStatus
                      result={result}
                      controlName={r.controlName(result.blockingControlId)}
                    />
                  </td>
                  <td className="px-3 text-right text-2xl">{before}</td>
                  <td className="rounded-r-lg px-3 text-right text-2xl font-bold text-attack">
                    {after}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <section
            className={`rounded-xl border-2 px-5 py-3 ${matches ? 'border-blocked' : 'border-cyan-accent'}`}
          >
            <p className="text-text-muted">{t.recommendation}</p>
            <p className="text-2xl font-bold text-cyan-accent">{r.recNames}</p>
            {!matches && <p className="text-text-muted">{`${t.yourChoice}: ${r.userNames}`}</p>}
            <p className={`mt-2 text-xl ${matches ? 'font-bold text-blocked' : ''}`}>
              {verdictText(r.comparison, r.recNames)}
            </p>
          </section>
        </div>

        <div className="flex flex-col gap-3">
          {r.rows.map(({ route, cityOn }) => (
            <section key={route.id} className="rounded-xl bg-navy-900 px-4 py-2">
              <p>
                <span className="font-bold">{`${route.name}: `}</span>
                <span className="text-text-muted">{t.cityScenario(route.entry)}</span>
              </p>
              <CityLights onPercent={cityOn} heightClass="h-16" />
            </section>
          ))}
        </div>
      </div>
    </ScreenLayout>
  );
}
