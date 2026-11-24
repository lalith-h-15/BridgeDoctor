import { STAGES } from '../data/components';
import { useWorkbench } from '../app/WorkbenchContext';
import type { StageState } from '../types';
import { STAGE_STATE_LABEL, STATE_ICON, type VisualState } from './icons';

const TO_VISUAL: Record<StageState, VisualState> = {
  pending: 'pending',
  running: 'running',
  passed: 'healthy',
  warning: 'warning',
  failed: 'failed',
  not_verified: 'not_verified',
};

/** Seven-stage timeline. Final states come from the engine, so it differs per scenario. */
export function DiagnosisTimeline() {
  const { diagnosis, phase, revealed } = useWorkbench();

  const stateOf = (i: number): { state: StageState; summary: string | null } => {
    if (!diagnosis || phase === 'idle') return { state: 'pending', summary: null };
    if (phase === 'complete' || i < revealed) return { state: diagnosis.stages[i].state, summary: diagnosis.stages[i].summary };
    if (i === revealed) return { state: 'running', summary: null };
    return { state: 'pending', summary: null };
  };

  return (
    <ol className="timeline" data-demo="timeline" aria-label="Diagnostic timeline">
      {STAGES.map((stage, i) => {
        const { state, summary } = stateOf(i);
        const visual = TO_VISUAL[state];
        const Icon = STATE_ICON[visual];
        return (
          <li key={stage.id} className={`tl-item tl-${visual}`} aria-current={state === 'running' ? 'step' : undefined}>
            <span className="tl-marker">
              <Icon size={16} aria-hidden className={state === 'running' ? 'spin' : undefined} />
            </span>
            <span className="tl-body">
              <span className="tl-num">{String(stage.index).padStart(2, '0')}</span>
              <span className="tl-label">{stage.label}</span>
              <span className="tl-state">{STAGE_STATE_LABEL[visual]}</span>
              <span className="tl-summary">{summary ?? stage.description}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
