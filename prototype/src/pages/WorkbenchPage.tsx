import { FileJson, FileSearch, Wrench } from 'lucide-react';
import { useRef, type KeyboardEvent } from 'react';
import { useWorkbench, type WorkbenchTab } from '../app/WorkbenchContext';
import { DiagnosisTimeline } from '../components/DiagnosisTimeline';
import { EvidenceInspector } from '../components/EvidenceInspector';
import { ExportPanel } from '../components/ExportPanel';
import { RecommendationsPanel } from '../components/RecommendationsPanel';
import { ResultSummary } from '../components/ResultSummary';
import { RunComparison } from '../components/RunComparison';
import { RunControls } from '../components/RunControls';
import { ScenarioPicker } from '../components/ScenarioPicker';
import { SimBadge } from '../components/ui';
import { ViewToggle } from '../components/ViewToggle';
import { WorkflowDiagram } from '../components/WorkflowDiagram';

const TABS: { id: WorkbenchTab; label: string; Icon: typeof FileSearch }[] = [
  { id: 'evidence', label: 'Evidence Inspector', Icon: FileSearch },
  { id: 'actions', label: 'Recommended actions', Icon: Wrench },
  { id: 'export', label: 'JSON report', Icon: FileJson },
];

/** The main screen: scenario -> run -> workflow map -> timeline -> result -> evidence -> actions. */
export function WorkbenchPage() {
  const { scenario, tab, setTab } = useWorkbench();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = TABS.findIndex((t) => t.id === tab);
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;
    e.preventDefault();
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="page wb">
      <header className="wb-head">
        <div>
          <p className="eyebrow">Digital signature diagnostic workbench</p>
          <h1 className="h-page">Where does the workflow break?</h1>
        </div>
        <div className="wb-head-right">
          <SimBadge>Interactive Prototype — Simulated Data</SimBadge>
          <ViewToggle />
        </div>
      </header>

      <section className="panel controls" aria-label="Scenario and controls">
        <div className="controls-top">
          <h2 className="h-mini">1 · Choose a scenario</h2>
        </div>
        <ScenarioPicker />
        <div className="controls-bottom">
          <h2 className="h-mini">2 · Run it</h2>
          <RunControls />
        </div>
      </section>

      <section className="panel stage" aria-label="Workflow map">
        <div className="symptom-bar">
          <div>
            <span className="symptom-label">Scenario {scenario.id} · what the user notices</span>
            <p className="symptom-text">{scenario.symptom}</p>
          </div>
          <p className="symptom-desc dim small">{scenario.description}</p>
        </div>
        <WorkflowDiagram />
        <DiagnosisTimeline />
      </section>

      <ResultSummary />

      <section className="panel tabs-panel" aria-label="Details">
        <div className="tablist" role="tablist" aria-label="Diagnosis details" onKeyDown={onTabKey}>
          {TABS.map(({ id, label, Icon }, i) => (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              id={`tab-${id}`}
              role="tab"
              type="button"
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              tabIndex={tab === id ? 0 : -1}
              className={tab === id ? 'is-on' : ''}
              onClick={() => setTab(id)}
            >
              <Icon size={16} aria-hidden /> {label}
            </button>
          ))}
        </div>
        <div className="tabpanel" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === 'evidence' && <EvidenceInspector />}
          {tab === 'actions' && <RecommendationsPanel />}
          {tab === 'export' && <ExportPanel />}
        </div>
      </section>

      <RunComparison />
    </div>
  );
}
