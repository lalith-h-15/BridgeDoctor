import { useWorkbench } from '../app/WorkbenchContext';
import { CheckResultsChart, ComponentHealthChart, EvidenceChart, ScenarioComparison } from '../components/Charts';
import { ScenarioPicker } from '../components/ScenarioPicker';
import { SectionHead, SimBadge } from '../components/ui';
import { ALL_DIAGNOSES } from '../engine/diagnosticEngine';

/** Charts for the selected scenario. They read the engine output directly: no hand-entered numbers. */
export function InsightsPage() {
  const { scenarioId, scenario } = useWorkbench();
  const d = ALL_DIAGNOSES[scenarioId];
  return (
    <div className="page insights">
      <SectionHead
        eyebrow="Insights"
        title="What the evidence looks like"
        right={<SimBadge>Sample Simulation Data</SimBadge>}
      >
        These charts summarise the selected scenario's simulated observations, as classified by the diagnostic engine. They are not production metrics, success rates or accuracy measurements.
      </SectionHead>

      <section className="panel" aria-label="Scenario selection">
        <h2 className="h-mini">Scenario</h2>
        <ScenarioPicker compact />
        <p className="dim small pad">
          <b>{scenario.title}.</b> {d.headline} <span className="mono">Confidence: {d.confidence}</span>
        </p>
      </section>

      <div className="chart-grid">
        <ComponentHealthChart d={d} />
        <CheckResultsChart d={d} />
        <div className="chart-wide">
          <EvidenceChart d={d} />
        </div>
        <div className="chart-wide">
          <ScenarioComparison />
        </div>
      </div>
    </div>
  );
}
