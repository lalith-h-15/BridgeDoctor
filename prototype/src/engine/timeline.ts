import { STAGES } from '../data/components';
import type { EvidenceItem, ObservationOutcome, StageResult } from '../types';

const OUTCOME_RANK: Record<ObservationOutcome, number> = { pass: 0, unverified: 1, warn: 2, fail: 3 };

const OUTCOME_TO_STATE = {
  pass: 'passed',
  unverified: 'not_verified',
  warn: 'warning',
  fail: 'failed',
} as const;

/**
 * Final state of each of the seven timeline stages, derived from the classified evidence.
 * Stages 1-5 summarise their observations by worst outcome; stages 6-7 describe the engine itself.
 * The timeline is therefore scenario-dependent without any per-scenario hardcoding.
 */
export function buildStages(
  evidence: EvidenceItem[],
  ruleCount: number,
  corroborationCount: number,
  headline: string,
  inconclusive: boolean,
): StageResult[] {
  return STAGES.map((stage) => {
    if (stage.id === 'correlation') {
      return {
        id: stage.id,
        state: inconclusive ? 'warning' : 'passed',
        summary: inconclusive
          ? `${ruleCount} rule(s) triggered; evidence is insufficient to tie the failure to a cause.`
          : `${ruleCount} rule(s) triggered; ${corroborationCount} corroborating link(s) found.`,
      };
    }
    if (stage.id === 'diagnosis') {
      return { id: stage.id, state: inconclusive ? 'warning' : 'passed', summary: headline };
    }
    const items = evidence.filter((e) => stage.checks.includes(e.check));
    const worst = items.reduce((w, e) => (OUTCOME_RANK[e.outcome] > OUTCOME_RANK[w.outcome] ? e : w), items[0]);
    return { id: stage.id, state: OUTCOME_TO_STATE[worst.outcome], summary: worst.plain };
  });
}
