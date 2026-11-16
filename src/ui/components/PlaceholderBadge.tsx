import { es } from '../../i18n/es';

/** Fixed badge shown on every screen while subestacion.json has "_status". */
export function PlaceholderBadge() {
  return (
    <div
      role="status"
      className="pointer-events-none fixed top-3 right-3 z-50 rounded-full border-2 border-city-light bg-navy-950/90 px-4 py-1 font-bold text-city-light"
    >
      {es.placeholderBadge}
    </div>
  );
}
