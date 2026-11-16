import type { PurdueLevel, SubstationData } from '../../data/schema';
import { mapGeometry as g } from '../theme';

export const LEVELS: PurdueLevel[] = [4, 3, 2, 1, 0];

export interface Point {
  x: number;
  y: number;
}

export interface Band {
  level: PurdueLevel;
  top: number;
}

export interface AssetBox {
  id: string;
  /** Center of the card. */
  x: number;
  y: number;
}

export interface EntryBox {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Entry text wrapped for SVG; the route name is drawn above it. */
  lines: string[];
}

export interface Segment {
  /** Segment k leads INTO route.steps[k]; segment 0 starts at the entry point. */
  index: number;
  from: Point;
  to: Point;
  length: number;
}

export interface RouteLayout {
  routeId: string;
  entry: EntryBox;
  segments: Segment[];
}

export interface MapLayout {
  width: number;
  height: number;
  bands: Band[];
  assets: Record<string, AssetBox>;
  routes: RouteLayout[];
}

const ENTRY_LINE_CHARS = 19;
export const ENTRY_LINE_HEIGHT = 24;
const SIDE_MARGIN = 8;
const ENTRY_GAP = 30;

/** Greedy word wrap by character count (SVG text has no automatic wrapping). */
export function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function bandTop(level: PurdueLevel): number {
  return (4 - level) * g.bandHeight;
}

/** Card center y: slightly below the band middle to leave room for the level label. */
function cardCenterY(level: PurdueLevel): number {
  return bandTop(level) + g.bandHeight / 2 + 4;
}

/**
 * Horizontal position: each route gets a column, and an asset sits at the mean of the columns of
 * the routes that use it (shared assets end up between their routes). Assets in the same band are
 * then pushed apart so cards never overlap.
 */
function assetXs(data: SubstationData): Map<string, number> {
  // Columns stay inside [left, right] so an entry box fits beside an outer-column card.
  const left = SIDE_MARGIN + g.entryWidth + ENTRY_GAP + g.cardWidth / 2 + 12;
  const right = g.width - left;
  const n = data.routes.length;
  const columns = data.routes.map((_, i) =>
    n === 1 ? g.width / 2 : left + ((right - left) * i) / (n - 1),
  );
  const sums = new Map<string, { total: number; count: number }>();
  data.routes.forEach((route, i) => {
    for (const id of new Set(route.steps)) {
      const entry = sums.get(id) ?? { total: 0, count: 0 };
      entry.total += columns[i]!;
      entry.count += 1;
      sums.set(id, entry);
    }
  });

  const xs = new Map<string, number>();
  for (const level of LEVELS) {
    const inBand = data.assets
      .filter((asset) => asset.level === level)
      .map((asset) => {
        const sum = sums.get(asset.id);
        return { id: asset.id, x: sum ? sum.total / sum.count : g.width / 2 };
      })
      .sort((a, b) => a.x - b.x || (a.id < b.id ? -1 : 1));

    const minDistance = g.cardWidth + g.cardMinGap;
    for (let i = 1; i < inBand.length; i++) {
      inBand[i]!.x = Math.max(inBand[i]!.x, inBand[i - 1]!.x + minDistance);
    }
    const min = g.cardWidth / 2 + SIDE_MARGIN;
    const max = g.width - g.cardWidth / 2 - SIDE_MARGIN;
    const last = inBand[inBand.length - 1];
    const first = inBand[0];
    let shift = 0;
    if (last && last.x > max) shift = max - last.x;
    if (first && first.x + shift < min) shift = min - first.x;
    for (const item of inBand) xs.set(item.id, item.x + shift);
  }
  return xs;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function segmentBetween(from: AssetBox, to: AssetBox, offset: number): { from: Point; to: Point } {
  const halfH = g.cardHeight / 2;
  const halfW = g.cardWidth / 2;
  if (to.y > from.y) {
    return {
      from: { x: from.x + offset, y: from.y + halfH },
      to: { x: to.x + offset, y: to.y - halfH },
    };
  }
  if (to.y < from.y) {
    return {
      from: { x: from.x + offset, y: from.y - halfH },
      to: { x: to.x + offset, y: to.y + halfH },
    };
  }
  const dir = to.x > from.x ? 1 : -1;
  return {
    from: { x: from.x + dir * halfW, y: from.y + offset },
    to: { x: to.x - dir * halfW, y: to.y + offset },
  };
}

export function computeMapLayout(data: SubstationData): MapLayout {
  const xs = assetXs(data);
  const assets: Record<string, AssetBox> = {};
  for (const asset of data.assets) {
    assets[asset.id] = { id: asset.id, x: xs.get(asset.id)!, y: cardCenterY(asset.level) };
  }

  const routes = data.routes.map((route, i): RouteLayout => {
    const offset = (i - (data.routes.length - 1) / 2) * g.routeOffset;
    const first = assets[route.steps[0]!]!;

    // Entry point sits beside the first asset, on the side facing the outer edge of the map.
    const side = first.x <= g.width / 2 ? -1 : 1;
    const lines = wrapText(route.entry, ENTRY_LINE_CHARS);
    // One extra line on top for the route name.
    const height = (lines.length + 1) * ENTRY_LINE_HEIGHT + 18;
    const half = g.entryWidth / 2;
    const rawX = first.x + side * (g.cardWidth / 2 + ENTRY_GAP + half);
    const entryX = Math.min(Math.max(rawX, half + SIDE_MARGIN), g.width - half - SIDE_MARGIN);
    const entry: EntryBox = { x: entryX, y: first.y, width: g.entryWidth, height, lines };

    const entryFrom = { x: entryX - side * half, y: first.y };
    const entryTo = { x: first.x + side * (g.cardWidth / 2), y: first.y };
    const segments: Segment[] = [
      { index: 0, from: entryFrom, to: entryTo, length: distance(entryFrom, entryTo) },
    ];
    for (let k = 1; k < route.steps.length; k++) {
      const { from, to } = segmentBetween(
        assets[route.steps[k - 1]!]!,
        assets[route.steps[k]!]!,
        offset,
      );
      segments.push({ index: k, from, to, length: distance(from, to) });
    }
    return { routeId: route.id, entry, segments };
  });

  return {
    width: g.width,
    height: LEVELS.length * g.bandHeight,
    bands: LEVELS.map((level) => ({ level, top: bandTop(level) })),
    assets,
    routes,
  };
}
