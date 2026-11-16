import { es } from '../../i18n/es';
import { colors } from '../theme';

interface CityLightsProps {
  /** Percentage of the city that keeps power (0–100). */
  onPercent: number;
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
const HEIGHT = 124;

/** Row of buildings; the share of lit buildings follows onPercent. */
export function CityLights({ onPercent }: CityLightsProps) {
  const lit = Math.round((onPercent / 100) * BUILDINGS.length);
  return (
    <figure className="flex flex-col gap-1">
      <svg
        viewBox={`0 0 ${BUILDINGS.length * (WIDTH + GAP)} ${HEIGHT}`}
        className="h-24 w-full"
        role="img"
        aria-label={es.result.cityAria(onPercent)}
      >
        {BUILDINGS.map(([height, columns], i) => {
          const on = i < lit;
          const x = i * (WIDTH + GAP);
          const top = HEIGHT - height;
          const windows = [];
          for (let row = top + 10; row < HEIGHT - 12; row += 16) {
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
                fill={on ? colors.navy700 : colors.navy900}
                stroke={on ? colors.cityLight : colors.dim}
                strokeOpacity={on ? 0.5 : 0.6}
              />
              {windows}
            </g>
          );
        })}
      </svg>
      <figcaption
        className={`text-xl font-bold ${onPercent > 0 ? 'text-city-light' : 'text-text-muted'}`}
      >
        {es.result.cityOn(onPercent)}
      </figcaption>
    </figure>
  );
}
