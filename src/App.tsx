import { es } from './i18n/es';

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-navy-950 p-8">
      <h1 className="text-5xl font-bold text-cyan-accent">{es.appTitle}</h1>
      <p className="text-xl">{es.appSubtitle}</p>
      <p className="text-blocked">{es.setupReady}</p>
    </main>
  );
}
