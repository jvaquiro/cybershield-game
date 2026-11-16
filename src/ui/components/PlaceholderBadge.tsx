import { es } from '../../i18n/es';

/**
 * Fixed badge shown on every screen while subestacion.json has "_status".
 * Styled as an amber caution plate; sits bottom-left, away from titles and actions.
 */
export function PlaceholderBadge() {
  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-sm border-2 border-city-light bg-navy-950 py-1 pr-4 pl-1 font-bold text-city-light"
    >
      <span
        aria-hidden="true"
        className="h-7 w-7 rounded-xs bg-[repeating-linear-gradient(-45deg,var(--color-city-light)_0_5px,var(--color-navy-950)_5px_10px)]"
      />
      {es.placeholderBadge}
    </div>
  );
}
