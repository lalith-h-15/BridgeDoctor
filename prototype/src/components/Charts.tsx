import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { COMPONENTS } from '../data/components';
import { SCENARIOS } from '../data/scenarios';
import { ALL_DIAGNOSES } from '../engine/diagnosticEngine';
import type { Diagnosis, EvidenceClass, ObservationOutcome } from '../types';
import {
  EVIDENCE_CLASSES,
  OUTCOMES,
  OUTCOME_LABEL,
  countByEvidence,
  countByOutcome,
  interpretComponents,
  interpretEvidence,
  interpretOutcomes,
  outcomesByComponent,
} from '../utils/stats';
import { SimBadge, StatusPill } from './ui';
import { useWorkbench } from '../app/WorkbenchContext';

export const OUTCOME_COLOR: Record<ObservationOutcome, string> = {
  pass: '#2dd4bf',
  warn: '#f5b547',
  fail: '#ff6b7d',
  unverified: '#8294b3',
};
const EVIDENCE_COLOR: Record<EvidenceClass, string> = { STRONG: '#22d3ee', PARTIAL: '#6ea8fe', UNDETERMINED: '#a8b3c7' };

const AXIS = { fill: '#a3b1c9', fontSize: 12 };
const TOOLTIP = {
  contentStyle: { background: '#0f1626', border: '1px solid #2b3a5a', borderRadius: 2, color: '#e7edf8', fontSize: 12 },
  itemStyle: { color: '#e7edf8' },
  labelStyle: { color: '#a3b1c9' },
  cursor: { fill: 'rgba(110,168,254,.08)' },
};

/** Frame shared by every chart: title, simulation label, the chart, then a data-derived reading. */
export function ChartCard({
  title,
  question,
  interpretation,
  children,
  table,
}: {
  title: string;
  question: string;
  interpretation: string;
  children: ReactNode;
  /** Text alternative for the chart. */
  table?: ReactNode;
}) {
  return (
    <figure className="chart-card">
      <figcaption>
        <div>
          <h3>{title}</h3>
          <p className="dim small">{question}</p>
        </div>
        <SimBadge />
      </figcaption>
      <div className="chart-body">{children}</div>
      {table}
      <p className="chart-reading">
        <b>Reading:</b> {interpretation}
      </p>
    </figure>
  );
}

/** 1 · Checks per workflow component, split by outcome. */
export function ComponentHealthChart({ d }: { d: Diagnosis }) {
  const data = outcomesByComponent(d);
  return (
    <ChartCard
      title="Workflow component health"
      question="How did each component's checks turn out?"
      interpretation={interpretComponents(d)}
      table={
        <div className="sr-only">
          <table>
            <caption>Checks per component by outcome</caption>
            <thead><tr><th>Component</th>{OUTCOMES.map((o) => <th key={o}>{OUTCOME_LABEL[o]}</th>)}</tr></thead>
            <tbody>{data.map((r) => <tr key={r.id}><th>{r.name}</th>{OUTCOMES.map((o) => <td key={o}>{r[o]}</td>)}</tr>)}</tbody>
          </table>
        </div>
      }
    >
      <div className="chart-box" style={{ height: 270 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid stroke="#1e2a42" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={AXIS} stroke="#2b3a5a" />
            <YAxis type="category" dataKey="name" width={140} tick={AXIS} stroke="#2b3a5a" />
            <Tooltip {...TOOLTIP} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#a3b1c9' }} />
            {OUTCOMES.map((o) => (
              <Bar key={o} dataKey={o} name={OUTCOME_LABEL[o]} stackId="a" fill={OUTCOME_COLOR[o]} animationDuration={450} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

/** 2 · How strong is the evidence? */
export function EvidenceChart({ d }: { d: Diagnosis }) {
  const c = countByEvidence(d);
  const data = EVIDENCE_CLASSES.map((k) => ({ name: k, count: c[k] }));
  return (
    <ChartCard
      title="Evidence classification"
      question="How strongly do the observations establish their conclusions?"
      interpretation={interpretEvidence(d)}
      table={
        <div className="sr-only">
          <table>
            <caption>Observations per evidence class</caption>
            <tbody>{data.map((r) => <tr key={r.name}><th>{r.name}</th><td>{r.count}</td></tr>)}</tbody>
          </table>
        </div>
      }
    >
      <div className="chart-box" style={{ height: 190 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
            <CartesianGrid stroke="#1e2a42" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={AXIS} stroke="#2b3a5a" />
            <YAxis type="category" dataKey="name" width={120} tick={AXIS} stroke="#2b3a5a" />
            <Tooltip {...TOOLTIP} />
            <Bar dataKey="count" name="Observations" animationDuration={450} label={{ position: 'right', fill: '#e7edf8', fontSize: 12 }}>
              {data.map((r) => <Cell key={r.name} fill={EVIDENCE_COLOR[r.name]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

/** 3 · Overall check results as a donut with an HTML legend (counts, not colour alone). */
export function CheckResultsChart({ d }: { d: Diagnosis }) {
  const c = countByOutcome(d);
  const data = OUTCOMES.map((o) => ({ key: o, name: OUTCOME_LABEL[o], value: c[o] })).filter((x) => x.value > 0);
  return (
    <ChartCard
      title="Diagnostic check results"
      question="Across all eight checks, how many passed, warned, failed or could not be verified?"
      interpretation={interpretOutcomes(d)}
    >
      <div className="donut-wrap">
        <div className="chart-box" style={{ height: 230, width: 230 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={100} paddingAngle={2} stroke="#0a0f1c" animationDuration={450}>
                {data.map((x) => <Cell key={x.key} fill={OUTCOME_COLOR[x.key]} />)}
              </Pie>
              <Tooltip {...TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center" aria-hidden>
            <b>{c.pass}/{d.evidence.length}</b>
            <span>passed</span>
          </div>
        </div>
        <ul className="legend">
          {OUTCOMES.map((o) => (
            <li key={o}>
              <span className="swatch" style={{ background: OUTCOME_COLOR[o] }} aria-hidden /> {OUTCOME_LABEL[o]} <b>{c[o]}</b>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}

/** 4 · All six scenarios side by side, produced by running the real engine on each one. */
export function ScenarioComparison() {
  const { scenarioId, chooseScenario } = useWorkbench();
  const data = SCENARIOS.map((s) => {
    const d = ALL_DIAGNOSES[s.id];
    return { name: s.id, title: s.title, ...countByOutcome(d) };
  });
  const sel = ALL_DIAGNOSES[scenarioId];
  const sentence = `Scenario ${scenarioId} is highlighted. Passing checks drop and failed or unverified checks appear exactly where each scenario's observations differ from the healthy baseline; the engine, not a hand-written table, produced every bar.`;
  return (
    <ChartCard title="Scenario comparison" question="How do the six predefined scenarios differ in check outcomes?" interpretation={sentence}>
      <div className="chart-box" style={{ height: 270 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
            <CartesianGrid stroke="#1e2a42" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#2b3a5a"
              tick={(p: { x?: number | string; y?: number | string; payload?: { value?: unknown } }) => {
                const v = String(p.payload?.value ?? '');
                const on = v === scenarioId;
                return (
                  <text x={Number(p.x)} y={Number(p.y) + 14} textAnchor="middle" fontSize={13} fontWeight={on ? 700 : 400} fill={on ? '#22d3ee' : '#a3b1c9'}>
                    {on ? `▸ ${v}` : v}
                  </text>
                );
              }}
            />
            <YAxis allowDecimals={false} tick={AXIS} stroke="#2b3a5a" />
            <Tooltip {...TOOLTIP} labelFormatter={(l) => SCENARIOS.find((s) => s.id === l)?.title ?? String(l)} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#a3b1c9' }} />
            {OUTCOMES.map((o) => (
              <Bar key={o} dataKey={o} name={OUTCOME_LABEL[o]} stackId="a" fill={OUTCOME_COLOR[o]} animationDuration={450} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="matrix-wrap">
        <table className="matrix">
          <caption className="sr-only">Component status by scenario</caption>
          <thead>
            <tr>
              <th scope="col">Scenario</th>
              {COMPONENTS.map((c) => <th scope="col" key={c.id}>{c.name.replace('Local ', '').replace(' / DSC Token', '')}</th>)}
              <th scope="col">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {SCENARIOS.map((s) => {
              const d = ALL_DIAGNOSES[s.id];
              return (
                <tr key={s.id} className={s.id === scenarioId ? 'is-on' : ''}>
                  <th scope="row">
                    <button type="button" className="row-btn" onClick={() => chooseScenario(s.id)} aria-pressed={s.id === scenarioId}>
                      <span className="scenario-letter sm">{s.id}</span> {s.title}
                    </button>
                  </th>
                  {COMPONENTS.map((c) => (
                    <td key={c.id}><StatusPill state={d.components[c.id].status} compact /></td>
                  ))}
                  <td className="mono small">{d.confidence}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="dim small pad">Selected: <b>{sel.scenarioTitle}</b> — {sel.headline}</p>
    </ChartCard>
  );
}
