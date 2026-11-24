import type { ComponentId, Scenario, ScenarioId } from '../types';
import { OVERRIDES, buildObservations } from './observations';

/** Fixed simulated clock so exports and charts are deterministic. */
export const SIMULATED_TIMESTAMP = '2026-03-02T10:30:00+05:30';

const make = (
  id: ScenarioId,
  title: string,
  blurb: string,
  symptom: string,
  symptomAt: ComponentId | null,
  description: string,
): Scenario => ({
  id,
  title,
  blurb,
  symptom,
  symptomAt,
  description,
  simulatedTimestamp: SIMULATED_TIMESTAMP,
  observations: buildObservations(id, OVERRIDES[id]),
});

export const SCENARIOS: Scenario[] = [
  make(
    'A',
    'Healthy environment',
    'Every check the simulation can run looks normal.',
    'No visible error. The user wants to confirm the setup before signing.',
    null,
    'The helper runs and answers, the certificate properties look valid and a token module is available in the simulation. A passing run is weaker evidence than a failing one, so it is never presented as a guarantee.',
  ),
  make(
    'B',
    'Local signing service stopped',
    'The helper is not running and refuses connections.',
    'The portal says it cannot connect to the signing utility.',
    'portal',
    'The simulated process scan finds no helper, the local probe is refused, and the browser reports a refused connection. Independent signals agree.',
  ),
  make(
    'C',
    'Local port unavailable',
    'The expected local address does not answer, and the reason is unclear.',
    'Signing is requested, nothing happens, and the browser eventually gives up.',
    'browser',
    'The endpoint is silent, but the process and port scans are incomplete. The engine reports an unreachable endpoint without naming a cause, because no observation identifies one.',
  ),
  make(
    'D',
    'TLS certificate issue',
    "The helper answers, but its certificate is past its end date.",
    "The browser warns about the local helper's certificate.",
    'browser',
    'Service, port and token checks pass. Only the certificate properties fail, and the browser-side error corroborates it.',
  ),
  make(
    'E',
    'Token / PKCS#11 module unavailable',
    'The helper is healthy, but no PKCS#11 module is configured.',
    "The helper starts, but the portal cannot list certificates from the token.",
    'portal',
    'The token layer cannot be verified because the vendor module is unknown. The simulation does not claim the physical token is absent.',
  ),
  make(
    'F',
    'Portal-side or inconclusive failure',
    'Local checks pass, but the portal reports a generic failure.',
    "The portal shows a generic 'signing failed' message although the local setup looks fine.",
    'portal',
    'No local check explains the failure. The engine declines to force a diagnosis and says the cause remains inconclusive.',
  ),
];

export const SCENARIO_BY_ID = Object.fromEntries(SCENARIOS.map((s) => [s.id, s])) as Record<ScenarioId, Scenario>;
export const DEFAULT_SCENARIO: ScenarioId = 'A';
