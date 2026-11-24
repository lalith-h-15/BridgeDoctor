import { MessageSquareWarning, X } from 'lucide-react';
import { COMPONENTS } from '../data/components';
import { useWorkbench } from '../app/WorkbenchContext';
import type { ComponentId, ComponentStatus, FocusKind } from '../types';
import { COMPONENT_ICON, type VisualState } from './icons';
import { RuleChip, StatusPill } from './ui';

/** A node becomes readable once the timeline stage that investigates it has finished (1-based stage count). */
const NODE_REVEAL: Record<ComponentId, number> = { portal: 1, browser: 1, service: 2, tls: 4, token: 5 };
/** Timeline stage indexes (0-based) during which a node is being scanned. */
const NODE_STAGES: Record<ComponentId, number[]> = { portal: [0], browser: [0], service: [1, 2], tls: [3], token: [4] };

const EDGE_LABEL = ['page', ':1585', 'TLS', 'API'];
const EDGE_NAME = [
  'GST Portal to Chrome Browser',
  'Chrome Browser to Local Signing Service',
  'Local Signing Service to TLS Certificate',
  'TLS Certificate to PKCS#11 / DSC Token',
];

const FLAG_TEXT: Record<Exclude<FocusKind, 'none'>, string> = {
  failure: 'Failure point',
  likely: 'Likely failure point',
  uncertain: 'Cause uncertain',
  unverified: 'Could not be verified',
};

type EdgeState = 'pending' | 'healthy' | 'warning' | 'failed' | 'not_verified' | 'inactive';

/**
 * The signing workflow as a connected instrument diagram.
 * Everything visual derives from the diagnosis: node status, edge state, failure marker.
 * Before a run, only the scenario's user-visible symptom is shown, never the answer.
 */
export function WorkflowDiagram() {
  const { scenario, diagnosis, phase, revealed, viewMode, selectedComponent, selectComponent } = useWorkbench();

  const nodeState = (id: ComponentId): { visual: VisualState; scanning: boolean; status: ComponentStatus | null } => {
    const scanning = phase === 'running' && NODE_STAGES[id].includes(revealed);
    const readable = diagnosis !== null && (phase === 'complete' || revealed >= NODE_REVEAL[id]);
    if (readable && diagnosis) {
      const status = diagnosis.components[id].status;
      return { visual: status, scanning, status };
    }
    return { visual: scanning ? 'running' : 'pending', scanning, status: null };
  };

  const states = COMPONENTS.map((c) => nodeState(c.id));

  // Edge i connects node i to node i+1. Once an edge fails or warns, later edges are 'inactive':
  // the signing flow never reaches them, whatever their own checks say.
  const edges: EdgeState[] = [];
  let interrupted = false;
  for (let i = 0; i < COMPONENTS.length - 1; i++) {
    const down = states[i + 1];
    if (down.status === null) {
      edges.push('pending');
    } else if (interrupted) {
      edges.push('inactive');
    } else {
      edges.push(down.status);
      if (down.status === 'failed' || down.status === 'warning') interrupted = true;
    }
  }

  return (
    <div className="diagram" data-demo="diagram" role="group" aria-label="Signing workflow map">
      <div className="diagram-grid">
        {COMPONENTS.map((c, i) => {
          const s = states[i];
          const Icon = COMPONENT_ICON[c.id];
          const result = diagnosis?.components[c.id];
          const isFocus = phase === 'complete' && diagnosis?.focus.component === c.id && diagnosis.focus.kind !== 'none';
          const showSymptom = scenario.symptomAt === c.id && !isFocus;
          const items = diagnosis?.evidence.filter((e) => e.component === c.id) ?? [];
          const worst = items.find((e) => e.outcome === 'fail') ?? items.find((e) => e.outcome === 'warn') ?? items.find((e) => e.outcome === 'unverified') ?? items[0];
          const summary = s.status && result ? result.summary : s.scanning ? 'Checking…' : 'Awaiting diagnosis.';
          return (
            <div className="diagram-cell" key={c.id}>
              <button
                type="button"
                className={`node node-${s.visual}${s.scanning ? ' is-scanning' : ''}${isFocus ? ` is-focus focus-${diagnosis?.focus.kind}` : ''}${selectedComponent === c.id ? ' is-selected' : ''}`}
                aria-pressed={selectedComponent === c.id}
                aria-label={`${c.name}. ${s.status ? `Status ${s.status.replace('_', ' ')}.` : 'Not yet checked.'} ${summary} Select to filter the evidence inspector.`}
                onClick={() => selectComponent(selectedComponent === c.id ? null : c.id)}
              >
                <span className="node-flag-row">
                  {isFocus && diagnosis && diagnosis.focus.kind !== 'none' && (
                    <span className={`node-flag flag-${diagnosis.focus.kind}`}>{FLAG_TEXT[diagnosis.focus.kind]}</span>
                  )}
                  {showSymptom && (
                    <span className="node-flag flag-symptom">
                      <MessageSquareWarning size={11} aria-hidden /> Symptom seen here
                    </span>
                  )}
                </span>
                <span className="node-top">
                  <span className="node-index">{String(i + 1).padStart(2, '0')}</span>
                  <span className="node-icon" aria-hidden>
                    <Icon size={22} strokeWidth={1.6} />
                  </span>
                  <StatusPill state={s.visual} compact />
                </span>
                <span className="node-name">{c.name}</span>
                <span className="node-desc">{c.description}</span>
                <span className="node-evidence">
                  <span className="node-evidence-label">Evidence</span>
                  <span className="node-evidence-text">{summary}</span>
                  {viewMode === 'technical' && s.status && result && (
                    <span className="node-tech">
                      {worst && (
                        <span className="mono node-actual">
                          {worst.check} = {worst.actual}
                        </span>
                      )}
                      <span className="node-rules">
                        {result.ruleIds.map((r) => (
                          <RuleChip key={r} id={r} />
                        ))}
                      </span>
                    </span>
                  )}
                </span>
              </button>
              {i < COMPONENTS.length - 1 && (
                <div className={`edge edge-${edges[i]}`} role="img" aria-label={`${EDGE_NAME[i]}: ${edges[i].replace('_', ' ')}`}>
                  <span className="edge-label mono">{EDGE_LABEL[i]}</span>
                  <span className="edge-line" />
                  {edges[i] === 'failed' && (
                    <span className="edge-break" aria-hidden>
                      <X size={14} strokeWidth={3} />
                    </span>
                  )}
                  {edges[i] === 'warning' && <span className="edge-break edge-break-warn" aria-hidden>!</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
