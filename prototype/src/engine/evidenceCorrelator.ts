import { COMPONENTS } from '../data/components';
import type {
  CheckId,
  ComponentId,
  ComponentResult,
  ComponentStatus,
  Confidence,
  EvidenceItem,
  Observation,
  Scenario,
} from '../types';
import { FALLBACK_RULE, RULES, type DiagnosticRule, type RuleContext, type RuleHit } from './diagnosticRules';

/**
 * Evidence correlation: turns rule hits into classified evidence, component results,
 * a primary finding and a qualitative confidence category.
 *
 * Confidence is a CATEGORY derived from evidence strength and corroboration. It is
 * not a probability and not a measured accuracy.
 */

export interface RuleEval {
  rule: DiagnosticRule;
  hit: RuleHit;
}

/** Step 2: evaluate every rule against the scenario's observations. */
export function evaluateRules(scenario: Scenario): RuleEval[] {
  const byCheck = new Map<CheckId, Observation>(scenario.observations.map((o) => [o.check, o]));
  const ctx: RuleContext = {
    obs(check) {
      const o = byCheck.get(check);
      if (!o) throw new Error(`Scenario ${scenario.id} has no observation for ${check}`);
      return o;
    },
    value(check) {
      return this.obs(check).actual;
    },
  };
  const evals: RuleEval[] = [];
  for (const rule of RULES) {
    const hit = rule.evaluate(ctx);
    if (hit) evals.push({ rule, hit });
  }
  return evals;
}

/** Step 3 + 4: map every observation to the rule that interprets it and classify the evidence. */
export function correlateEvidence(scenario: Scenario, evals: RuleEval[]): EvidenceItem[] {
  // First rule (catalogue order) to consume a check owns it. Prevents double-classification.
  const owner = new Map<CheckId, RuleEval>();
  for (const e of evals) for (const c of e.hit.consumes) if (!owner.has(c)) owner.set(c, e);

  const corroborates = new Map<CheckId, string[]>();
  for (const e of evals) {
    for (const c of e.hit.corroboratedBy ?? []) {
      corroborates.set(c, [...(corroborates.get(c) ?? []), e.rule.id]);
    }
  }

  return scenario.observations.map((o) => {
    const own = owner.get(o.check);
    const links = corroborates.get(o.check) ?? [];
    if (!own) {
      // Fallback: never drop an observation silently, and never over-claim about it.
      return {
        ...o,
        evidence: 'UNDETERMINED',
        outcome: 'unverified',
        rule: FALLBACK_RULE.id,
        corroborates: links,
        interpretation: 'No diagnostic rule matched this observation, so it is recorded but not interpreted.',
      };
    }
    return {
      ...o,
      evidence: own.hit.evidence,
      outcome: own.hit.outcomes?.[o.check] ?? own.hit.outcome,
      rule: own.rule.id,
      corroborates: links,
      interpretation: own.hit.plain,
    };
  });
}

const STATUS_RANK: Record<ComponentStatus, number> = { healthy: 0, not_verified: 1, warning: 2, failed: 3 };

/** Step 5a: per-component status. The most cautious claim wins when rules disagree. */
export function buildComponents(evals: RuleEval[], evidence: EvidenceItem[]): Record<ComponentId, ComponentResult> {
  const out = {} as Record<ComponentId, ComponentResult>;
  for (const def of COMPONENTS) {
    let status: ComponentStatus | null = null;
    let summary = 'No rule produced evidence for this component.';
    const ruleIds: string[] = [];
    for (const e of evals) {
      const eff = e.hit.effects[def.id];
      if (!eff) continue;
      ruleIds.push(e.rule.id);
      if (status === null || STATUS_RANK[eff.status] > STATUS_RANK[status]) {
        status = eff.status;
        summary = eff.summary;
      }
    }
    out[def.id] = {
      id: def.id,
      status: status ?? 'not_verified',
      summary,
      ruleIds,
      observationIds: evidence.filter((o) => o.component === def.id).map((o) => o.id),
    };
  }
  return out;
}

/** Step 5b: the primary diagnostic rule. Failures outrank the "no failure" verdict. */
export function pickPrimary(evals: RuleEval[]): RuleEval | undefined {
  const diagnostic = evals.filter((e) => e.rule.role === 'diagnostic');
  return diagnostic.find((e) => e.hit.finding !== 'no_failure_detected') ?? diagnostic[0];
}

/** Step 6: qualitative confidence category with a stated reason. */
export function computeConfidence(
  primary: RuleEval | undefined,
): { confidence: Confidence; reason: string } {
  if (!primary) {
    return { confidence: 'INCONCLUSIVE', reason: 'No diagnostic rule matched the observations, so no finding is stated.' };
  }
  const corroborated = (primary.hit.corroboratedBy ?? []).length > 0;
  switch (primary.hit.evidence) {
    case 'UNDETERMINED':
      return {
        confidence: 'INCONCLUSIVE',
        reason: 'The matching rule rests on undetermined evidence. The engine does not force a diagnosis.',
      };
    case 'STRONG':
      return corroborated
        ? { confidence: 'HIGH', reason: 'Strong local evidence, independently corroborated by the browser-side observation.' }
        : { confidence: 'MEDIUM', reason: 'Strong evidence, but no independent corroboration was observed.' };
    case 'PARTIAL':
      return primary.hit.finding === 'no_failure_detected'
        ? { confidence: 'MEDIUM', reason: 'Absence of failure signals is partial evidence, so confidence is capped at MEDIUM.' }
        : {
            confidence: 'MEDIUM',
            reason: corroborated
              ? 'Partial evidence with browser-side corroboration; capped at MEDIUM.'
              : 'Partial evidence only; capped at MEDIUM.',
          };
  }
}

/** Step 8: everything the run could not establish. The portal's server side is never observable. */
export function collectUnverified(evals: RuleEval[], primary: RuleEval | undefined): string[] {
  const ordered = primary ? [primary, ...evals.filter((e) => e !== primary)] : evals;
  const items: string[] = [];
  for (const e of ordered) for (const u of e.hit.unverified ?? []) items.push(u);
  items.push('GST portal server-side state (BridgeDoctor never connects to the portal)');
  return [...new Set(items)];
}
