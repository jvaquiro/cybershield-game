import rawData from './subestacion.json';
import { parseSubstationData, type ParseResult } from './schema';

/** subestacion.json, validated once at startup. */
export const loadResult: ParseResult = parseSubstationData(rawData);

/**
 * True while subestacion.json carries "_status". Read from the raw JSON so the badge still shows
 * on the error screen when validation fails.
 */
export const showPlaceholderBadge: boolean =
  typeof rawData === 'object' && rawData !== null && '_status' in rawData;
