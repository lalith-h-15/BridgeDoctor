import { ChevronDown, CornerDownRight, FileSearch, Play } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { COMPONENTS, COMPONENT_BY_ID, STAGES } from '../data/components';
import { useWorkbench } from '../app/WorkbenchContext';
import type { EvidenceItem, ObservationOutcome } from '../types';
import { OUTCOME_LABEL } from '../utils/stats';
import { COMPONENT_ICON, type VisualState } from './icons';
import { Collapsible, EmptyState, EvidenceBadge, KeyValues, RuleChip, SimBadge, StatusPill } from './ui';

const OUTCOME_VISUAL: Record<ObservationOutcome, VisualState> = {
  pass: 'healthy',
  warn: 'warning',
  fail: 'failed',
  unverified: 'not_verified',
};

const stageIndexOf = (check: EvidenceItem['check']) => STAGES.findIndex((s) => s.checks.includes(check));
const fmtOffset = (ms: number) => `T+${(ms / 1000).toFixed(2)}s`;

/**
 * Evidence Inspector: every observation with its expectation, actual value, evidence class,
 * triggering rule, source, simulated timestamp and explanation. Plain language by default;
 * structured evidence in Technical View or on expand.
 */
export function EvidenceInspector() {
  const { diagnosis, phase, revealed, viewMode, selectedComponent, selectComponent, expandedRule, run, scenario } = useWorkbench();
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());
  const [openRules, setOpenRules] = useState<Set<string>>(new Set());

  // Technical View opens every row; Simple View starts collapsed. Users can still toggle freely.
  useEffect(() => {
    setOpenRows(viewMode === 'technical' && diagnosis ? new Set(diagnosis.evidence.map((e) => e.id)) : new Set());
    setOpenRules(viewMode === 'technical' && diagnosis ? new Set(diagnosis.rules.filter((r) => r.primary).map((r) => r.id)) : new Set());
  }, [viewMode, diagnosis]);

  // Guided demo can ask for a specific rule to be expanded.
  useEffect(() => {
    if (expandedRule) setOpenRules((s) => new Set(s).add(expandedRule));
  }, [expandedRule]);

  const visible = useMemo(() => {
    if (!diagnosis) return [];
    return diagnosis.evidence.filter((e) => phase === 'complete' || stageIndexOf(e.check) < revealed);
  }, [diagnosis, phase, revealed]);

  if (!diagnosis || phase === 'idle') {
    return (
      <div data-demo="inspector">
        <EmptyState
          icon={<FileSearch size={28} strokeWidth={1.5} />}
          title="Evidence appears here"
          action={
            <button type="button" className="btn btn-primary" onClick={run}>
              <Play size={16} aria-hidden /> Run Diagnosis
            </button>
          }
        >
          Run scenario {scenario.id} to populate the inspector with its simulated observations and the rules that interpreted them.
        </EmptyState>
      </div>
    );
  }

  const filtered = selectedComponent ? visible.filter((e) => e.component === selectedComponent) : visible;
  const toggleRow = (id: string) =>
    setOpenRows((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleRule = (id: string, open: boolean) =>
    setOpenRules((s) => {
      const n = new Set(s);
      if (open) n.add(id);
      else n.delete(id);
      return n;
    });
  const jumpTo = (id: string) => {
    setOpenRows((s) => new Set(s).add(id));
    selectComponent(null);
    window.setTimeout(() => document.getElementById(`ev-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
  };

  return (
    <div className="inspector" data-demo="inspector">
      <div className="inspector-head">
        <div>
          <h3>Evidence Inspector</h3>
          <p className="dim small">
            {viewMode === 'simple'
              ? 'What was observed, in plain language. Open a row for the technical detail.'
              : 'Structured observations with expected vs actual values, evidence class and the rule that interpreted each one.'}
          </p>
        </div>
        <SimBadge>All observations simulated</SimBadge>
      </div>

      <div className="filters" role="group" aria-label="Filter by component">
        <button type="button" className={`chip${selectedComponent === null ? ' is-on' : ''}`} aria-pressed={selectedComponent === null} onClick={() => selectComponent(null)}>
          All components <span className="chip-count">{visible.length}</span>
        </button>
        {COMPONENTS.map((c) => {
          const Icon = COMPONENT_ICON[c.id];
          const n = visible.filter((e) => e.component === c.id).length;
          return (
            <button key={c.id} type="button" className={`chip${selectedComponent === c.id ? ' is-on' : ''}`} aria-pressed={selectedComponent === c.id} onClick={() => selectComponent(selectedComponent === c.id ? null : c.id)}>
              <Icon size={13} aria-hidden /> {c.name} <span className="chip-count">{n}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && <p className="dim small pad">No observations for this component yet.</p>}

      <div className="ev-list">
        {filtered.map((e) => (
          <EvidenceRow key={e.id} item={e} open={openRows.has(e.id)} onToggle={() => toggleRow(e.id)} />
        ))}
      </div>

      {phase === 'complete' && (
        <div className="rules" data-demo="rules">
          <h3>Triggered rules</h3>
          <p className="dim small">Every conclusion traces back to a rule id and the observations it consumed.</p>
          {diagnosis.rules.map((r) => (
            <Collapsible
              key={r.id}
              className={`rule-card${r.primary ? ' is-primary' : ''}`}
              open={openRules.has(r.id)}
              onToggle={(o) => toggleRule(r.id, o)}
              title={
                <span className="rule-title">
                  <RuleChip id={r.id} active={r.primary} /> <span>{r.title}</span>
                </span>
              }
              badge={
                <span className="rule-badges">
                  {r.primary && <span className="primary-tag">Primary</span>}
                  <EvidenceBadge value={r.evidence} />
                </span>
              }
            >
              <p className="rule-plain">{r.plain}</p>
              <KeyValues
                items={[
                  ['Condition', <code className="mono" key="c">{r.condition}</code>],
                  ['Component', COMPONENT_BY_ID[r.component].name],
                  ['Role', r.role === 'diagnostic' ? 'Diagnostic (can reach a finding)' : 'Component state'],
                  ...(r.finding ? ([['Finding', <code className="mono" key="f">{r.finding}</code>]] as [string, React.ReactNode][]) : []),
                ]}
              />
              <p className="rule-explain">{r.explanation}</p>
              <div className="rule-links">
                {r.observationIds.length > 0 && (
                  <span>
                    Supported by{' '}
                    {r.observationIds.map((id) => (
                      <button type="button" key={id} className="link-chip" onClick={() => jumpTo(id)}>
                        {id.split(':')[1]}
                      </button>
                    ))}
                  </span>
                )}
                {r.corroboratingIds.length > 0 && (
                  <span>
                    Corroborated by{' '}
                    {r.corroboratingIds.map((id) => (
                      <button type="button" key={id} className="link-chip" onClick={() => jumpTo(id)}>
                        {id.split(':')[1]}
                      </button>
                    ))}
                  </span>
                )}
              </div>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceRow({ item: e, open, onToggle }: { item: EvidenceItem; open: boolean; onToggle: () => void }) {
  const { viewMode, diagnosis } = useWorkbench();
  const bodyId = useId();
  const Icon = COMPONENT_ICON[e.component];
  const rule = diagnosis?.rules.find((r) => r.id === e.rule);
  return (
    <article className={`ev-row out-${e.outcome}`} id={`ev-${e.id}`}>
      <button type="button" className="ev-row-head" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
        <span className="ev-time mono">{fmtOffset(e.tOffsetMs)}</span>
        <span className="ev-comp">
          <Icon size={15} aria-hidden /> {COMPONENT_BY_ID[e.component].name}
        </span>
        <span className="ev-text">
          {viewMode === 'simple' ? (
            e.plain
          ) : (
            <span className="mono">
              {e.check}: <span className="dim">expected</span> {e.expected} <span className="dim">&rarr;</span> <strong>{e.actual}</strong>
            </span>
          )}
        </span>
        <span className="ev-tags">
          <StatusPill state={OUTCOME_VISUAL[e.outcome]} label={OUTCOME_LABEL[e.outcome]} compact />
          <EvidenceBadge value={e.evidence} />
          <RuleChip id={e.rule} />
        </span>
        <ChevronDown size={16} aria-hidden className={`chev${open ? ' up' : ''}`} />
      </button>
      <div id={bodyId} className="ev-body" hidden={!open}>
        <p className="ev-interpret">{e.interpretation}</p>
        {e.corroborates.length > 0 && (
          <p className="ev-corr">
            <CornerDownRight size={14} aria-hidden /> Corroborates {e.corroborates.join(', ')}
          </p>
        )}
        <KeyValues
          items={[
            ['Component', COMPONENT_BY_ID[e.component].name],
            ['Check', <code className="mono" key="1">{e.check}</code>],
            ...(e.target ? ([['Target', <code className="mono" key="t">{e.target}</code>]] as [string, React.ReactNode][]) : []),
            ['Expected', <code className="mono" key="2">{e.expected}</code>],
            ['Actual (simulated)', <code className="mono" key="3">{e.actual}</code>],
            ['Evidence class', <EvidenceBadge key="4" value={e.evidence} />],
            ['Rule triggered', <RuleChip key="5" id={e.rule} />],
            ['Source', <code className="mono" key="6">{e.source}</code>],
            ['Simulated timestamp', <code className="mono" key="7">{fmtOffset(e.tOffsetMs)} within the simulated run</code>],
            ...Object.entries(e.detail).map(([k, v]) => [k, <span className="mono" key={k}>{v}</span>] as [string, React.ReactNode]),
          ]}
        />
        {rule && (
          <Collapsible title="Technical explanation" defaultOpen={viewMode === 'technical'} className="nested">
            <p className="rule-explain">{rule.explanation}</p>
          </Collapsible>
        )}
      </div>
    </article>
  );
}
