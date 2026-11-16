import { es } from '../../i18n/es';
import { Button } from '../components/Button';
import { SKYLINE_HEIGHT, SKYLINE_WIDTH, Skyline } from '../components/CityLights';
import { colors } from '../theme';

interface StartScreenProps {
  /** Substation name from subestacion.json, shown under its symbol. */
  stationName: string;
  onStart: () => void;
}

// Single-line diagram geometry (viewBox units).
const VIEW_W = 1320;
const VIEW_H = 250;
const LINE_Y = 96;
const CITY_X = VIEW_W - SKYLINE_WIDTH - 24;
const CITY_Y = 190 - SKYLINE_HEIGHT;

/**
 * Single-line diagram, as drawn on a substation mimic board: grid feed, transformer and
 * closed breaker, then the line that carries power to the city.
 */
function PowerDiagram({ stationName }: { stationName: string }) {
  const stroke = { stroke: colors.cyan, strokeWidth: 4, fill: 'none' } as const;
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="w-full"
      role="img"
      aria-label={es.start.diagramAria}
    >
      {/* Feed from the transmission grid */}
      <line x1={0} y1={LINE_Y} x2={120} y2={LINE_Y} {...stroke} strokeOpacity={0.5} />
      {/* Two-winding transformer */}
      <circle cx={156} cy={LINE_Y} r={36} {...stroke} />
      <circle cx={204} cy={LINE_Y} r={36} {...stroke} />
      <line x1={240} y1={LINE_Y} x2={300} y2={LINE_Y} {...stroke} />
      {/* Closed breaker (filled square) */}
      <rect x={300} y={LINE_Y - 20} width={40} height={40} fill={colors.cyan} />
      {/* Line to the city, then down into the skyline */}
      <path
        d={`M 340 ${LINE_Y} H ${CITY_X - 48} V ${CITY_Y + SKYLINE_HEIGHT - 1} H ${CITY_X - 20}`}
        {...stroke}
        strokeLinejoin="round"
      />
      <path
        d={`M 340 ${LINE_Y} H ${CITY_X - 48} V ${CITY_Y + SKYLINE_HEIGHT - 1} H ${CITY_X - 20}`}
        fill="none"
        stroke={colors.cityLight}
        strokeWidth={6}
        strokeLinecap="round"
        className="power-flow"
      />
      <text x={180} y={LINE_Y + 82} textAnchor="middle" fill={colors.textMuted} fontSize={22}>
        {stationName}
      </text>
      <g transform={`translate(${CITY_X} ${CITY_Y})`}>
        <Skyline onPercent={100} />
      </g>
      <text
        x={CITY_X + SKYLINE_WIDTH / 2}
        y={CITY_Y + SKYLINE_HEIGHT + 34}
        textAnchor="middle"
        fill={colors.textMuted}
        fontSize={22}
      >
        {es.start.city}
      </text>
    </svg>
  );
}

export function StartScreen({ stationName, onStart }: StartScreenProps) {
  return (
    <main className="flex h-dvh flex-col justify-between px-12 pt-14 pb-20">
      <div className="flex max-w-4xl flex-col items-start gap-6">
        <h1 className="text-[9rem] leading-[0.85] tracking-tight text-cyan-accent">
          {es.appTitle}
        </h1>
        <p className="max-w-2xl text-4xl leading-tight text-balance">{es.start.subtitle}</p>
        <Button onClick={onStart} className="mt-4 min-h-16 min-w-72 text-3xl">
          {es.start.begin}
        </Button>
      </div>
      <PowerDiagram stationName={stationName} />
    </main>
  );
}
