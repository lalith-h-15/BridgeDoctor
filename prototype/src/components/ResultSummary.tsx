import { CircleCheck, CircleHelp, CircleX, FileSearch, Play, ScanLine, TriangleAlert } from 'lucide-react';
import { COMPONENT_BY_ID, STAGES } from '../data/components';
import { useWorkbench } from '../app/WorkbenchContext';
import { countByEvidence } from '../utils/stats';
import type { FocusKind } from '../types';
import { ConfidenceBadge, EmptyState, RuleChip } from './ui';

const KIND_ICON = { failure: CircleX, likely: TriangleAlert, uncertain: CircleHelp, unverified: CircleHelp, none: CircleCheck } as const;
const KIND_CLASS: Record<FocusKind, string> = {
  failure: 'rs-failed',
  likely: 'rs-warning',
  uncertain: 'rs-warning',
  unverified: 'rs-not_verified',
  none: 'rs-healthy',
};
const KIND_LABEL: Record<FocusKind, string> = {
  failure: 'Failure point',
  likely: 'Likely failure point',
  uncertain: 'Cause uncertain',
  unverified: 'Could not be verified',
  none: 'No failure point',
};

export function ResultSummary() {
  const { phase, revealed, diagnosis, scenario, run, viewMode, setTab } = useWorkbench();

  if (phase === 'idle' || !diagnosis) {
    return (
      <section className="result" aria-label="Result summary" data-demo="result">
        <EmptyState
          icon={<ScanLine size={28} strokeWidth={1.5} />}
          title="No diagnosis yet"
          action={
            <button type="button" className="btn btn-primary" onClick={run}>
              <Play size={16} aria-hidden /> Run Diagnosis
            </button>
          }
        >
          Scenario {scenario.id} is loaded. Run the diagnosis to watch the seven stages play and see which component the evidence points to.
        </EmptyState>
      </section>
    );
  }

  if (phase === 'running') {
    return (
      <section className="result is-busy" aria-label="Result summary" data-demo="result">
        <div className="result-busy">
          <ScanLine size={22} aria-hidden className="pulse" />
          <p>
            Correlating evidence… <span className="dim">{Math.min(revealed, STAGES.length)} of {STAGES.length} stages complete</span>
          </p>
        </div>
      </section>
    );
  }

  const Icon = KIND_ICON[diagnosis.focus.kind];
  const ev = countByEvidence(diagnosis);
  const total = diagnosis.evidence.length;
  const primary = diagnosis.rules.find((r) => r.primary);
  const point = diagnosis.focus.component ? COMPONENT_BY_ID[diagnosis.focus.component].name : 'Not established';

  return (
    <section className={`result ${KIND_CLASS[diagnosis.focus.kind]}`} aria-label="Result summary" data-demo="result" aria-live="polite">
      <div className="result-main">
        <Icon size={34} strokeWidth={1.6} aria-hidden className="result-icon" />
        <div>
          <p className="eyebrow">Result · simulated</p>
          <h3 className="result-headline">{diagnosis.headline}</h3>
          <p className="result-what">{diagnosis.recommendation.whatHappened}</p>
          {diagnosis.caveat && (
            <p className="caveat">
              <TriangleAlert size={14} aria-hidden /> {diagnosis.caveat}
            </p>
          )}
        </div>
      </div>

      <dl className="result-meta">
        <div>
          <dt>{KIND_LABEL[diagnosis.focus.kind]}</dt>
          <dd>{point}</dd>
        </div>
        <div>
          <dt>Confidence (qualitative)</dt>
          <dd>
            <ConfidenceBadge value={diagnosis.confidence} />
            {viewMode === 'technical' && <span className="meta-note">{diagnosis.confidenceReason}</span>}
          </dd>
        </div>
        <div>
          <dt>Evidence mix</dt>
          <dd>
            <span className="mix" role="img" aria-label={`${ev.STRONG} strong, ${ev.PARTIAL} partial, ${ev.UNDETERMINED} undetermined of ${total}`}>
              <span className="mix-strong" style={{ flexGrow: ev.STRONG }} />
              <span className="mix-partial" style={{ flexGrow: ev.PARTIAL }} />
              <span className="mix-undetermined" style={{ flexGrow: ev.UNDETERMINED }} />
            </span>
            <span className="meta-note">
              {ev.STRONG} strong · {ev.PARTIAL} partial · {ev.UNDETERMINED} undetermined
            </span>
          </dd>
        </div>
        {viewMode === 'technical' && primary && (
          <div>
            <dt>Primary rule</dt>
            <dd>
              <RuleChip id={primary.id} active />
              <span className="meta-note">{primary.title}</span>
            </dd>
          </div>
        )}
      </dl>

      <div className="result-actions">
        <button type="button" className="btn btn-quiet" onClick={() => setTab('evidence')}>
          <FileSearch size={15} aria-hidden /> Evidence Inspector
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => setTab('actions')}>
          What to do next
        </button>
      </div>
    </section>
  );
}
