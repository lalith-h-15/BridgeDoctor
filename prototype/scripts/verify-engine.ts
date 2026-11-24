/**
 * Engine verification: `npm run verify`
 * Asserts the expected, explainable result for every scenario and checks determinism.
 * Pure TypeScript, no test framework, no network.
 */
import { SCENARIOS } from '../src/data/scenarios';
import { runDiagnosis } from '../src/engine/diagnosticEngine';
import { RULES } from '../src/engine/diagnosticRules';
import { buildReport, REPORT_WARNING } from '../src/utils/report';
import type { ComponentId, ComponentStatus, Confidence, FindingCode, FocusKind, ScenarioId } from '../src/types';

interface Expect {
  finding: FindingCode;
  confidence: Confidence;
  focus: FocusKind;
  focusComponent: ComponentId | null;
  primary: string;
  status: Record<ComponentId, ComponentStatus>;
  headline: string;
}

const EXPECT: Record<ScenarioId, Expect> = {
  A: {
    finding: 'no_failure_detected', confidence: 'MEDIUM', focus: 'none', focusComponent: null, primary: 'BD-OK-001',
    status: { portal: 'not_verified', browser: 'healthy', service: 'healthy', tls: 'healthy', token: 'healthy' },
    headline: 'All simulated checks passed.',
  },
  B: {
    finding: 'local_service_unavailable', confidence: 'HIGH', focus: 'failure', focusComponent: 'service', primary: 'BD-SVC-001',
    status: { portal: 'not_verified', browser: 'healthy', service: 'failed', tls: 'not_verified', token: 'healthy' },
    headline: 'Likely local signing service unavailable.',
  },
  C: {
    finding: 'local_endpoint_unreachable', confidence: 'MEDIUM', focus: 'likely', focusComponent: 'service', primary: 'BD-SVC-002',
    status: { portal: 'not_verified', browser: 'healthy', service: 'warning', tls: 'not_verified', token: 'healthy' },
    headline: 'Local endpoint could not be reached.',
  },
  D: {
    finding: 'certificate_validity_issue', confidence: 'HIGH', focus: 'failure', focusComponent: 'tls', primary: 'BD-TLS-001',
    status: { portal: 'not_verified', browser: 'healthy', service: 'healthy', tls: 'failed', token: 'healthy' },
    headline: 'Certificate property issue detected.',
  },
  E: {
    finding: 'token_not_verified', confidence: 'MEDIUM', focus: 'unverified', focusComponent: 'token', primary: 'BD-TOKEN-001',
    status: { portal: 'not_verified', browser: 'healthy', service: 'healthy', tls: 'healthy', token: 'not_verified' },
    headline: 'Token integration could not be verified.',
  },
  F: {
    finding: 'inconclusive', confidence: 'INCONCLUSIVE', focus: 'uncertain', focusComponent: 'portal', primary: 'BD-PORTAL-001',
    status: { portal: 'warning', browser: 'healthy', service: 'healthy', tls: 'healthy', token: 'healthy' },
    headline: 'Cause remains inconclusive.',
  },
};

let failures = 0;
const check = (label: string, ok: boolean, extra = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${label}${ok ? '' : `  ${extra}`}`);
};

const ruleIds = new Set(RULES.map((r) => r.id));

for (const s of SCENARIOS) {
  const x = EXPECT[s.id];
  const d = runDiagnosis(s);
  console.log(`\nScenario ${s.id} - ${s.title}`);
  check('finding', d.finding === x.finding, `${d.finding} != ${x.finding}`);
  check('headline', d.headline === x.headline, d.headline);
  check('confidence', d.confidence === x.confidence, `${d.confidence} != ${x.confidence}`);
  check('focus kind', d.focus.kind === x.focus, `${d.focus.kind} != ${x.focus}`);
  check('focus component', d.focus.component === x.focusComponent, `${d.focus.component} != ${x.focusComponent}`);
  check('primary rule', d.rules.find((r) => r.primary)?.id === x.primary, String(d.rules.find((r) => r.primary)?.id));
  for (const c of Object.keys(x.status) as ComponentId[]) {
    check(`status ${c} = ${x.status[c]}`, d.components[c].status === x.status[c], d.components[c].status);
  }
  check('every observation has a rule', d.evidence.every((e) => ruleIds.has(e.rule)), 'unmapped observation');
  check('no observation fell through to fallback', d.evidence.every((e) => e.rule !== 'BD-GEN-001'));
  check('all observations marked simulated', d.evidence.every((e) => e.simulated === true));
  check('7 stages', d.stages.length === 7);
  check('unverified list is never empty', d.unverified.length > 0);
  check('deterministic (two runs identical)', JSON.stringify(d) === JSON.stringify(runDiagnosis(s)));

  const report = buildReport(d);
  check('report carries demo warning', report.warning === REPORT_WARNING);
  const text = JSON.stringify(report).toLowerCase();
  check('report has no PIN/private-key payloads', !/"pin"\s*:|private_key|-----begin/.test(text));
}

// Honesty guards from the brief.
const dc = runDiagnosis(SCENARIOS.find((s) => s.id === 'C')!);
check('C does not name a conflicting process', !/conflicting (process|program) (is|was|has)/i.test(JSON.stringify(dc.rules) + dc.recommendation.whatHappened));
const de = runDiagnosis(SCENARIOS.find((s) => s.id === 'E')!);
const eUserFacing = [de.headline, de.recommendation.whatHappened, ...de.recommendation.why, ...de.rules.map((r) => r.plain), ...de.evidence.map((e) => e.plain + ' ' + e.interpretation)].join(' ');
check('E does not claim the token is absent', !/token (is|was) (absent|missing|not present)|no token (was )?(found|present)/i.test(eUserFacing));
const da = runDiagnosis(SCENARIOS.find((s) => s.id === 'A')!);
check('A keeps the no-guarantee caveat', da.caveat === 'This does not guarantee successful signing on the real GST portal.');
const dd = runDiagnosis(SCENARIOS.find((s) => s.id === 'D')!);
check('D keeps the Chrome-trust caveat', dd.caveat === 'Certificate inspection does not establish whether Chrome trusts the certificate.');

console.log(failures === 0 ? '\nAll engine checks passed.' : `\n${failures} check(s) FAILED.`);
if (failures > 0) throw new Error(`${failures} engine check(s) failed`);
