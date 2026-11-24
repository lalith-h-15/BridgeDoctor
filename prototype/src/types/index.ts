/**
 * Shared domain types for the BridgeDoctor prototype.
 *
 * Everything in this file describes SIMULATED data. Nothing here is read from a
 * real machine, browser, portal or token.
 */

/** The five workflow components, in signing order. */
export type ComponentId = 'portal' | 'browser' | 'service' | 'tls' | 'token';

export type ComponentStatus = 'healthy' | 'warning' | 'failed' | 'not_verified';

/** How strongly a set of observations establishes a rule's conclusion. Not a measured accuracy. */
export type EvidenceClass = 'STRONG' | 'PARTIAL' | 'UNDETERMINED';

/** Qualitative confidence in the stated finding. Not a measured accuracy. */
export type Confidence = 'HIGH' | 'MEDIUM' | 'INCONCLUSIVE';

/** Result of a single observation after a rule has interpreted it. */
export type ObservationOutcome = 'pass' | 'warn' | 'fail' | 'unverified';

/** Identifier of a single simulated check. Each scenario provides one observation per check. */
export type CheckId =
  | 'portal.page'
  | 'browser.local_request'
  | 'service.process'
  | 'service.endpoint'
  | 'port.listener'
  | 'tls.certificate'
  | 'token.pkcs11_module'
  | 'token.slot';

export type ObservationSource =
  | 'simulated_extension_observer'
  | 'simulated_process_scan'
  | 'simulated_local_probe'
  | 'simulated_port_scan'
  | 'simulated_tls_inspector'
  | 'simulated_pkcs11_probe';

export type ScenarioId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/** Diagnostic conclusions the engine can reach. */
export type FindingCode =
  | 'no_failure_detected'
  | 'local_service_unavailable'
  | 'local_endpoint_unreachable'
  | 'certificate_validity_issue'
  | 'certificate_hostname_issue'
  | 'token_not_verified'
  | 'inconclusive';

/** A raw, simulated observation. It carries no classification: the engine adds that. */
export interface Observation {
  id: string;
  check: CheckId;
  component: ComponentId;
  /** What a healthy environment would show for this check. */
  expected: string;
  /** What the simulation reports for this run. */
  actual: string;
  /** Optional endpoint or object the check was aimed at. */
  target?: string;
  source: ObservationSource;
  /** Milliseconds from the start of the simulated run. A label, not a performance measurement. */
  tOffsetMs: number;
  /** Structured technical details (shown in Technical View). */
  detail: Record<string, string>;
  /** Plain-language reading of the observation (shown in Simple View). */
  plain: string;
  /** Always true. Present so exported evidence can never be mistaken for a real measurement. */
  simulated: true;
}

export interface Scenario {
  id: ScenarioId;
  /** Short name, e.g. "Local signing service stopped". */
  title: string;
  /** One-line story used on the scenario picker. */
  blurb: string;
  /** What the user would notice, in their words. */
  symptom: string;
  /** Where the user notices the symptom (not where the cause is). Null when nothing is wrong. */
  symptomAt: ComponentId | null;
  /** Longer explanation of what the simulation represents. */
  description: string;
  /** Fixed simulated clock for the run (keeps exports deterministic). */
  simulatedTimestamp: string;
  observations: Observation[];
}

/** An observation after rule interpretation. */
export interface EvidenceItem extends Observation {
  evidence: EvidenceClass;
  outcome: ObservationOutcome;
  /** The rule that interpreted this observation. */
  rule: string;
  /** Rules whose conclusion this observation corroborates (not the one that interpreted it). */
  corroborates: string[];
  /** Plain-language reading after the rule has been applied. */
  interpretation: string;
}

export type RuleRole = 'diagnostic' | 'component';

export interface TriggeredRule {
  id: string;
  title: string;
  role: RuleRole;
  component: ComponentId;
  condition: string;
  evidence: EvidenceClass;
  finding?: FindingCode;
  /** True for the rule whose finding became the diagnosis. */
  primary: boolean;
  explanation: string;
  plain: string;
  observationIds: string[];
  corroboratingIds: string[];
}

export interface ComponentResult {
  id: ComponentId;
  status: ComponentStatus;
  /** One short evidence sentence. */
  summary: string;
  ruleIds: string[];
  observationIds: string[];
}

export type FocusKind = 'none' | 'failure' | 'likely' | 'uncertain' | 'unverified';

export interface Focus {
  component: ComponentId | null;
  kind: FocusKind;
}

export type StageId = 'browser' | 'service' | 'port' | 'tls' | 'token' | 'correlation' | 'diagnosis';
export type StageState = 'pending' | 'running' | 'passed' | 'warning' | 'failed' | 'not_verified';

export interface StageDefinition {
  id: StageId;
  index: number;
  label: string;
  description: string;
  /** Component highlighted on the workflow map while this stage runs. */
  component: ComponentId | null;
  checks: CheckId[];
}

export interface StageResult {
  id: StageId;
  state: Exclude<StageState, 'pending' | 'running'>;
  summary: string;
}

export interface TraceStep {
  step: number;
  name: string;
  module: string;
  summary: string;
}

export interface Recommendation {
  headline: string;
  caveat?: string;
  whatHappened: string;
  why: string[];
  check: string[];
  avoid: string[];
  technical: string;
}

export interface Diagnosis {
  scenarioId: ScenarioId;
  scenarioTitle: string;
  simulatedTimestamp: string;
  finding: FindingCode;
  headline: string;
  caveat?: string;
  focus: Focus;
  confidence: Confidence;
  confidenceReason: string;
  components: Record<ComponentId, ComponentResult>;
  evidence: EvidenceItem[];
  rules: TriggeredRule[];
  recommendation: Recommendation;
  unverified: string[];
  stages: StageResult[];
  trace: TraceStep[];
}

export type ViewMode = 'simple' | 'technical';
