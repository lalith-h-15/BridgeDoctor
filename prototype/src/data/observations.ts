import type { CheckId, Observation } from '../types';

/**
 * Deterministic mock observations.
 *
 * Every scenario starts from the same "healthy" baseline and overrides only the checks that differ.
 * That keeps the six scenarios coherent: any difference in a diagnosis is traceable to a
 * visible difference in the observations below.
 *
 * ALL VALUES ARE SIMULATED. Nothing is read from a real machine, browser, portal or token.
 */

export const LOCAL_ENDPOINT = 'https://127.0.0.1:1585';
export const LOCAL_SOCKET = '127.0.0.1:1585';

const BASELINE: Record<CheckId, Observation> = {
  'portal.page': {
    id: 'obs-portal-page',
    check: 'portal.page',
    component: 'portal',
    expected: 'page_loaded',
    actual: 'page_loaded',
    source: 'simulated_extension_observer',
    tOffsetMs: 40,
    detail: {
      observed: 'Portal tab finished loading',
      limit: 'Server-side signing state is not observable',
    },
    plain: 'The GST page was open and loaded in the browser tab.',
    simulated: true,
  },
  'browser.local_request': {
    id: 'obs-browser-request',
    check: 'browser.local_request',
    component: 'browser',
    expected: 'request_succeeded',
    actual: 'request_succeeded',
    target: LOCAL_ENDPOINT,
    source: 'simulated_extension_observer',
    tOffsetMs: 140,
    detail: {
      browserError: 'none',
      limit: 'Extensions cannot observe every browser communication event',
    },
    plain: "The browser's request to the local signing helper completed.",
    simulated: true,
  },
  'service.process': {
    id: 'obs-service-process',
    check: 'service.process',
    component: 'service',
    expected: 'process_running',
    actual: 'process_running',
    source: 'simulated_process_scan',
    tOffsetMs: 260,
    detail: { expectedProcess: 'dsc-signing-helper (illustrative name)', matches: '1' },
    plain: 'The signing helper program is running on this computer.',
    simulated: true,
  },
  'service.endpoint': {
    id: 'obs-service-endpoint',
    check: 'service.endpoint',
    component: 'service',
    expected: 'endpoint_responding',
    actual: 'endpoint_responding',
    target: LOCAL_ENDPOINT,
    source: 'simulated_local_probe',
    tOffsetMs: 330,
    detail: { probe: 'TLS connect + HTTP GET /', result: 'HTTP response received' },
    plain: 'The helper answered at its local address.',
    simulated: true,
  },
  'port.listener': {
    id: 'obs-port-listener',
    check: 'port.listener',
    component: 'service',
    expected: 'listening',
    actual: 'listening',
    target: LOCAL_SOCKET,
    source: 'simulated_port_scan',
    tOffsetMs: 400,
    detail: { socketState: 'LISTEN', bind: LOCAL_SOCKET },
    plain: 'A program is listening on the expected local port.',
    simulated: true,
  },
  'tls.certificate': {
    id: 'obs-tls-certificate',
    check: 'tls.certificate',
    component: 'tls',
    expected: 'valid_properties',
    actual: 'valid_properties',
    target: LOCAL_ENDPOINT,
    source: 'simulated_tls_inspector',
    tOffsetMs: 520,
    detail: {
      subjectAltName: '127.0.0.1, localhost',
      notBefore: '2025-02-01',
      notAfter: '2027-01-31',
      simulatedClock: '2026-03-02',
      inspectionMode: 'properties only - no trust evaluation',
    },
    plain: 'The certificate dates and hostname look correct.',
    simulated: true,
  },
  'token.pkcs11_module': {
    id: 'obs-token-module',
    check: 'token.pkcs11_module',
    component: 'token',
    expected: 'module_loaded',
    actual: 'module_loaded',
    source: 'simulated_pkcs11_probe',
    tOffsetMs: 640,
    detail: { module: 'vendor_pkcs11.dll (illustrative)', C_Initialize: 'CKR_OK', pinHandling: 'never requested' },
    plain: "The token vendor's software module loaded.",
    simulated: true,
  },
  'token.slot': {
    id: 'obs-token-slot',
    check: 'token.slot',
    component: 'token',
    expected: 'token_present',
    actual: 'token_present',
    source: 'simulated_pkcs11_probe',
    tOffsetMs: 700,
    detail: { C_GetSlotList: '1 slot with a token', C_Login: 'never called' },
    plain: 'A token was visible through the module (simulated).',
    simulated: true,
  },
};

type Override = Partial<Omit<Observation, 'id' | 'check' | 'component' | 'simulated'>>;
export type ObservationOverrides = Partial<Record<CheckId, Override>>;

const CHECK_ORDER: CheckId[] = [
  'portal.page',
  'browser.local_request',
  'service.process',
  'service.endpoint',
  'port.listener',
  'tls.certificate',
  'token.pkcs11_module',
  'token.slot',
];

/** Build the full observation list for a scenario: baseline + overrides, ids prefixed per scenario. */
export function buildObservations(scenarioId: string, overrides: ObservationOverrides): Observation[] {
  return CHECK_ORDER.map((check) => {
    const base = BASELINE[check];
    const o = overrides[check] ?? {};
    return {
      ...base,
      ...o,
      id: `${scenarioId}:${base.id}`,
      detail: { ...base.detail, ...(o.detail ?? {}) },
    };
  });
}

/** Per-scenario differences from the healthy baseline. */
export const OVERRIDES: Record<string, ObservationOverrides> = {
  A: {},

  // B - the helper is not running: process absent, connection refused, nothing listening.
  B: {
    'browser.local_request': {
      actual: 'net_err_connection_refused',
      detail: { browserError: 'net::ERR_CONNECTION_REFUSED' },
      plain: 'The browser tried to reach the local signing helper and the connection was refused.',
    },
    'service.process': {
      actual: 'process_absent',
      detail: { matches: '0' },
      plain: 'No running signing helper was found on this (simulated) computer.',
    },
    'service.endpoint': {
      actual: 'connection_refused',
      detail: { result: 'TCP connection refused' },
      plain: 'Nothing accepted a connection at the local address.',
    },
    'port.listener': {
      actual: 'not_listening',
      detail: { socketState: 'no LISTEN entry for 127.0.0.1:1585' },
      plain: 'No program is listening on the expected local port.',
    },
    'tls.certificate': {
      actual: 'not_inspectable',
      detail: { reason: 'No listener was available to present a certificate', inspectionMode: 'not performed' },
      plain: 'There was nothing to inspect, because nothing answered.',
    },
  },

  // C - endpoint silent, but process and port evidence are incomplete. Must NOT name a conflicting process.
  C: {
    'browser.local_request': {
      actual: 'net_err_timed_out',
      detail: { browserError: 'net::ERR_TIMED_OUT' },
      plain: 'The browser waited for the local helper but received no answer.',
    },
    'service.process': {
      actual: 'process_undetermined',
      detail: { matches: 'ambiguous', note: 'Process list could not be matched unambiguously to the helper name' },
      plain: 'The scan could not tell whether the signing helper is running.',
    },
    'service.endpoint': {
      actual: 'no_response_timeout',
      detail: { result: 'No accept and no refusal within the probe window' },
      plain: 'The local address did not answer.',
    },
    'port.listener': {
      actual: 'listener_undetermined',
      detail: { socketState: 'listener table query incomplete in this run' },
      plain: 'The check of which program holds the port did not complete.',
    },
    'tls.certificate': {
      actual: 'not_inspectable',
      detail: { reason: 'Endpoint did not answer', inspectionMode: 'not performed' },
      plain: 'There was nothing to inspect, because the address did not answer.',
    },
  },

  // D - everything answers, but the certificate is past its end date.
  D: {
    'browser.local_request': {
      actual: 'net_err_cert_date_invalid',
      detail: { browserError: 'net::ERR_CERT_DATE_INVALID' },
      plain: "The browser refused the local helper's certificate because of its dates.",
    },
    'service.endpoint': {
      detail: { result: 'Handshake completed for inspection only; chain verification not performed' },
    },
    'tls.certificate': {
      actual: 'expired',
      detail: { notBefore: '2025-02-01', notAfter: '2026-01-31', hostnameMatch: 'yes (SAN 127.0.0.1, localhost)' },
      plain: "The helper's certificate is past its end date.",
    },
  },

  // E - the service is healthy; the PKCS#11 module is not configured, so the token cannot be checked.
  E: {
    'token.pkcs11_module': {
      actual: 'module_unknown',
      detail: {
        module: 'none configured for the detected token vendor',
        C_Initialize: 'not attempted',
      },
      plain: "The software module needed to talk to the token isn't set up, or couldn't be identified.",
    },
    'token.slot': {
      actual: 'not_checked',
      detail: { C_GetSlotList: 'not attempted', reason: 'Slot enumeration requires a loaded module' },
      plain: 'The token itself could not be checked.',
    },
  },

  // F - all local checks pass; the portal shows a generic failure with no observable cause.
  F: {
    'portal.page': {
      actual: 'page_loaded_signing_error_generic',
      detail: { observed: 'Portal showed a generic signing failure; no error code was observable' },
      plain: 'The GST page showed a general signing failure with no detail.',
    },
  },
};
