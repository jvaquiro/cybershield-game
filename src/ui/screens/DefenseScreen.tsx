import type { SubstationData } from '../../data/schema';
import { es } from '../../i18n/es';
import { Button } from '../components/Button';
import { RouteStrip } from '../components/RouteStrip';
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
  const routeById = new Map(data.routes.map((route) => [route.id, route]));

  return (
    <ScreenLayout
      title={t.title}
      step={1}
      hint={
        <span className="flex items-baseline gap-3">
          {t.hint(budget)}
          <span
            aria-label={t.selectedAria(selected.length, budget)}
            className={`rounded-sm border-2 px-2 font-bold ${
              complete ? 'border-blocked text-blocked' : 'border-navy-700 text-text'
            }`}
          >
            {t.selected(selected.length, budget)}
          </span>
        </span>
      }
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
      <div className="grid h-full auto-rows-fr grid-cols-2 gap-4 overflow-y-auto">
        {data.controls.map((control) => {
          const isSelected = selected.includes(control.id);
          // At full budget (and budget > 1), unselected cards are locked until one is removed.
          const locked = !isSelected && complete && budget > 1;
          return (
            <button
              key={control.id}
              type="button"
              aria-pressed={isSelected}
              disabled={locked}
              onClick={() => onChange(toggleSelection(selected, control.id, budget))}
              className={`relative flex flex-col items-start gap-2 rounded-md border-2 px-5 py-4 text-left transition ${
                isSelected
                  ? 'border-blocked bg-navy-800 shadow-[inset_6px_0_0_var(--color-blocked)]'
                  : 'border-navy-700 bg-navy-900/90 active:bg-navy-800'
              } disabled:opacity-50`}
            >
              <span className="flex w-full items-start justify-between gap-3">
                <span className="font-display text-3xl leading-none">{control.name}</span>
                <span
                  aria-hidden="true"
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-2xl font-bold ${
                    isSelected ? 'border-blocked bg-blocked text-navy-950' : 'border-navy-700'
                  }`}
                >
                  {isSelected ? '✓' : ''}
                </span>
              </span>
              <span className="text-lg leading-snug text-text-muted">{control.description}</span>
              <span className="mt-auto flex w-full flex-col gap-3">
                {control.blocks.map((block) => {
                  const route = routeById.get(block.routeId);
                  return route ? (
                    <RouteStrip
                      key={`${block.routeId}-${block.stepIndex}`}
                      route={route}
                      assets={data.assets}
                      stepIndex={block.stepIndex}
                    />
                  ) : null;
                })}
              </span>
            </button>
          );
        })}
      </div>
    </ScreenLayout>
  );
}
