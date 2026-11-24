import type {
  CheckId,
  ComponentId,
  ComponentStatus,
  EvidenceClass,
  FindingCode,
  Observation,
  ObservationOutcome,
  RuleRole,
} from '../types';

/**
 * Diagnostic rule catalogue.
 *
 * Rules are pure functions of the observations: no randomness, no clock, no I/O.
 * The same scenario therefore always produces the same diagnosis, and every
 * conclusion can be traced to a rule id plus the observations it consumed.
 *
 * Rule id families:
 *   BD-BRW-*     browser-side observations (extension view, always PARTIAL)
 *   BD-SVC-*     local signing service: process, endpoint, port
 *   BD-TLS-*     certificate properties
 *   BD-TOKEN-*   PKCS#11 module / token availability
 *   BD-PORTAL-*  portal-side signals
 *   BD-OK-*      "no failure detected" (negative evidence, capped at PARTIAL)
 *   BD-GEN-*     fallback for observations no rule recognised
 *
 * Two roles:
 *   'diagnostic' rules reach a FINDING (a candidate diagnosis).
 *   'component'  rules only describe the state of one component.
 */

export interface RuleContext {
  /** Observed value (`actual`) of a check. */
  value(check: CheckId): string;
  /** Full observation for a check (for technical detail). */
  obs(check: CheckId): Observation;
}

export interface ComponentEffect {
  status: ComponentStatus;
  summary: string;
}

export interface RuleHit {
  /** Checks whose observations this rule interprets. */
  consumes: CheckId[];
  /** How strongly the consumed observations establish the rule's conclusion. */
  evidence: EvidenceClass;
  /** Default outcome for consumed observations. */
  outcome: ObservationOutcome;
  /** Per-check outcome overrides (e.g. "undetermined" is unverified, not failed). */
  outcomes?: Partial<Record<CheckId, ObservationOutcome>>;
  finding?: FindingCode;
  effects: Partial<Record<ComponentId, ComponentEffect>>;
  /** Observations from other rules that independently support this conclusion. */
  corroboratedBy?: CheckId[];
  /** Technical explanation (Technical View). */
  explanation: string;
  /** Plain-language explanation (Simple View). */
  plain: string;
  /** Conditions this rule leaves unverified. */
  unverified?: string[];
}

export interface DiagnosticRule {
  id: string;
  title: string;
  role: RuleRole;
  component: ComponentId;
  /** Human-readable form of the rule's condition (shown in Judge Mode). */
  condition: string;
  evaluate(ctx: RuleContext): RuleHit | null;
}

/** All "everything local looks normal" values. Shared by BD-OK-001 and BD-PORTAL-001. */
function allLocalChecksPass(ctx: RuleContext): boolean {
  return (
    ctx.value('browser.local_request') === 'request_succeeded' &&
    ctx.value('service.process') === 'process_running' &&
    ctx.value('service.endpoint') === 'endpoint_responding' &&
    ctx.value('port.listener') === 'listening' &&
    ctx.value('tls.certificate') === 'valid_properties' &&
    ctx.value('token.pkcs11_module') === 'module_loaded' &&
    ctx.value('token.slot') === 'token_present'
  );
}

/**
 * Catalogue order doubles as diagnostic priority: failures earlier in the signing
 * workflow outrank later ones, because an upstream failure also explains why
 * downstream checks could not run.
 */
export const RULES: DiagnosticRule[] = [
  // ---------------------------------------------------------------------------------------------
  // Local signing service
  // ---------------------------------------------------------------------------------------------
  {
    id: 'BD-SVC-001',
    title: 'Local signing service unavailable',
    role: 'diagnostic',
    component: 'service',
    condition: 'process = absent AND endpoint = connection_refused',
    evaluate(ctx) {
      // Two independent local signals agree: no process AND the OS actively refused the connection.
      if (ctx.value('service.process') !== 'process_absent') return null;
      if (ctx.value('service.endpoint') !== 'connection_refused') return null;
      const consumes: CheckId[] = ['service.process', 'service.endpoint'];
      if (ctx.value('port.listener') === 'not_listening') consumes.push('port.listener');
      const browserAgrees = ctx.value('browser.local_request') === 'net_err_connection_refused';
      return {
        consumes,
        evidence: 'STRONG',
        outcome: 'fail',
        finding: 'local_service_unavailable',
        effects: { service: { status: 'failed', summary: 'Helper is not running and refuses connections.' } },
        corroboratedBy: browserAgrees ? ['browser.local_request'] : [],
        explanation:
          'No helper process was found and the endpoint actively refused the TCP connection. Refusal (rather than a timeout) means the host answered but nothing was listening. ' +
          (browserAgrees
            ? 'The browser-side observation (net::ERR_CONNECTION_REFUSED) independently agrees.'
            : 'No browser-side corroboration was available.'),
        plain: 'Nothing is running to receive the signing request, and the computer refused the connection.',
        unverified: [
          'Why the helper is not running (not installed, stopped, crashed or blocked)',
          'Whether starting the helper would resolve the signing failure',
        ],
      };
    },
  },
  {
    id: 'BD-SVC-002',
    title: 'Local endpoint unreachable, cause undetermined',
    role: 'diagnostic',
    component: 'service',
    condition: 'endpoint = no_response_timeout AND (process = undetermined OR listener = undetermined)',
    evaluate(ctx) {
      if (ctx.value('service.endpoint') !== 'no_response_timeout') return null;
      const procUnknown = ctx.value('service.process') === 'process_undetermined';
      const portUnknown = ctx.value('port.listener') === 'listener_undetermined';
      if (!procUnknown && !portUnknown) return null;
      const browserAgrees = ctx.value('browser.local_request') === 'net_err_timed_out';
      return {
        consumes: ['service.endpoint', 'service.process', 'port.listener'],
        evidence: 'PARTIAL',
        outcome: 'warn',
        outcomes: {
          'service.process': procUnknown ? 'unverified' : 'warn',
          'port.listener': portUnknown ? 'unverified' : 'warn',
        },
        finding: 'local_endpoint_unreachable',
        effects: {
          service: { status: 'warning', summary: 'Local address did not answer; process and port evidence is incomplete.' },
        },
        corroboratedBy: browserAgrees ? ['browser.local_request'] : [],
        explanation:
          'The endpoint produced neither a response nor a refusal. A timeout is weaker than a refusal, and the process and port scans did not settle which program (if any) is involved. ' +
          'The rule deliberately does NOT name a conflicting process: no observation supports one.',
        plain: 'The local address did not answer, and the checks that could explain why were incomplete.',
        unverified: [
          'Whether the helper is running',
          'Which program, if any, holds the expected port',
          'Whether configuration, a port conflict or local security software is involved',
        ],
      };
    },
  },
  {
    id: 'BD-SVC-003',
    title: 'Local signing service healthy',
    role: 'component',
    component: 'service',
    condition: 'process = running AND endpoint = responding AND listener = listening',
    evaluate(ctx) {
      if (ctx.value('service.process') !== 'process_running') return null;
      if (ctx.value('service.endpoint') !== 'endpoint_responding') return null;
      if (ctx.value('port.listener') !== 'listening') return null;
      return {
        consumes: ['service.process', 'service.endpoint', 'port.listener'],
        evidence: 'STRONG',
        outcome: 'pass',
        effects: { service: { status: 'healthy', summary: 'Helper running, answering and listening on the expected port.' } },
        explanation: 'Process, endpoint and listener observations all agree that the helper is up.',
        plain: 'The signing helper is running and answering.',
      };
    },
  },

  // ---------------------------------------------------------------------------------------------
  // TLS certificate
  // ---------------------------------------------------------------------------------------------
  {
    id: 'BD-TLS-001',
    title: 'Certificate validity issue',
    role: 'diagnostic',
    component: 'tls',
    condition: 'certificate validity = expired',
    evaluate(ctx) {
      if (ctx.value('tls.certificate') !== 'expired') return null;
      const d = ctx.obs('tls.certificate').detail;
      const browserAgrees = ctx.value('browser.local_request') === 'net_err_cert_date_invalid';
      return {
        consumes: ['tls.certificate'],
        evidence: 'STRONG',
        outcome: 'fail',
        finding: 'certificate_validity_issue',
        effects: {
          tls: { status: 'failed', summary: `Certificate is past its end date (notAfter ${d.notAfter ?? '?'}).` },
        },
        corroboratedBy: browserAgrees ? ['browser.local_request'] : [],
        explanation:
          `The presented certificate's notAfter (${d.notAfter ?? '?'}) precedes the simulated clock. A date comparison is deterministic, so the property itself is STRONG evidence. ` +
          'It still says nothing about whether Chrome would trust a renewed certificate.',
        plain: "The helper's secure certificate has passed its end date.",
        unverified: [
          'Whether Chrome trusts the certificate chain beyond the date error',
          'Whether renewing the certificate alone would be sufficient',
        ],
      };
    },
  },
  {
    id: 'BD-TLS-002',
    title: 'Certificate hostname issue',
    role: 'diagnostic',
    component: 'tls',
    condition: 'certificate hostname = mismatch',
    evaluate(ctx) {
      if (ctx.value('tls.certificate') !== 'hostname_mismatch') return null;
      const browserAgrees = ctx.value('browser.local_request') === 'net_err_cert_common_name_invalid';
      return {
        consumes: ['tls.certificate'],
        evidence: 'STRONG',
        outcome: 'fail',
        finding: 'certificate_hostname_issue',
        effects: { tls: { status: 'failed', summary: 'Certificate names do not match the local address.' } },
        corroboratedBy: browserAgrees ? ['browser.local_request'] : [],
        explanation:
          'The certificate subject alternative names do not include the address the browser connects to. Available in the rule catalogue; no predefined scenario exercises it.',
        plain: "The helper's certificate is issued for a different name than the one being used.",
        unverified: ['Whether Chrome trusts the certificate chain', 'Which configuration produced the mismatch'],
      };
    },
  },
  {
    id: 'BD-TLS-003',
    title: 'Certificate not inspectable (dependency)',
    role: 'component',
    component: 'tls',
    condition: 'certificate = not_inspectable',
    evaluate(ctx) {
      if (ctx.value('tls.certificate') !== 'not_inspectable') return null;
      return {
        consumes: ['tls.certificate'],
        evidence: 'UNDETERMINED',
        outcome: 'unverified',
        effects: { tls: { status: 'not_verified', summary: 'Not inspected: the local endpoint did not answer.' } },
        explanation:
          'A certificate can only be inspected when something presents one. The check depends on the endpoint; it is not a statement that the certificate is fine or broken.',
        plain: 'The certificate could not be checked because nothing answered.',
        unverified: ['Certificate properties of the helper (nothing answered to present a certificate)'],
      };
    },
  },
  {
    id: 'BD-TLS-004',
    title: 'Certificate properties look valid',
    role: 'component',
    component: 'tls',
    condition: 'certificate validity = valid_properties',
    evaluate(ctx) {
      if (ctx.value('tls.certificate') !== 'valid_properties') return null;
      return {
        consumes: ['tls.certificate'],
        evidence: 'PARTIAL',
        outcome: 'pass',
        effects: {
          tls: { status: 'healthy', summary: 'Dates and hostname look valid. Chrome trust is not established.' },
        },
        explanation:
          'Certificate properties (dates, names) were inspected. Valid properties do not prove Chrome trusts the certificate, so the evidence is PARTIAL.',
        plain: 'The certificate looks fine on paper.',
        unverified: ['Whether Chrome trusts the local certificate'],
      };
    },
  },

  // ---------------------------------------------------------------------------------------------
  // PKCS#11 / token
  // ---------------------------------------------------------------------------------------------
  {
    id: 'BD-TOKEN-001',
    title: 'Token integration not verified',
    role: 'diagnostic',
    component: 'token',
    condition: 'PKCS#11 module = unknown OR missing  =>  token status = not_verified',
    evaluate(ctx) {
      const m = ctx.value('token.pkcs11_module');
      if (m !== 'module_unknown' && m !== 'module_missing') return null;
      return {
        consumes: ['token.pkcs11_module', 'token.slot'],
        evidence: 'PARTIAL',
        outcome: 'unverified',
        finding: 'token_not_verified',
        effects: {
          token: { status: 'not_verified', summary: 'PKCS#11 module not configured; token could not be verified.' },
        },
        explanation:
          'Without a loaded vendor PKCS#11 module there is no way to enumerate slots. The rule sets the token to not_verified. It does NOT infer that a physical token is absent: no observation says so.',
        plain: "The software the token needs isn't set up, so the token could not be checked.",
        unverified: [
          'Whether a token is physically present',
          'Which vendor PKCS#11 module this token requires',
          'Whether the token works with the vendor module',
        ],
      };
    },
  },
  {
    id: 'BD-TOKEN-002',
    title: 'PKCS#11 module and token visible (simulated)',
    role: 'component',
    component: 'token',
    condition: 'PKCS#11 module = loaded AND slot = token_present',
    evaluate(ctx) {
      if (ctx.value('token.pkcs11_module') !== 'module_loaded') return null;
      if (ctx.value('token.slot') !== 'token_present') return null;
      return {
        consumes: ['token.pkcs11_module', 'token.slot'],
        evidence: 'PARTIAL',
        outcome: 'pass',
        effects: {
          token: { status: 'healthy', summary: 'Module loaded and a token was visible (simulated). Vendor compatibility not proven.' },
        },
        explanation:
          'Module load and slot enumeration succeeded without a PIN. In this prototype the result is simulated, and a software token (e.g. SoftHSM2) would not prove compatibility with physical USB DSC devices.',
        plain: 'The token software loaded and a token was visible.',
        unverified: ['Compatibility with physical USB DSC devices and vendor modules'],
      };
    },
  },

  // ---------------------------------------------------------------------------------------------
  // Portal-side
  // ---------------------------------------------------------------------------------------------
  {
    id: 'BD-PORTAL-001',
    title: 'Portal-side or inconclusive failure',
    role: 'diagnostic',
    component: 'portal',
    condition: 'all local checks pass AND portal response = generic_error  =>  diagnosis = inconclusive',
    evaluate(ctx) {
      if (ctx.value('portal.page') !== 'page_loaded_signing_error_generic') return null;
      // If any local check failed, a local rule explains the symptom; this rule must not fire.
      if (!allLocalChecksPass(ctx)) return null;
      return {
        consumes: ['portal.page'],
        evidence: 'UNDETERMINED',
        outcome: 'warn',
        finding: 'inconclusive',
        effects: {
          portal: { status: 'warning', summary: 'Portal showed a generic failure; local evidence cannot explain it.' },
        },
        explanation:
          'Every local check passed, yet the portal reported a failure without an observable error code. The evidence is insufficient for a confident local diagnosis, so the engine refuses to force one.',
        plain: 'Your computer looks fine, but the portal reported a failure we cannot explain from here.',
        unverified: [
          'The cause of the portal-reported failure',
          'Whether the problem is portal-side, session-related or outside local observation',
        ],
      };
    },
  },
  {
    id: 'BD-PORTAL-002',
    title: 'Portal page loaded; server side unobservable',
    role: 'component',
    component: 'portal',
    condition: 'portal page = loaded',
    evaluate(ctx) {
      if (ctx.value('portal.page') !== 'page_loaded') return null;
      return {
        consumes: ['portal.page'],
        evidence: 'PARTIAL',
        outcome: 'pass',
        effects: {
          portal: { status: 'not_verified', summary: 'Page loaded in the browser. Server-side signing state cannot be verified locally.' },
        },
        explanation:
          'The extension can see that the page loaded. It cannot see portal server state, so the portal component stays not_verified by design.',
        plain: 'The page opened, but BridgeDoctor cannot see what happens on the portal’s servers.',
      };
    },
  },

  // ---------------------------------------------------------------------------------------------
  // Browser
  // ---------------------------------------------------------------------------------------------
  {
    id: 'BD-BRW-001',
    title: 'Browser-side observation of the local request',
    role: 'component',
    component: 'browser',
    condition: 'extension observed a request (or error) for the local endpoint',
    evaluate(ctx) {
      const v = ctx.value('browser.local_request');
      if (v === 'request_succeeded') {
        return {
          consumes: ['browser.local_request'],
          evidence: 'PARTIAL',
          outcome: 'pass',
          effects: { browser: { status: 'healthy', summary: 'Local request completed.' } },
          explanation:
            'The extension saw the request complete. Extensions cannot observe every browser communication event, so this is PARTIAL and mainly used to corroborate other rules.',
          plain: 'The browser reached the local helper.',
        };
      }
      if (v.startsWith('net_err_')) {
        const code = ctx.obs('browser.local_request').detail.browserError ?? v;
        return {
          consumes: ['browser.local_request'],
          evidence: 'PARTIAL',
          outcome: 'warn',
          effects: {
            browser: { status: 'healthy', summary: `Browser worked, but the local request failed (${code}).` },
          },
          explanation:
            `The extension reported ${code}. The browser itself is functioning; the error points downstream. It is PARTIAL on its own and only ever corroborates a local rule.`,
          plain: 'The browser tried, but the local helper could not be reached or trusted.',
        };
      }
      return null;
    },
  },

  // ---------------------------------------------------------------------------------------------
  // No-failure verdict
  // ---------------------------------------------------------------------------------------------
  {
    id: 'BD-OK-001',
    title: 'No simulated failure detected',
    role: 'diagnostic',
    component: 'service',
    condition: 'every local check passes AND portal page loaded without error',
    evaluate(ctx) {
      if (ctx.value('portal.page') !== 'page_loaded') return null;
      if (!allLocalChecksPass(ctx)) return null;
      return {
        consumes: [],
        evidence: 'PARTIAL',
        outcome: 'pass',
        finding: 'no_failure_detected',
        effects: {},
        explanation:
          'No failure signal was observed. Absence of evidence is classed PARTIAL: it cannot rule out portal-side or browser trust-store causes, so confidence is capped at MEDIUM.',
        plain: 'No problem was seen in any simulated check.',
        unverified: ['Whether signing would succeed on the real GST portal'],
      };
    },
  },
];

/** Fallback for observations that no rule recognised. Applied by the engine, never silently dropped. */
export const FALLBACK_RULE = {
  id: 'BD-GEN-001',
  title: 'Unrecognised observation',
  condition: 'observation not consumed by any other rule',
} as const;

export const RULE_PRIORITY: string[] = RULES.filter((r) => r.role === 'diagnostic').map((r) => r.id);
