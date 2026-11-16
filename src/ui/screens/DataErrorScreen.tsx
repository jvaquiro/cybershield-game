import { es } from '../../i18n/es';

/** Shown instead of the game when subestacion.json fails validation. */
export function DataErrorScreen({ errors }: { errors: string[] }) {
  return (
    <main className="flex h-dvh flex-col gap-4 overflow-y-auto px-6 py-6">
      <h1 className="text-3xl font-bold text-attack">{es.dataError.title}</h1>
      <p className="text-text-muted">{es.dataError.hint}</p>
      <ul className="flex flex-col gap-2">
        {errors.map((error, i) => (
          <li
            key={i}
            className="rounded-lg border-l-4 border-attack bg-navy-900 px-4 py-2 font-mono"
          >
            {error}
          </li>
        ))}
      </ul>
    </main>
  );
}
