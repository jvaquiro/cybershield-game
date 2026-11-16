import { useMemo } from 'react';
import type { SubstationData } from '../../data/schema';
import type { RouteResult } from '../../engine/simulation';
import { es } from '../../i18n/es';
import { computeMapLayout, ENTRY_LINE_HEIGHT, wrapText, type Segment } from '../logic/mapLayout';
import { colors, mapGeometry as g } from '../theme';

interface SubstationMapProps {
  data: SubstationData;
  /** When given, the map shows the attack result instead of the plain routes. */
  results?: readonly RouteResult[];
  onAssetTap?: (assetId: string) => void;
}

/** Seconds between two consecutive attack steps in the result animation. */
const STEP_SECONDS = 0.5;

type SegmentState = 'idle' | 'attack' | 'blocked' | 'dim';

const markerColor: Record<Exclude<SegmentState, 'blocked'>, string> = {
  idle: colors.cyan,
  attack: colors.attack,
  dim: colors.dim,
};

function segmentState(segment: Segment, result: RouteResult | undefined): SegmentState {
  if (!result) return 'idle';
  if (result.blockedAt === null || segment.index < result.blockedAt) return 'attack';
  return segment.index === result.blockedAt ? 'blocked' : 'dim';
}

function Shield({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <g className="pop-in" style={{ animationDelay: `${delay}s` }}>
      <circle cx={x} cy={y} r={20} fill={colors.blocked} stroke={colors.navy950} strokeWidth={3} />
      <path
        d={`M ${x - 8} ${y} l 6 6 l 11 -12`}
        fill="none"
        stroke={colors.navy950}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function SegmentView({ segment, state }: { segment: Segment; state: SegmentState }) {
  const { from, to } = segment;
  const delay = segment.index * STEP_SECONDS;

  if (state === 'blocked') {
    // Attack travels half the segment, then hits the green block.
    const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    const half = segment.length / 2;
    return (
      <g>
        <line
          x1={mid.x}
          y1={mid.y}
          x2={to.x}
          y2={to.y}
          stroke={colors.dim}
          strokeWidth={4}
          strokeDasharray="6 8"
        />
        <line
          x1={from.x}
          y1={from.y}
          x2={mid.x}
          y2={mid.y}
          stroke={colors.attack}
          strokeWidth={6}
          className="attack-segment"
          style={{ ['--len' as string]: half, animationDelay: `${delay}s` }}
        />
        <Shield x={mid.x} y={mid.y} delay={delay + 0.3} />
      </g>
    );
  }

  const attack = state === 'attack';
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={markerColor[state]}
      strokeWidth={attack ? 6 : 4}
      strokeDasharray={state === 'dim' ? '6 8' : undefined}
      markerEnd={`url(#arrow-${state})`}
      className={attack ? 'attack-segment' : undefined}
      style={
        attack ? { ['--len' as string]: segment.length, animationDelay: `${delay}s` } : undefined
      }
    />
  );
}

export function SubstationMap({ data, results, onAssetTap }: SubstationMapProps) {
  const layout = useMemo(() => computeMapLayout(data), [data]);
  const resultById = new Map(results?.map((result) => [result.routeId, result]));

  // When each reached asset turns red: the earliest step at which any route reaches it.
  const arrival = new Map<string, number>();
  for (const result of results ?? []) {
    result.reachedAssetIds.forEach((id, step) => {
      const time = (step + 1) * STEP_SECONDS;
      arrival.set(id, Math.min(arrival.get(id) ?? Infinity, time));
    });
  }

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className="h-full w-full"
      role="img"
      aria-label={es.map.ariaLabel}
    >
      <defs>
        {(['idle', 'attack', 'dim'] as const).map((state) => (
          <marker
            key={state}
            id={`arrow-${state}`}
            viewBox="0 0 10 10"
            refX={9}
            refY={5}
            markerWidth={4}
            markerHeight={4}
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={markerColor[state]} />
          </marker>
        ))}
      </defs>

      {layout.bands.map((band, i) => (
        <g key={band.level}>
          <rect
            x={0}
            y={band.top}
            width={layout.width}
            height={g.bandHeight}
            fill={i % 2 === 0 ? colors.navy900 : colors.navy950}
          />
          <text x={12} y={band.top + 24} fill={colors.textMuted} fontSize={g.labelFontSize}>
            {`${es.levelLabel(band.level)} · ${es.levels[band.level]}`}
          </text>
        </g>
      ))}

      {layout.routes.map((routeLayout) => {
        const result = resultById.get(routeLayout.routeId);
        return routeLayout.segments.map((segment) => (
          <SegmentView
            key={`${routeLayout.routeId}-${segment.index}`}
            segment={segment}
            state={segmentState(segment, result)}
          />
        ));
      })}

      {layout.routes.map((routeLayout) => {
        const route = data.routes.find((item) => item.id === routeLayout.routeId)!;
        const { entry } = routeLayout;
        const stroke = results ? colors.attack : colors.cyan;
        const top = entry.y - entry.height / 2;
        return (
          <g key={route.id}>
            <rect
              x={entry.x - entry.width / 2}
              y={top}
              width={entry.width}
              height={entry.height}
              rx={10}
              fill={colors.navy950}
              stroke={stroke}
              strokeWidth={2}
              strokeDasharray="8 4"
            />
            <text textAnchor="middle" fontSize={g.labelFontSize}>
              <tspan
                x={entry.x}
                y={top + 9 + ENTRY_LINE_HEIGHT * 0.8}
                fill={stroke}
                fontWeight={700}
              >
                {route.name}
              </tspan>
              {entry.lines.map((line, i) => (
                <tspan
                  key={i}
                  x={entry.x}
                  y={top + 9 + ENTRY_LINE_HEIGHT * (i + 1.8)}
                  fill={colors.text}
                >
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}

      {data.assets.map((asset) => {
        const box = layout.assets[asset.id]!;
        const reachedAt = arrival.get(asset.id);
        const dimmed = results !== undefined && reachedAt === undefined;
        const lines = wrapText(asset.name, 18);
        const x = box.x - g.cardWidth / 2;
        const y = box.y - g.cardHeight / 2;
        const interactive = onAssetTap !== undefined;
        return (
          <g
            key={asset.id}
            opacity={dimmed ? 0.4 : 1}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? asset.name : undefined}
            onClick={interactive ? () => onAssetTap(asset.id) : undefined}
            onKeyDown={
              interactive
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') onAssetTap(asset.id);
                  }
                : undefined
            }
            style={interactive ? { cursor: 'pointer' } : undefined}
          >
            <rect
              x={x}
              y={y}
              width={g.cardWidth}
              height={g.cardHeight}
              rx={12}
              fill={colors.navy800}
              stroke={dimmed ? colors.dim : colors.cyan}
              strokeWidth={3}
            />
            {reachedAt !== undefined && (
              <rect
                x={x}
                y={y}
                width={g.cardWidth}
                height={g.cardHeight}
                rx={12}
                fill={colors.attack}
                fillOpacity={0.35}
                stroke={colors.attack}
                strokeWidth={4}
                className="pop-in"
                style={{ animationDelay: `${reachedAt}s` }}
              />
            )}
            <text textAnchor="middle" fontSize={g.fontSize} fontWeight={700} fill={colors.text}>
              {lines.map((line, i) => (
                <tspan
                  key={i}
                  x={box.x}
                  y={box.y + g.fontSize * 0.35 + (i - (lines.length - 1) / 2) * g.fontSize * 1.1}
                >
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
