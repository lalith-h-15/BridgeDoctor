import { SCENARIOS } from '../data/scenarios';
import { useWorkbench } from '../app/WorkbenchContext';

/** Six scenarios as a labelled radio group (arrow keys move between options). */
export function ScenarioPicker({ compact = false }: { compact?: boolean }) {
  const { scenarioId, chooseScenario } = useWorkbench();

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = SCENARIOS.findIndex((s) => s.id === scenarioId);
    let next = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % SCENARIOS.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + SCENARIOS.length) % SCENARIOS.length;
    else return;
    e.preventDefault();
    chooseScenario(SCENARIOS[next].id);
    const el = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next];
    el?.focus();
  };

  return (
    <div className={`scenarios${compact ? ' scenarios-compact' : ''}`} data-demo="scenarios" role="radiogroup" aria-label="Scenario" onKeyDown={onKey}>
      {SCENARIOS.map((s) => {
        const active = s.id === scenarioId;
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            className={`scenario${active ? ' is-active' : ''}`}
            onClick={() => chooseScenario(s.id)}
          >
            <span className="scenario-letter">{s.id}</span>
            <span className="scenario-title">{s.title}</span>
            {!compact && <span className="scenario-blurb">{s.blurb}</span>}
          </button>
        );
      })}
    </div>
  );
}
