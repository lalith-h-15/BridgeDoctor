import { COMPONENTS } from '../data/components';
import type { ComponentId, ComponentStatus, Diagnosis, EvidenceClass, ObservationOutcome } from '../types';

export const OUTCOMES: ObservationOutcome[] = ['pass', 'warn', 'fail', 'unverified'];
export const EVIDENCE_CLASSES: EvidenceClass[] = ['STRONG', 'PARTIAL', 'UNDETERMINED'];

export const OUTCOME_LABEL: Record<ObservationOutcome, string> = {
  pass: 'Passed',
  warn: 'Warning',
  fail: 'Failed',
  unverified: 'Not verified',
};

export const STATUS_LABEL: Record<ComponentStatus, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  failed: 'Failed',
  not_verified: 'Not verified',
};

export function countByOutcome(d: Diagnosis): Record<ObservationOutcome, number> {
  const out: Record<ObservationOutcome, number> = { pass: 0, warn: 0, fail: 0, unverified: 0 };
  d.evidence.forEach((e) => (out[e.outcome] += 1));
  return out;
}

export function countByEvidence(d: Diagnosis): Record<EvidenceClass, number> {
  const out: Record<EvidenceClass, number> = { STRONG: 0, PARTIAL: 0, UNDETERMINED: 0 };
  d.evidence.forEach((e) => (out[e.evidence] += 1));
  return out;
}

/** Outcome counts per workflow component (checks that belong to each component). */
export function outcomesByComponent(d: Diagnosis) {
  return COMPONENTS.map((c) => {
    const row: Record<ObservationOutcome, number> = { pass: 0, warn: 0, fail: 0, unverified: 0 };
    d.evidence.filter((e) => e.component === c.id).forEach((e) => (row[e.outcome] += 1));
    return { id: c.id as ComponentId, name: c.name, ...row };
  });
}

/** Plain-language reading of a chart, generated from the data so it can never drift from it. */
export function interpretOutcomes(d: Diagnosis): string {
  const c = countByOutcome(d);
  const total = d.evidence.length;
  const parts = [`${c.pass} of ${total} checks passed`];
  if (c.fail) parts.push(`${c.fail} failed`);
  if (c.warn) parts.push(`${c.warn} raised a warning`);
  if (c.unverified) parts.push(`${c.unverified} could not be verified`);
  return `${parts.join(', ')}.`;
}

export function interpretEvidence(d: Diagnosis): string {
  const c = countByEvidence(d);
  const note =
    c.UNDETERMINED > 0
      ? 'Undetermined items are observations the rules could not tie to a cause.'
      : 'Partial evidence is common: browser-side and passing checks cannot prove a whole workflow works.';
  return `${c.STRONG} strong, ${c.PARTIAL} partial, ${c.UNDETERMINED} undetermined. ${note}`;
}

export function interpretComponents(d: Diagnosis): string {
  const flagged = COMPONENTS.filter((c) => d.components[c.id].status === 'failed' || d.components[c.id].status === 'warning');
  if (flagged.length === 0) {
    const nv = COMPONENTS.filter((c) => d.components[c.id].status === 'not_verified');
    return nv.length
      ? `No component failed. ${nv.map((c) => c.name).join(', ')} could not be verified.`
      : 'All components look healthy in this simulation.';
  }
  return `Attention needed: ${flagged.map((c) => `${c.name} (${STATUS_LABEL[d.components[c.id].status].toLowerCase()})`).join(', ')}.`;
}
