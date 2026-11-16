import type { SubstationData } from '../../data/schema';
import { recommend, type Recommendation } from '../../engine/recommendation';
import { totalRisk } from '../../engine/risk';
import { simulate } from '../../engine/simulation';

/**
 * How the user's choice compares with CyberShield's recommendation, following the same order as
 * the engine's tie-break: lower risk, then more routes blocked, then earlier blocking.
 */
export type Verdict = 'match' | 'equivalent' | 'lowerRisk' | 'moreRoutes' | 'earlier';

export interface Comparison {
  recommendation: Recommendation;
  userRisk: number;
  verdict: Verdict;
}

export function compareChoice(data: SubstationData, userControlIds: readonly string[]): Comparison {
  const recommendation = recommend(data, userControlIds.length);
  const userIds = [...userControlIds].sort();
  const userRisk = totalRisk(data, userIds);

  if (userIds.join('\n') === recommendation.controlIds.join('\n')) {
    return { recommendation, userRisk, verdict: 'match' };
  }

  const blocked = simulate(data, userIds).filter((result) => result.blockedAt !== null);
  const userBlockedAtSum = blocked.reduce((sum, result) => sum + (result.blockedAt ?? 0), 0);

  let verdict: Verdict = 'equivalent';
  if (recommendation.totalRisk < userRisk) verdict = 'lowerRisk';
  else if (recommendation.routesBlocked > blocked.length) verdict = 'moreRoutes';
  else if (recommendation.blockedAtSum < userBlockedAtSum) verdict = 'earlier';

  return { recommendation, userRisk, verdict };
}
