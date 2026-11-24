import type { Diagnosis } from '../types';

export const PROTOTYPE_ID = 'bridgedoctor-prototype@0.1.0';
export const REPORT_WARNING = 'DEMONSTRATION DATA — NOT A REAL SYSTEM DIAGNOSTIC';

/**
 * Build the exportable report. It contains only simulated observations and static guidance.
 * No machine names, user names, paths, PINs, keys, certificates or documents are ever included.
 * Keys are emitted in a fixed order and no clock is read, so the export is deterministic.
 */
export function buildReport(d: Diagnosis) {
  return {
    warning: REPORT_WARNING,
    prototype: PROTOTYPE_ID,
    scenario: { id: d.scenarioId, title: d.scenarioTitle },
    simulatedTimestamp: d.simulatedTimestamp,
    diagnosis: {
      finding: d.finding,
      headline: d.headline,
      caveat: d.caveat ?? null,
      likelyFailurePoint: d.focus.component,
      markerKind: d.focus.kind,
      confidence: d.confidence,
      confidenceReason: d.confidenceReason,
      confidenceNote: 'Qualitative category derived from evidence strength. Not a measured accuracy.',
    },
    componentStatus: Object.fromEntries(
      Object.values(d.components).map((c) => [c.id, { status: c.status, summary: c.summary }]),
    ),
    evidence: d.evidence.map((e) => ({
      id: e.id,
      component: e.component,
      check: e.check,
      target: e.target ?? null,
      expected: e.expected,
      actual: e.actual,
      evidence: e.evidence,
      outcome: e.outcome,
      rule: e.rule,
      corroborates: e.corroborates,
      source: e.source,
      simulatedOffsetMs: e.tOffsetMs,
      simulated: true,
      detail: e.detail,
    })),
    triggeredRules: d.rules.map((r) => ({
      id: r.id,
      title: r.title,
      role: r.role,
      condition: r.condition,
      evidence: r.evidence,
      primary: r.primary,
      explanation: r.explanation,
      observationIds: r.observationIds,
      corroboratingIds: r.corroboratingIds,
    })),
    recommendations: {
      whatHappened: d.recommendation.whatHappened,
      possibleReasons: d.recommendation.why,
      whatToCheck: d.recommendation.check,
      whatToAvoid: d.recommendation.avoid,
    },
    unverifiedConditions: d.unverified,
  };
}

export type DiagnosticReport = ReturnType<typeof buildReport>;

export function reportFileName(d: Diagnosis): string {
  return `bridgedoctor-scenario-${d.scenarioId.toLowerCase()}-DEMO-report.json`;
}

/** Trigger a browser download of the report. Local only: no network request is made. */
export function downloadReport(d: Diagnosis): void {
  const blob = new Blob([JSON.stringify(buildReport(d), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = reportFileName(d);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
