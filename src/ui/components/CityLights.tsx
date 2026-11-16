import { useId } from 'react';
import { es } from '../../i18n/es';
import { colors } from '../theme';

interface CityLightsProps {
  /** Percentage of the city that keeps power (0–100). */
  onPercent: number;
  /** Tailwind height class for the skyline. */
  heightClass?: string;
  /** Hide the "Ciudad encendida" caption (when the screen shows it elsewhere). */
  caption?: boolean;
}

// Fixed skyline: [height, window columns] per building. Purely decorative.
const BUILDINGS: [number, number][] = [
  [70, 2],
  [100, 3],
  [55, 2],
  [120, 3],
  [85, 2],
  [65, 3],
  [110, 2],
  [75, 3],
  [95, 2],
  [60, 2],
];
const WIDTH = 44;
const GAP = 8;
export const SKYLINE_HEIGHT = 124;
export const SKYLINE_WIDTH = BUILDINGS.length * (WIDTH + GAP) - GAP;

/**
 * Buildings as an SVG group, drawn with the baseline at y = SKYLINE_HEIGHT.
 * The share of lit buildings follows onPercent; lit ones sit in a warm halo.
 */
export function Skyline({ onPercent }: { onPercent: number }) {
  const glowId = useId();
  const lit = Math.round((onPercent / 100) * BUILDINGS.length);
  const litWidth = lit * (WIDTH + GAP) - GAP;
  return (
    <g>
      <defs>
        <radialGradient id={glowId} cx="50%" cy="100%" r="75%">
          <stop offset="0%" stopColor={colors.cityLight} stopOpacity={0.32} />
          <stop offset="100%" stopColor={colors.cityLight} stopOpacity={0} />
        </radialGradient>
      </defs>
      {lit > 0 && (
        <rect
          x={-20}
          y={0}
          width={litWidth + 40}
          height={SKYLINE_HEIGHT}
          fill={`url(#${glowId})`}
        />
      )}
      {BUILDINGS.map(([height, columns], i) => {
        const on = i < lit;
        const x = i * (WIDTH + GAP);
        const top = SKYLINE_HEIGHT - height;
        const windows = [];
        for (let row = top + 10; row < SKYLINE_HEIGHT - 12; row += 16) {
          for (let col = 0; col < columns; col++) {
            const step = WIDTH / columns;
            windows.push(
              <rect
                key={`${row}-${col}`}
                x={x + col * step + step / 2 - 4}
                y={row}
                width={8}
                height={8}
                fill={on ? colors.cityLight : colors.cityOff}
              />,
            );
          }
        }
        return (
          <g key={i}>
            <rect
              x={x}
              y={top}
              width={WIDTH}
              height={height}
              fill={on ? colors.navy800 : colors.navy950}
              stroke={on ? colors.cityLight : colors.dim}
              strokeOpacity={on ? 0.55 : 0.5}
            />
            {windows}
          </g>
        );
      })}
      <line
        x1={-20}
        x2={SKYLINE_WIDTH + 20}
        y1={SKYLINE_HEIGHT - 0.5}
        y2={SKYLINE_HEIGHT - 0.5}
        stroke={colors.dim}
      />
    </g>
  );
}

/** Row of buildings with an optional caption; the share of lit buildings follows onPercent. */
export function CityLights({ onPercent, heightClass = 'h-24', caption = true }: CityLightsProps) {
  return (
    <figure className="flex flex-col gap-1">
      <svg
        viewBox={`-20 0 ${SKYLINE_WIDTH + 40} ${SKYLINE_HEIGHT}`}
        className={`${heightClass} w-full`}
        role="img"
        aria-label={es.result.cityAria(onPercent)}
      >
        <Skyline onPercent={onPercent} />
      </svg>
      {caption && (
        <figcaption
          className={`text-xl font-bold ${onPercent > 0 ? 'text-city-light' : 'text-text-muted'}`}
        >
          {es.result.cityOn(onPercent)}
        </figcaption>
      )}
    </figure>
  );
}
