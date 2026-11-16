import { es } from '../../i18n/es';
import { Button } from '../components/Button';
import { CityLights } from '../components/CityLights';

export function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <h1 className="text-7xl font-bold tracking-tight text-cyan-accent">{es.appTitle}</h1>
      <p className="max-w-3xl text-3xl">{es.start.subtitle}</p>
      <div className="w-full max-w-xl" aria-hidden="true">
        <CityLights onPercent={100} />
      </div>
      <Button onClick={onStart} className="min-w-64 text-2xl">
        {es.start.begin}
      </Button>
    </main>
  );
}
