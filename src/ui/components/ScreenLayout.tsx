import type { ReactNode } from 'react';

interface ScreenLayoutProps {
  title: string;
  hint?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Full-viewport screen: title row, flexible content, footer with actions. */
export function ScreenLayout({ title, hint, children, footer }: ScreenLayoutProps) {
  return (
    <main className="flex h-dvh flex-col gap-3 px-6 py-4">
      <header className="flex flex-wrap items-baseline gap-x-4 pr-44">
        <h1 className="text-2xl font-bold text-cyan-accent">{title}</h1>
        {hint && <p className="text-text-muted">{hint}</p>}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
      {footer && <footer className="flex flex-wrap justify-end gap-4">{footer}</footer>}
    </main>
  );
}
