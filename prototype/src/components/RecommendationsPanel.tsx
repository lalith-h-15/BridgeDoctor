import { Ban, CircleHelp, ListChecks, Lightbulb, Play, Wrench } from 'lucide-react';
import { useWorkbench } from '../app/WorkbenchContext';
import { Collapsible, EmptyState } from './ui';

/** What happened / why / what to check / what to avoid / what is unverified. Plain first, technical optional. */
export function RecommendationsPanel() {
  const { diagnosis, phase, run, scenario, viewMode } = useWorkbench();

  if (!diagnosis || phase !== 'complete') {
    return (
      <div data-demo="actions">
        <EmptyState
          icon={<Wrench size={28} strokeWidth={1.5} />}
          title="Recommendations appear after a diagnosis"
          action={
            phase === 'idle' ? (
              <button type="button" className="btn btn-primary" onClick={run}>
                <Play size={16} aria-hidden /> Run Diagnosis
              </button>
            ) : undefined
          }
        >
          {phase === 'running' ? 'The diagnosis is still running.' : `Run scenario ${scenario.id} to get safe next steps.`}
        </EmptyState>
      </div>
    );
  }

  const r = diagnosis.recommendation;
  return (
    <div className="actions" data-demo="actions">
      <div className="actions-head">
        <h3>{r.headline}</h3>
        {r.caveat && <p className="caveat">{r.caveat}</p>}
      </div>

      <div className="actions-grid">
        <section className="act act-what">
          <h4><Lightbulb size={16} aria-hidden /> What happened?</h4>
          <p>{r.whatHappened}</p>
        </section>
        <section className="act">
          <h4><CircleHelp size={16} aria-hidden /> Why might it have happened?</h4>
          <ul>{r.why.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
        <section className="act act-check">
          <h4><ListChecks size={16} aria-hidden /> What should you check?</h4>
          <ul>{r.check.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
        <section className="act act-avoid">
          <h4><Ban size={16} aria-hidden /> What should you avoid?</h4>
          <ul>{r.avoid.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
        <section className="act act-unverified">
          <h4><CircleHelp size={16} aria-hidden /> What remains unverified?</h4>
          <ul>{diagnosis.unverified.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      </div>

      <Collapsible title="Technical explanation" defaultOpen={viewMode === 'technical'} key={viewMode}>
        <p className="rule-explain">{r.technical}</p>
        <p className="dim small">
          Confidence is a qualitative category ({diagnosis.confidence}), derived from evidence strength: {diagnosis.confidenceReason} It is not a measured accuracy.
        </p>
      </Collapsible>
      <p className="dim small pad">BridgeDoctor never repairs your computer: it does not kill processes, change firewall settings, alter certificate trust or start services.</p>
    </div>
  );
}
