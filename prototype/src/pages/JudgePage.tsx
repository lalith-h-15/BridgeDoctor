import { ArrowDown, FlaskConical, Hammer, Rocket } from 'lucide-react';
import { useWorkbench } from '../app/WorkbenchContext';
import { ScenarioPicker } from '../components/ScenarioPicker';
import { Collapsible, EvidenceBadge, RuleChip, SectionHead, SimBadge } from '../components/ui';
import { ALL_DIAGNOSES } from '../engine/diagnosticEngine';
import { RULES } from '../engine/diagnosticRules';
import { COMPONENT_BY_ID } from '../data/components';

type ProtoStatus = 'implemented' | 'simulated' | 'not_implemented';

const STATUS_META: Record<ProtoStatus, { label: string; Icon: typeof Rocket }> = {
  implemented: { label: 'Implemented · runs on simulated input', Icon: Rocket },
  simulated: { label: 'Simulated in this prototype', Icon: FlaskConical },
  not_implemented: { label: 'Not implemented', Icon: Hammer },
};

const LAYERS: { name: string; detail: string; status: ProtoStatus }[] = [
  { name: 'Chrome Extension', detail: 'Proposed: observes page state and the browser’s own errors for requests to the local endpoint. It cannot see every browser event.', status: 'simulated' },
  { name: 'Native Messaging', detail: 'Proposed: Chrome’s sanctioned channel to a local host. Messages are length-prefixed JSON over standard input and output.', status: 'not_implemented' },
  { name: 'Windows Diagnostic Host', detail: 'Proposed: a local program that runs read-only probes on request. No repair actions.', status: 'not_implemented' },
  { name: 'Process / Port / TLS / PKCS#11 observations', detail: 'Proposed: process scan, listener table, certificate properties, PKCS#11 module and slot queries that need no login.', status: 'simulated' },
  { name: 'Evidence Correlation Engine', detail: 'Deterministic rules grade evidence, pick a finding and set a qualitative confidence. Real TypeScript in src/engine.', status: 'implemented' },
  { name: 'Explainable Diagnostic Report', detail: 'Finding, confidence category, evidence, triggered rules, recommendations and unverified conditions.', status: 'implemented' },
];

const FEATURES: { feature: string; proposed: string; proto: string; status: ProtoStatus }[] = [
  { feature: 'Browser-side observation', proposed: 'Extension reports request errors and page state', proto: 'Scripted observations per scenario', status: 'simulated' },
  { feature: 'Local probes', proposed: 'Windows host: process, port, TLS properties, PKCS#11', proto: 'Scripted observations per scenario', status: 'simulated' },
  { feature: 'Rule engine and evidence grading', proposed: 'Deterministic rules with evidence classes', proto: 'Working engine, deterministic rule catalogue', status: 'implemented' },
  { feature: 'Confidence and unverified list', proposed: 'Qualitative category plus what is unknown', proto: 'Working', status: 'implemented' },
  { feature: 'JSON report', proposed: 'Minimal, non-sensitive export', proto: 'Working, demonstration data only', status: 'implemented' },
  { feature: 'Native Messaging bridge', proposed: 'Extension to host, length-prefixed JSON', proto: 'None', status: 'not_implemented' },
  { feature: 'Vendor PKCS#11 module registry', proposed: 'Configurable per DSC vendor', proto: 'None', status: 'not_implemented' },
  { feature: 'Physical token testing', proposed: 'Per-vendor hardware validation', proto: 'None', status: 'not_implemented' },
];

const QA: { q: string; a: string }[] = [
  {
    q: 'Why not use a standalone EXE?',
    a: 'A standalone program sees the machine but not the browser. The browser’s own error for a failed request (refused, timed out, certificate rejected) is visible only from inside Chrome, and it is often the best corroboration for what local probes find. The proposed split is an extension for browser-side observations and a native host for operating-system observations, joined by Native Messaging, which Chrome limits to extensions the host explicitly allows. A standalone tool could still serve as a fallback; it just cannot correlate with what the browser saw.',
  },
  {
    q: 'How does BridgeDoctor differ from a generic port checker?',
    a: 'A port checker answers one question: is something listening? BridgeDoctor aims to combine several layers (the browser’s error, process, listener, certificate properties, PKCS#11 module), then report which layer the evidence implicates, how strong that evidence is and what remains unverified. This prototype makes no measured comparison with any other tool.',
  },
  {
    q: 'What does PKCS#11 do?',
    a: 'PKCS#11 (also called Cryptoki) is a standard C API that applications use to talk to cryptographic tokens. The token vendor supplies a module (a DLL on Windows) that implements it. PKCS#11 is the interface, not the token: a loaded module says nothing by itself about whether a token is present or usable.',
  },
  {
    q: 'How can token checks work without collecting the PIN?',
    a: 'Loading the module, initialising it, listing slots and reading token information do not require a login. The proposed host would never call the login function, never prompt for a PIN and never perform private-key operations. Vendor modules can differ in behaviour, which is one reason an unclear module result is reported as not verified instead of guessed.',
  },
  {
    q: 'Can TLS inspection prove Chrome trusts a certificate?',
    a: 'No. Inspecting the certificate a local endpoint presents tells you its properties: dates, names, issuer. Whether Chrome trusts it depends on chain building against Chrome’s trust configuration and policy, which a separate inspection cannot reproduce. BridgeDoctor therefore grades a healthy-looking certificate as PARTIAL evidence and says so. A browser-reported certificate error is a different, corroborating signal.',
  },
  {
    q: 'What if the GST portal itself is failing?',
    a: 'Then local checks can all pass while signing still fails. Rule BD-PORTAL-001 covers exactly that: all local checks pass and the portal reports a generic error. The evidence is UNDETERMINED, confidence is INCONCLUSIVE and the engine refuses to name a cause. Scenario F demonstrates it.',
  },
  {
    q: 'How are different DSC vendors supported?',
    a: 'Vendors ship different PKCS#11 modules. The proposed design keeps a configurable registry of module locations per vendor; when none matches, the token is reported as not verified (BD-TOKEN-001) rather than guessed. This is not implemented here. SoftHSM2 can simulate a software token for developing the probe, but it does not prove compatibility with physical USB DSC devices; that needs hardware testing per vendor.',
  },
  {
    q: 'How does the system handle uncertain evidence?',
    a: 'Evidence is STRONG, PARTIAL or UNDETERMINED. Confidence is HIGH, MEDIUM or INCONCLUSIVE. HIGH needs strong evidence plus an independent corroborating observation. Partial evidence, including “everything passed”, is capped at MEDIUM. Undetermined evidence gives INCONCLUSIVE. A list of unverified conditions is always shown. These are qualitative categories, not measured accuracy.',
  },
  {
    q: 'How is user privacy protected?',
    a: 'The proposed system would run locally, make read-only probes, never request or store a PIN, never read private keys, never upload documents and export only a minimal report. This prototype goes further by touching nothing real at all. The Security page shows the boundary.',
  },
];

export function JudgePage() {
  const { scenarioId } = useWorkbench();
  const d = ALL_DIAGNOSES[scenarioId];
  const fired = new Set(d.rules.map((r) => r.id));

  return (
    <div className="page judge">
      <SectionHead eyebrow="Judge mode" title="How it is built, and how honest it is about it" right={<SimBadge>Interactive Prototype — Simulated Data</SimBadge>}>
        The architecture below is a proposal. Each layer is tagged with what actually exists in this prototype.
      </SectionHead>

      <section className="panel" aria-label="Architecture">
        <h2 className="h-mini">Proposed architecture</h2>
        <ol className="arch">
          {LAYERS.map((l, i) => {
            const { label, Icon } = STATUS_META[l.status];
            return (
              <li key={l.name} className={`arch-layer st-${l.status}`}>
                <div className="arch-box">
                  <h3>{l.name}</h3>
                  <p>{l.detail}</p>
                  <span className={`proto-tag tag-${l.status}`}><Icon size={12} aria-hidden /> {label}</span>
                </div>
                {i < LAYERS.length - 1 && <ArrowDown size={20} aria-hidden className="arch-arrow" />}
              </li>
            );
          })}
        </ol>
        <div className="legend-row">
          {(Object.keys(STATUS_META) as ProtoStatus[]).map((k) => {
            const { label, Icon } = STATUS_META[k];
            return <span key={k} className={`proto-tag tag-${k}`}><Icon size={12} aria-hidden /> {label}</span>;
          })}
        </div>

        <h3 className="h-sub">Native Messaging framing (illustrative)</h3>
        <pre className="frame mono" tabIndex={0} aria-label="Illustrative native messaging frame">
{`[ 4-byte length ][ UTF-8 JSON body ]

{
  "type": "probe_request",          // illustrative message, not a defined protocol
  "checks": ["process", "port", "tls", "pkcs11_module"],
  "endpoint": "127.0.0.1:1585"       // port 1585 is the illustrative endpoint in this project
}`}
        </pre>
      </section>

      <section className="panel" aria-label="Prototype scope">
        <h2 className="h-mini">Proposed vs prototype</h2>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th scope="col">Capability</th><th scope="col">Proposed design</th><th scope="col">This prototype</th><th scope="col">Status</th></tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => {
                const { label, Icon } = STATUS_META[f.status];
                return (
                  <tr key={f.feature}>
                    <th scope="row">{f.feature}</th>
                    <td>{f.proposed}</td>
                    <td>{f.proto}</td>
                    <td><span className={`proto-tag tag-${f.status}`}><Icon size={12} aria-hidden /> {label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" aria-label="Engine trace">
        <div className="trace-head">
          <h2 className="h-mini">Engine trace for the selected scenario</h2>
        </div>
        <ScenarioPicker compact />
        <p className="dim small pad">Result: <b>{d.headline}</b> · confidence <span className="mono">{d.confidence}</span></p>
        <ol className="trace">
          {d.trace.map((t) => (
            <li key={t.step}>
              <span className="trace-n mono">{t.step}</span>
              <div>
                <b>{t.name}</b> <code className="mono dim small">{t.module}</code>
                <p>{t.summary}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel" aria-label="Rule catalogue">
        <h2 className="h-mini">Rule catalogue</h2>
        <p className="dim small">Rules fired in the selected scenario are highlighted. Every observation is consumed by exactly one rule.</p>
        <div className="table-scroll">
          <table className="data-table rules-table">
            <thead>
              <tr><th scope="col">Rule</th><th scope="col">Condition</th><th scope="col">Component</th><th scope="col">Role</th><th scope="col">Fired here</th></tr>
            </thead>
            <tbody>
              {RULES.map((r) => {
                const hit = d.rules.find((x) => x.id === r.id);
                return (
                  <tr key={r.id} className={fired.has(r.id) ? 'is-fired' : ''}>
                    <th scope="row"><RuleChip id={r.id} active={fired.has(r.id)} /><span className="rt-title">{r.title}</span></th>
                    <td className="mono small">{r.condition}</td>
                    <td>{COMPONENT_BY_ID[r.component].name}</td>
                    <td>{r.role}</td>
                    <td>{hit ? <>Yes <EvidenceBadge value={hit.evidence} /></> : <span className="dim">No</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" aria-label="Technical questions">
        <h2 className="h-mini">Technical questions</h2>
        <div className="qa">
          {QA.map((x, i) => (
            <Collapsible key={x.q} title={<span><span className="qa-n mono">{String(i + 1).padStart(2, '0')}</span> {x.q}</span>} className="qa-item">
              <p>{x.a}</p>
            </Collapsible>
          ))}
        </div>
      </section>
    </div>
  );
}
