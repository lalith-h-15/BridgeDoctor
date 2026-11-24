import type { ComponentId, StageDefinition } from '../types';

export interface ComponentDefinition {
  id: ComponentId;
  name: string;
  /** One-line description shown on the workflow map. */
  description: string;
  /** What BridgeDoctor can and cannot see for this component. */
  visibility: string;
}

/** The signing workflow, in order: GST Portal -> Chrome -> Local Signing Service -> TLS -> PKCS#11 / token. */
export const COMPONENTS: ComponentDefinition[] = [
  {
    id: 'portal',
    name: 'GST Portal',
    description: 'Web application where the signing step is requested.',
    visibility: 'Only the page state in the browser tab is observable. Server-side state is never visible.',
  },
  {
    id: 'browser',
    name: 'Chrome Browser',
    description: 'Runs the portal page and contacts the local helper.',
    visibility: 'An extension can observe many, but not all, browser network events.',
  },
  {
    id: 'service',
    name: 'Local Signing Service',
    description: 'Helper program listening on this computer (illustrative port 1585).',
    visibility: 'Process, port and endpoint observations come from the proposed Windows diagnostic host.',
  },
  {
    id: 'tls',
    name: 'TLS Certificate',
    description: 'Certificate the local helper presents over HTTPS.',
    visibility: 'Properties can be inspected. Whether Chrome trusts the certificate cannot be proven this way.',
  },
  {
    id: 'token',
    name: 'PKCS#11 / DSC Token',
    description: 'Vendor PKCS#11 module and the token behind it.',
    visibility: 'PKCS#11 is the interface, not the token. Module and slot checks never need the PIN.',
  },
];

export const COMPONENT_BY_ID = Object.fromEntries(COMPONENTS.map((c) => [c.id, c])) as Record<
  ComponentId,
  ComponentDefinition
>;

/** The seven diagnostic stages, in the order the timeline plays them. */
export const STAGES: StageDefinition[] = [
  {
    id: 'browser',
    index: 1,
    label: 'Browser communication',
    description: 'What the browser observed when it contacted the local endpoint.',
    component: 'browser',
    checks: ['portal.page', 'browser.local_request'],
  },
  {
    id: 'service',
    index: 2,
    label: 'Local service availability',
    description: 'Is the signing helper running and answering?',
    component: 'service',
    checks: ['service.process', 'service.endpoint'],
  },
  {
    id: 'port',
    index: 3,
    label: 'Port observation',
    description: 'Is anything listening on the expected local port?',
    component: 'service',
    checks: ['port.listener'],
  },
  {
    id: 'tls',
    index: 4,
    label: 'TLS certificate properties',
    description: 'Dates and hostname of the certificate the helper presents.',
    component: 'tls',
    checks: ['tls.certificate'],
  },
  {
    id: 'token',
    index: 5,
    label: 'PKCS#11 / token availability',
    description: 'Is a PKCS#11 module available, and is a token visible through it?',
    component: 'token',
    checks: ['token.pkcs11_module', 'token.slot'],
  },
  {
    id: 'correlation',
    index: 6,
    label: 'Evidence correlation',
    description: 'Combine observations through the diagnostic rules.',
    component: null,
    checks: [],
  },
  {
    id: 'diagnosis',
    index: 7,
    label: 'Diagnosis generation',
    description: 'State the finding, confidence and what remains unverified.',
    component: null,
    checks: [],
  },
];
