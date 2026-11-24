import { useWorkbench } from '../app/WorkbenchContext';

/** Simple View (plain language) / Technical View (rules and structured evidence). */
export function ViewToggle() {
  const { viewMode, setViewMode } = useWorkbench();
  return (
    <div className="seg" role="group" aria-label="Level of detail" data-demo="view-toggle">
      <button type="button" className={viewMode === 'simple' ? 'is-on' : ''} aria-pressed={viewMode === 'simple'} onClick={() => setViewMode('simple')}>
        Simple view
      </button>
      <button type="button" className={viewMode === 'technical' ? 'is-on' : ''} aria-pressed={viewMode === 'technical'} onClick={() => setViewMode('technical')}>
        Technical view
      </button>
    </div>
  );
}
