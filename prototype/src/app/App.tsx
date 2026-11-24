import { useEffect } from 'react';
import { GuidedDemo } from '../components/GuidedDemo';
import { TopNav } from '../components/TopNav';
import { InsightsPage } from '../pages/InsightsPage';
import { JudgePage } from '../pages/JudgePage';
import { OverviewPage } from '../pages/OverviewPage';
import { SecurityPage } from '../pages/SecurityPage';
import { WorkbenchPage } from '../pages/WorkbenchPage';
import { WorkbenchProvider, useWorkbench } from './WorkbenchContext';

function Shell() {
  const { route, guidedActive } = useWorkbench();

  // New page = start at the top. Skipped during the guided demo, which scrolls to its own targets.
  useEffect(() => {
    if (!guidedActive) window.scrollTo({ top: 0 });
  }, [route, guidedActive]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <TopNav />
      <main id="main" tabIndex={-1}>
        {route === 'overview' && <OverviewPage />}
        {route === 'workbench' && <WorkbenchPage />}
        {route === 'insights' && <InsightsPage />}
        {route === 'security' && <SecurityPage />}
        {route === 'judge' && <JudgePage />}
      </main>
      <footer className="footer">
        <span>BridgeDoctor · hackathon prototype</span>
        <span>All data shown is simulated. Not a real system diagnostic, and not production-ready.</span>
      </footer>
      <GuidedDemo />
    </>
  );
}

export function App() {
  return (
    <WorkbenchProvider>
      <Shell />
    </WorkbenchProvider>
  );
}
