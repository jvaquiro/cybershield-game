import type { SubstationData } from '../../data/schema';
import { es } from '../../i18n/es';
import { Button } from '../components/Button';
import { ScreenLayout } from '../components/ScreenLayout';
import { toggleSelection } from '../logic/selection';

interface DefenseScreenProps {
  data: SubstationData;
  selected: string[];
  onChange: (selected: string[]) => void;
  onBack: () => void;
  onSimulate: () => void;
}

export function DefenseScreen({
  data,
  selected,
  onChange,
  onBack,
  onSimulate,
}: DefenseScreenProps) {
  const t = es.defense;
  const budget = data.defenderBudget;
  const complete = selected.length === budget;
  const routeName = new Map(data.routes.map((route) => [route.id, route.name]));

  return (
    <ScreenLayout
      title={t.title}
      hint={`${t.hint(budget)} · ${t.selected(selected.length, budget)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onBack}>
            {t.back}
          </Button>
          <Button onClick={onSimulate} disabled={!complete}>
            {t.simulate}
          </Button>
        </>
      }
    >
      <div className="grid h-full grid-cols-2 gap-4 overflow-y-auto">
        {data.controls.map((control) => {
          const isSelected = selected.includes(control.id);
          // At full budget (and budget > 1), unselected cards are locked until one is removed.
          const locked = !isSelected && complete && budget > 1;
          const protectedRoutes = [...new Set(control.blocks.map((block) => block.routeId))];
          return (
            <button
              key={control.id}
              type="button"
              aria-pressed={isSelected}
              disabled={locked}
              onClick={() => onChange(toggleSelection(selected, control.id, budget))}
              className={`flex min-h-32 flex-col items-start justify-center gap-2 rounded-2xl border-4 p-5 text-left transition ${
                isSelected
                  ? 'border-blocked bg-navy-800'
                  : 'border-navy-700 bg-navy-900 active:bg-navy-800'
              } disabled:opacity-50`}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span className="text-2xl font-bold">{control.name}</span>
                <span
                  aria-hidden="true"
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full border-4 text-xl font-bold ${
                    isSelected ? 'border-blocked bg-blocked text-navy-950' : 'border-navy-700'
                  }`}
                >
                  {isSelected ? '✓' : ''}
                </span>
              </span>
              <span className="text-lg text-text-muted">{control.description}</span>
              <span className="flex flex-wrap gap-2">
                {protectedRoutes.map((routeId) => (
                  <span
                    key={routeId}
                    className="rounded-full border-2 border-cyan-accent px-3 text-cyan-accent"
                  >
                    {`${t.protects}: ${routeName.get(routeId) ?? routeId}`}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </ScreenLayout>
  );
}
