import { COMPONENT_BY_ID } from '../data/components';
import { SCENARIOS } from '../data/scenarios';
import type { Diagnosis, Focus, Scenario, TraceStep, TriggeredRule } from '../types';
import { RULES } from './diagnosticRules';
import {
  buildComponents,
  collectUnverified,
  computeConfidence,
  correlateEvidence,
  evaluateRules,
  pickPrimary,
} from './evidenceCorrelator';
import { RECOMMENDATIONS } from './recommendations';
import { buildStages } from './timeline';

/**
 * runDiagnosis(scenario): Diagnosis
 *
 * Deterministic pipeline. Same scenario in, same Diagnosis out. No randomness, no clock, no network.
 *
 *   1. Load mock observations          (data/scenarios.ts)
 *   2. Evaluate diagnostic rules       (engine/diagnosticRules.ts)
 *   3. Correlate observations          (engine/evidenceCorrelator.ts)
 *   4. Classify evidence               STRONG | PARTIAL | UNDETERMINED
 *   5. Identify the likely failure point
 *   6. Compute a qualitative confidence category
 *   7. Generate recommendations        (engine/recommendations.ts)
 *   8. Identify unverified conditions
 */
export function runDiagnosis(scenario: Scenario): Diagnosis {
  const trace: TraceStep[] = [];
  const log = (name: string, module: string, summary: string) =>
    trace.push({ step: trace.length + 1, name, module, summary });

  // 1. Load
  log('Load observations', 'data/scenarios.ts', `${scenario.observations.length} simulated observations loaded for scenario ${scenario.id}.`);

  // 2. Evaluate rules
  const evals = evaluateRules(scenario);
  log(
    'Evaluate rules',
    'engine/diagnosticRules.ts',
    `${evals.length} of ${RULES.length} rules triggered: ${evals.map((e) => e.rule.id).join(', ') || 'none'}.`,
  );

  // 3. Correlate
  const evidence = correlateEvidence(scenario, evals);
  const corroborationCount = evals.reduce((n, e) => n + (e.hit.corroboratedBy?.length ?? 0), 0);
  log(
    'Correlate observations',
    'engine/evidenceCorrelator.ts',
    `${evidence.length} observations mapped to rules; ${corroborationCount} corroborating link(s).`,
  );

  // 4. Classify
  const tally = { STRONG: 0, PARTIAL: 0, UNDETERMINED: 0 };
  evidence.forEach((e) => (tally[e.evidence] += 1));
  log('Classify evidence', 'engine/evidenceCorrelator.ts', `STRONG ${tally.STRONG} / PARTIAL ${tally.PARTIAL} / UNDETERMINED ${tally.UNDETERMINED}.`);

  // 5. Failure point
  const components = buildComponents(evals, evidence);
  const primary = pickPrimary(evals);
  const finding = primary?.hit.finding ?? 'inconclusive';
  const focus = buildFocus(primary?.rule.component ?? null, primary?.hit.outcome, finding);
  log(
    'Identify failure point',
    'engine/evidenceCorrelator.ts',
    primary
      ? `Primary rule ${primary.rule.id} -> ${finding}${focus.component ? ` at ${COMPONENT_BY_ID[focus.component].name}` : ''}.`
      : 'No diagnostic rule matched; no finding is stated.',
  );

  // 6. Confidence
  const { confidence, reason } = computeConfidence(primary);
  log('Qualitative confidence', 'engine/evidenceCorrelator.ts', `${confidence}: ${reason}`);

  // 7. Recommendations
  const recommendation = RECOMMENDATIONS[finding];
  log('Generate recommendations', 'engine/recommendations.ts', `Guidance selected for finding "${finding}".`);

  // 8. Unverified
  const unverified = collectUnverified(evals, primary);
  log('Identify unverified conditions', 'engine/evidenceCorrelator.ts', `${unverified.length} condition(s) remain unverified.`);

  const rules: TriggeredRule[] = evals.map((e) => ({
    id: e.rule.id,
    title: e.rule.title,
    role: e.rule.role,
    component: e.rule.component,
    condition: e.rule.condition,
    evidence: e.hit.evidence,
    finding: e.hit.finding,
    primary: e === primary,
    explanation: e.hit.explanation,
    plain: e.hit.plain,
    observationIds: evidence.filter((o) => o.rule === e.rule.id).map((o) => o.id),
    corroboratingIds: evidence.filter((o) => o.corroborates.includes(e.rule.id)).map((o) => o.id),
  }));
  // Observations that fell through to the fallback rule are surfaced as a rule too.
  const orphans = evidence.filter((o) => o.rule === 'BD-GEN-001');
  if (orphans.length) {
    rules.push({
      id: 'BD-GEN-001',
      title: 'Unrecognised observation',
      role: 'component',
      component: orphans[0].component,
      condition: 'observation not consumed by any other rule',
      evidence: 'UNDETERMINED',
      primary: false,
      explanation: 'These observations matched no rule. They are shown, not interpreted.',
      plain: 'Some observations could not be interpreted.',
      observationIds: orphans.map((o) => o.id),
      corroboratingIds: [],
    });
  }

  const stages = buildStages(evidence, evals.length, corroborationCount, recommendation.headline, finding === 'inconclusive');

  return {
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    simulatedTimestamp: scenario.simulatedTimestamp,
    finding,
    headline: recommendation.headline,
    caveat: recommendation.caveat,
    focus,
    confidence,
    confidenceReason: reason,
    components,
    evidence,
    rules,
    recommendation,
    unverified,
    stages,
    trace,
  };
}

/** Map the primary rule's outcome to the visual marker used on the workflow map. */
function buildFocus(
  component: Focus['component'],
  outcome: string | undefined,
  finding: Diagnosis['finding'],
): Focus {
  if (!component || finding === 'no_failure_detected') return { component: null, kind: 'none' };
  if (finding === 'inconclusive') return { component, kind: 'uncertain' };
  if (outcome === 'fail') return { component, kind: 'failure' };
  if (outcome === 'unverified') return { component, kind: 'unverified' };
  return { component, kind: 'likely' };
}

/** Diagnoses for all scenarios, computed once. Used by comparison charts and the Judge page. */
export const ALL_DIAGNOSES: Record<string, Diagnosis> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, runDiagnosis(s)]),
);
