import { useCallback, useEffect, useRef, useState } from 'react';
import { STAGES } from '../data/components';
import { SCENARIO_BY_ID } from '../data/scenarios';
import { runDiagnosis } from '../engine/diagnosticEngine';
import type { Diagnosis, ScenarioId } from '../types';
import { useReducedMotion } from './useReducedMotion';

export type RunPhase = 'idle' | 'running' | 'complete';

export interface RunRecord {
  scenarioId: ScenarioId;
  diagnosis: Diagnosis;
}

/** Each stage plays briefly. Seven stages is roughly 2.5 s: purposeful, not a fake loading period. */
const STAGE_MS = 360;
const STAGE_MS_REDUCED = 80;

/**
 * Owns the scenario selection and the animated playback of a diagnosis.
 * The diagnosis itself is computed instantly by the pure engine; the hook only
 * reveals it stage by stage so the workflow map and timeline can animate.
 */
export function useDiagnosticRun(initial: ScenarioId) {
  const reduced = useReducedMotion();
  const [scenarioId, setScenarioState] = useState<ScenarioId>(initial);
  const scenarioRef = useRef<ScenarioId>(initial);
  const [phase, setPhase] = useState<RunPhase>('idle');
  const [revealed, setRevealed] = useState(0);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [history, setHistory] = useState<RunRecord[]>([]);
  const timer = useRef<number | undefined>(undefined);

  const clear = useCallback(() => {
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  useEffect(() => clear, [clear]);

  const setScenario = useCallback(
    (id: ScenarioId) => {
      scenarioRef.current = id; // updated synchronously so a following run() sees it
      clear();
      setScenarioState(id);
      setPhase('idle');
      setRevealed(0);
      setDiagnosis(null);
    },
    [clear],
  );

  const run = useCallback(() => {
    clear();
    const d = runDiagnosis(SCENARIO_BY_ID[scenarioRef.current]);
    const ms = reduced ? STAGE_MS_REDUCED : STAGE_MS;
    setDiagnosis(d);
    setPhase('running');
    setRevealed(0);
    let n = 0;
    const tick = () => {
      n += 1;
      setRevealed(n);
      if (n >= STAGES.length) {
        setPhase('complete');
        // One entry per scenario, most recent last. Powers the run comparison.
        setHistory((h) => [...h.filter((r) => r.scenarioId !== d.scenarioId), { scenarioId: d.scenarioId, diagnosis: d }].slice(-6));
        timer.current = undefined;
      } else {
        timer.current = window.setTimeout(tick, ms);
      }
    };
    timer.current = window.setTimeout(tick, ms);
  }, [clear, reduced]);

  /** Back to the initial scenario, idle, with no run history. */
  const reset = useCallback(() => {
    setScenario(initial);
    setHistory([]);
  }, [initial, setScenario]);

  return { scenarioId, setScenario, phase, revealed, diagnosis, history, run, reset };
}
