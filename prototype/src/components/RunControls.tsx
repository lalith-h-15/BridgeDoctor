import { Play, RotateCcw } from 'lucide-react';
import { STAGES } from '../data/components';
import { useWorkbench } from '../app/WorkbenchContext';

/** Run Diagnosis / Reset Demo, plus a compact progress read-out. */
export function RunControls() {
  const { phase, revealed, run, resetDemo, diagnosis } = useWorkbench();
  const running = phase === 'running';
  return (
    <div className="run-controls">
      <button type="button" className="btn btn-primary" data-demo="run" onClick={run} disabled={running}>
        <Play size={16} aria-hidden />
        {phase === 'complete' ? 'Run again' : running ? 'Running…' : 'Run Diagnosis'}
      </button>
      <button type="button" className="btn btn-ghost" onClick={resetDemo} data-demo="reset">
        <RotateCcw size={15} aria-hidden />
        Reset Demo
      </button>
      <div className="progress" role="status" aria-live="polite">
        <div className="progress-bar" aria-hidden>
          <span style={{ width: `${(phase === 'complete' ? STAGES.length : revealed) * (100 / STAGES.length)}%` }} />
        </div>
        <span className="progress-text">
          {phase === 'idle' && 'Ready'}
          {running && `Stage ${Math.min(revealed + 1, STAGES.length)} of ${STAGES.length}: ${STAGES[Math.min(revealed, STAGES.length - 1)].label}`}
          {phase === 'complete' && diagnosis && `Complete — ${STAGES.length} of ${STAGES.length} stages`}
        </span>
      </div>
    </div>
  );
}
