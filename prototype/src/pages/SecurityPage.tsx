import { Ban, Check, ShieldCheck } from 'lucide-react';
import { SecurityBoundary } from '../components/SecurityBoundary';
import { SectionHead, SimBadge } from '../components/ui';

const DOES = [
  'Uses predefined local mock data bundled with the page.',
  'Runs entirely in your browser tab. No request leaves the page while you use it.',
  'Builds the JSON report locally and hands it to your browser as a download.',
];

const DOES_NOT = [
  'Does not connect to GST.',
  'Does not access real Windows processes.',
  'Does not inspect physical USB tokens.',
  'Does not access private keys.',
  'Does not collect PINs.',
  'Does not sign documents.',
  'Does not upload documents.',
  'Does not modify certificate trust settings.',
  'Does not execute arbitrary shell commands.',
  'Does not automatically repair the user’s computer.',
];

const PROPOSED = [
  'Read-only probes: observe, never change.',
  'PKCS#11 queries limited to calls that do not need a login. The PIN is never requested.',
  'Native Messaging restricted to an explicitly allow-listed extension.',
  'Reports limited to minimal diagnostic facts, with no documents, keys or PINs.',
];

export function SecurityPage() {
  return (
    <div className="page security">
      <SectionHead eyebrow="Security & privacy" title="What this prototype can and cannot touch" right={<SimBadge>Interactive Prototype — Simulated Data</SimBadge>}>
        The safest diagnostic is one that cannot reach anything sensitive. This prototype is built that way, and the real design aims for the same restraint.
      </SectionHead>

      <section className="panel" aria-label="Security boundary diagram">
        <h2 className="h-mini">Security boundary</h2>
        <SecurityBoundary />
      </section>

      <div className="two-col">
        <section className="panel" aria-label="What the prototype does">
          <h2 className="h-mini"><ShieldCheck size={16} aria-hidden /> What it does</h2>
          <ul className="check-list is-yes">
            {DOES.map((t) => (
              <li key={t}><Check size={16} aria-hidden /> {t}</li>
            ))}
          </ul>
        </section>
        <section className="panel" aria-label="What the prototype does not do">
          <h2 className="h-mini"><Ban size={16} aria-hidden /> What it does not do</h2>
          <ul className="check-list is-no">
            {DOES_NOT.map((t) => (
              <li key={t}><Ban size={15} aria-hidden /> {t}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel" aria-label="Proposed design principles">
        <h2 className="h-mini">Proposed principles for the real system <span className="tag-planned">Planned, not implemented</span></h2>
        <ul className="plain-list">
          {PROPOSED.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="dim small">These describe the intended design. None of it is built or tested in this prototype.</p>
      </section>
    </div>
  );
}
