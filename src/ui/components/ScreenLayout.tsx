import type { ReactNode } from 'react';
import { es } from '../../i18n/es';

interface ScreenLayoutProps {
  title: string;
  hint?: ReactNode;
  /** Index into es.steps of the current step (the flow is a real sequence). */
  step?: number;
  children: ReactNode;
  footer?: ReactNode;
}

function StepIndicator({ current }: { current: number }) {
  return (
    <ol aria-label={es.stepsAria} className="flex items-center gap-2">
      {es.steps.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li
            key={label}
            aria-current={state === 'current' ? 'step' : undefined}
            className="flex items-center gap-2"
          >
            {i > 0 && (
              <span
                aria-hidden="true"
                className={`h-0.5 w-6 ${i <= current ? 'bg-cyan-accent' : 'bg-navy-700'}`}
              />
            )}
            <span
              aria-hidden="true"
              className={`flex size-8 items-center justify-center rounded-full border-2 font-bold ${
                state === 'todo'
                  ? 'border-navy-700 text-dim'
                  : state === 'current'
                    ? 'border-cyan-accent bg-cyan-accent text-navy-950'
                    : 'border-cyan-accent text-cyan-accent'
              }`}
            >
              {state === 'done' ? '✓' : i + 1}
            </span>
            <span className={state === 'current' ? 'font-bold text-text' : 'text-text-muted'}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Full-viewport screen: title row, flexible content, footer with actions. */
export function ScreenLayout({ title, hint, step, children, footer }: ScreenLayoutProps) {
  return (
    <main className="flex h-dvh flex-col gap-3 px-6 pt-4 pb-4">
      <header className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-b border-navy-700 pb-3">
        <div className="flex flex-wrap items-baseline gap-x-5">
          <h1 className="text-4xl leading-none text-cyan-accent">{title}</h1>
          {hint && <div className="text-text-muted">{hint}</div>}
        </div>
        {step !== undefined && <StepIndicator current={step} />}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
      {/* Left padding keeps the actions clear of the placeholder badge. */}
      {footer && <footer className="flex flex-wrap justify-end gap-4 pl-56">{footer}</footer>}
    </main>
  );
}
