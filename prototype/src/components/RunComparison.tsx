import { ArrowRight, GitCompare } from 'lucide-react';
import { COMPONENTS, COMPONENT_BY_ID } from '../data/components';
import { useWorkbench } from '../app/WorkbenchContext';
import type { Diagnosis } from '../types';
import { countByOutcome } from '../utils/stats';
import { ConfidenceBadge, StatusPill } from './ui';

const pointName = (d: Diagnosis) => (d.focus.component ? COMPONENT_BY_ID[d.focus.component].name : 'None');

function RunCard({ d, label }: { d: Diagnosis; label: string }) {
  const c = countByOutcome(d);
  return (
    <div className="cmp-card">
      <p className="eyebrow">{label}</p>
      <h4>
        <span className="scenario-letter sm">{d.scenarioId}</span> {d.scenarioTitle}
      </h4>
      <p className="cmp-headline">{d.headline}</p>
      <div className="cmp-row">
        <span>Confidence</span>
        <ConfidenceBadge value={d.confidence} />
      </div>
      <div className="cmp-row">
        <span>Failure point</span>
        <strong>{pointName(d)}</strong>
      </div>
      <div className="cmp-row">
        <span>Checks</span>
        <span className="mono small">
          {c.pass} pass · {c.warn} warn · {c.fail} fail · {c.unverified} unverified
        </span>
      </div>
      <div className="cmp-states">
        {COMPONENTS.map((comp) => (
          <span key={comp.id} title={comp.name}>
            <StatusPill state={d.components[comp.id].status} compact label={comp.name.split(' ').slice(-1)[0]} />
          </span>
        ))}
      </div>
    </div>
  );
}

/** Side-by-side of the two most recent completed runs (different scenarios). */
export function RunComparison() {
  const { history } = useWorkbench();
  if (history.length < 2) {
    return (
      <section className="compare" data-demo="compare" aria-label="Run comparison">
        <h3><GitCompare size={18} aria-hidden /> Compare runs</h3>
        <p className="dim small">Run two different scenarios and they appear here side by side. {history.length === 1 ? 'One run recorded so far.' : 'No runs recorded yet.'}</p>
      </section>
    );
  }
  const prev = history[history.length - 2].diagnosis;
  const now = history[history.length - 1].diagnosis;
  const changes: string[] = [];
  if (prev.focus.component !== now.focus.component) changes.push(`Failure point: ${pointName(prev)} → ${pointName(now)}`);
  if (prev.confidence !== now.confidence) changes.push(`Confidence: ${prev.confidence} → ${now.confidence}`);
  const p = countByOutcome(prev);
  const n = countByOutcome(now);
  if (p.fail !== n.fail) changes.push(`Failed checks: ${p.fail} → ${n.fail}`);
  if (p.unverified !== n.unverified) changes.push(`Unverified checks: ${p.unverified} → ${n.unverified}`);

  return (
    <section className="compare" data-demo="compare" aria-label="Run comparison">
      <h3><GitCompare size={18} aria-hidden /> Compare runs</h3>
      <div className="cmp-grid">
        <RunCard d={prev} label="Previous run" />
        <ArrowRight size={22} aria-hidden className="cmp-arrow" />
        <RunCard d={now} label="Latest run" />
      </div>
      {changes.length > 0 && (
        <p className="cmp-changes">
          <strong>What changed:</strong> {changes.join(' · ')}
        </p>
      )}
    </section>
  );
}
