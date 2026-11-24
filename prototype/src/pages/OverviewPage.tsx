import { ArrowRight, Compass, Lock, ScanSearch, Waypoints, Workflow, Eye } from 'lucide-react';
import { COMPONENTS } from '../data/components';
import { useWorkbench } from '../app/WorkbenchContext';
import { COMPONENT_ICON } from '../components/icons';
import { SimBadge } from '../components/ui';

/** Decorative hero: the five-link chain with one link that flickers, hinting at "where does it break?". */
function HeroMap() {
  return (
    <div className="hero-map" aria-hidden>
      {COMPONENTS.map((c, i) => {
        const Icon = COMPONENT_ICON[c.id];
        return (
          <div className="hero-cell" key={c.id}>
            <div className={`hero-node${i === 2 ? ' is-suspect' : ''}`}>
              <Icon size={24} strokeWidth={1.5} />
              <span className="hero-node-name">{c.name}</span>
              <span className="hero-led" />
            </div>
            {i < COMPONENTS.length - 1 && <span className={`hero-edge${i === 1 ? ' is-broken' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
}

export function OverviewPage() {
  const { navigate, setGuidedStep, setGuidedActive, guidedActive } = useWorkbench();
  return (
    <div className="page overview">
      <section className="hero" data-demo="hero">
        <div className="hero-copy">
          <SimBadge>Interactive Prototype — Simulated Data</SimBadge>
          <h1 className="h-hero">Find where your GST digital-signature workflow breaks.</h1>
          <p className="lede">
            When signing fails, the portal rarely says <em>which</em> link in the chain gave way. BridgeDoctor is a proposed diagnostic assistant that combines what the browser saw with checks on the local signing setup, weighs the evidence, and says where it points, and where it cannot tell.
          </p>
          <div className="cta">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate('workbench')}>
              <ScanSearch size={18} aria-hidden /> Start Diagnosis
            </button>
            <button type="button" className="btn btn-outline btn-lg" onClick={() => navigate('judge')}>
              <Workflow size={18} aria-hidden /> Explore Architecture
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-lg"
              disabled={guidedActive}
              onClick={() => {
                setGuidedStep(0);
                setGuidedActive(true);
              }}
            >
              <Compass size={18} aria-hidden /> 2-minute guided demo
            </button>
          </div>
          <p className="privacy-line">
            <Lock size={14} aria-hidden /> Privacy: this prototype runs on predefined local sample data. It does not connect to GST, read your computer, inspect a token or ask for a PIN.
          </p>
        </div>
        <HeroMap />
      </section>

      <section className="trio" aria-label="About BridgeDoctor">
        <article className="panel">
          <h2 className="h-mini">Why it exists</h2>
          <p>
            A signing failure looks the same from the outside. The cause could be a stopped helper, a certificate, a token module, or the portal itself, and users cannot tell which. BridgeDoctor does not assume the local computer is always to blame.
          </p>
        </article>
        <article className="panel">
          <h2 className="h-mini">What it investigates</h2>
          <ul className="inv-list">
            {COMPONENTS.map((c, i) => {
              const Icon = COMPONENT_ICON[c.id];
              return (
                <li key={c.id}>
                  <Icon size={16} aria-hidden /> <span>{c.name}</span>
                  {i < COMPONENTS.length - 1 && <ArrowRight size={12} aria-hidden className="dim" />}
                </li>
              );
            })}
          </ul>
        </article>
        <article className="panel">
          <h2 className="h-mini">How the diagnosis works</h2>
          <ol className="how">
            <li><Eye size={15} aria-hidden /> <b>Observe</b> what Chrome saw</li>
            <li><Waypoints size={15} aria-hidden /> <b>Probe</b> process, port, TLS, PKCS#11</li>
            <li><Workflow size={15} aria-hidden /> <b>Correlate</b> through rules, grading evidence</li>
            <li><ScanSearch size={15} aria-hidden /> <b>Explain</b> finding, confidence, unknowns</li>
          </ol>
          <p className="dim small">Observation and probing are the proposed design. In this prototype they are simulated.</p>
        </article>
      </section>
    </div>
  );
}
