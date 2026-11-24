import type { FindingCode, Recommendation } from '../types';

/**
 * Safe, non-destructive guidance per finding.
 *
 * Principles:
 *  - Simple language first; the technical note is optional.
 *  - Never instruct the user to bypass certificate warnings, kill processes, change firewall
 *    settings or share a DSC PIN.
 *  - Always point to official GST or vendor guidance for the actual fix.
 */
export const RECOMMENDATIONS: Record<FindingCode, Recommendation> = {
  no_failure_detected: {
    headline: 'All simulated checks passed.',
    caveat: 'This does not guarantee successful signing on the real GST portal.',
    whatHappened:
      'Every simulated check finished without a failure signal: the helper, the certificate properties and the token module all looked normal.',
    why: ['No failure signal was observed. That is not the same as proof that signing will work.'],
    check: [
      'The simulated checks passed. Real signing success is not guaranteed.',
      'If signing still fails, check portal-side status and official GST support guidance.',
    ],
    avoid: [
      'Do not treat this result as a guarantee.',
      'Never enter a DSC PIN into BridgeDoctor.',
    ],
    technical:
      'BD-OK-001 fires only when every local check is positive. Absence of failure signals is classed PARTIAL because it cannot exclude portal-side or trust-store causes, so confidence is capped at MEDIUM.',
  },

  local_service_unavailable: {
    headline: 'Likely local signing service unavailable.',
    whatHappened:
      'The program that should receive the signing request on this computer does not appear to be running, and the computer refused the connection.',
    why: [
      'The signing helper may not be installed, or may have been closed.',
      'It may have stopped after a restart or a crash.',
    ],
    check: [
      'Check whether the signing helper is installed and running. Follow the official GST or vendor instructions.',
      'Confirm which helper your DSC vendor or the GST guidance says should be running.',
    ],
    avoid: [
      'Do not download helper programs from unofficial sources.',
      'Do not disable security software just to try to fix this.',
      'BridgeDoctor does not start, stop or repair services.',
    ],
    technical:
      'BD-SVC-001: process = absent AND endpoint = connection_refused. A refusal (not a timeout) means the host answered and nothing was listening. The browser-side net::ERR_CONNECTION_REFUSED corroborates, giving STRONG evidence and HIGH confidence.',
  },

  local_endpoint_unreachable: {
    headline: 'Local endpoint could not be reached.',
    whatHappened:
      'Neither the browser nor the diagnostic probe received an answer from the expected local address, and the checks that could explain why were incomplete.',
    why: [
      'The helper may be listening on a different address or port than expected.',
      'A configuration issue or port conflict may exist. This run has no evidence that identifies one.',
      'Something may be blocking local connections. This run has no evidence for or against that.',
    ],
    check: [
      'Check whether the expected local helper is listening.',
      'Investigate configuration or port conflicts, comparing the configured port with your vendor documentation.',
    ],
    avoid: [
      'BridgeDoctor does not automatically kill processes or modify firewall settings.',
      'Do not assume another program is using the port: nothing here identifies one.',
    ],
    technical:
      'BD-SVC-002: endpoint = no_response_timeout with process and listener undetermined. PARTIAL evidence caps confidence at MEDIUM. A conflicting process is deliberately not named because no observation supports it.',
  },

  certificate_validity_issue: {
    headline: 'Certificate property issue detected.',
    caveat: 'Certificate inspection does not establish whether Chrome trusts the certificate.',
    whatHappened:
      "The secure certificate presented by the local helper is outside its validity period, and the browser reported a matching error.",
    why: [
      'The certificate may have expired and need renewal.',
      "The computer's date and time may be incorrect, so a valid certificate looks expired.",
    ],
    check: [
      'Inspect certificate validity and hostname. Follow official GST instructions.',
      "Check that the computer's date and time are correct.",
    ],
    avoid: [
      'Do not blindly bypass certificate warnings.',
      'Do not install certificates from unofficial sources.',
    ],
    technical:
      'BD-TLS-001: certificate notAfter precedes the simulated clock; browser net::ERR_CERT_DATE_INVALID corroborates. Hostname names matched. Chain trust was not evaluated, and inspection alone cannot show Chrome trusts a certificate.',
  },

  certificate_hostname_issue: {
    headline: 'Certificate hostname issue detected.',
    caveat: 'Certificate inspection does not establish whether Chrome trusts the certificate.',
    whatHappened: 'The local helper presents a certificate issued for a different name than the one the browser uses.',
    why: [
      'The helper may be configured with a certificate meant for another address.',
      'A configuration change may have altered the address or the certificate.',
    ],
    check: [
      'Inspect certificate validity and hostname. Follow official GST instructions.',
      'Compare the certificate names with the address the portal uses.',
    ],
    avoid: [
      'Do not blindly bypass certificate warnings.',
      'Do not install certificates from unofficial sources.',
    ],
    technical: 'BD-TLS-002: certificate SAN list does not include the connected address. No predefined scenario exercises this rule.',
  },

  token_not_verified: {
    headline: 'Token integration could not be verified.',
    whatHappened:
      "BridgeDoctor could not confirm that the token's software module is available, so it cannot say whether the token is usable.",
    why: [
      "The vendor's PKCS#11 module may not be installed or configured.",
      'Different token vendors need different modules, so the expected one may not be set up.',
    ],
    check: [
      'Check the supported token driver and vendor PKCS#11 module.',
      "Follow your DSC vendor's installation guidance.",
    ],
    avoid: [
      'Never enter a DSC PIN into BridgeDoctor.',
      'Do not conclude that the token is missing or faulty: this run did not observe that.',
    ],
    technical:
      'BD-TOKEN-001: PKCS#11 module = unknown, so slot enumeration was not attempted and token status is not_verified. PKCS#11 is the interface, not the token.',
  },

  inconclusive: {
    headline: 'Cause remains inconclusive.',
    whatHappened:
      'All local checks looked normal, but the portal reported a generic signing failure. The evidence does not point to a cause BridgeDoctor can identify.',
    why: [
      'The cause may be on the portal side.',
      'It may involve a session or account condition that local checks cannot see.',
    ],
    check: [
      'Local evidence does not establish the cause. Check portal-side status and official GST support guidance.',
    ],
    avoid: [
      'Do not change local settings on the basis of this result.',
      'Do not assume the local computer is at fault.',
    ],
    technical:
      'BD-PORTAL-001: all local checks pass while the portal response is a generic error. The rule produces UNDETERMINED evidence, so confidence is INCONCLUSIVE. The engine does not force a diagnosis.',
  },
};
