import { Compass } from 'lucide-react';
import { useWorkbench } from '../app/WorkbenchContext';
import { ROUTES } from '../hooks/useHashRoute';

/** Brand mark: a signal line that breaks and reconnects. */
export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="brand-mark">
      <rect x="1" y="1" width="30" height="30" rx="3" fill="none" stroke="currentColor" strokeOpacity=".35" />
      <path d="M4 20h6l3-8 4 13 3-9h8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="26" cy="7" r="2" fill="var(--amber)" />
    </svg>
  );
}

export function TopNav() {
  const { route, guidedActive, setGuidedActive, setGuidedStep } = useWorkbench();
  const startGuided = () => {
    setGuidedStep(0);
    setGuidedActive(true);
  };
  return (
    <header className="topbar">
      <div className="sim-strip" role="note">
        <span className="dot" aria-hidden /> INTERACTIVE PROTOTYPE — SIMULATED DATA · No real computer, portal or token is inspected
      </div>
      <div className="topbar-row">
        <a className="brand" href="#/overview" aria-label="BridgeDoctor home">
          <BrandMark />
          <span className="brand-name">
            Bridge<span>Doctor</span>
          </span>
        </a>
        <nav className="nav" aria-label="Main">
          {ROUTES.map((r) => (
            <a key={r.id} href={`#/${r.id}`} aria-current={route === r.id ? 'page' : undefined} className={route === r.id ? 'is-on' : ''}>
              {r.label}
            </a>
          ))}
        </nav>
        <button type="button" className="btn btn-outline btn-sm" onClick={startGuided} disabled={guidedActive}>
          <Compass size={15} aria-hidden /> Guided demo
        </button>
      </div>
    </header>
  );
}
