import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_SCENARIO, SCENARIO_BY_ID } from '../data/scenarios';
import { useDiagnosticRun } from '../hooks/useDiagnosticRun';
import { useHashRoute, type Route } from '../hooks/useHashRoute';
import type { ComponentId, Scenario, ScenarioId, ViewMode } from '../types';

export type WorkbenchTab = 'evidence' | 'actions' | 'export';

type RunApi = ReturnType<typeof useDiagnosticRun>;

interface WorkbenchContextValue extends RunApi {
  scenario: Scenario;
  route: Route;
  navigate: (r: Route) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  tab: WorkbenchTab;
  setTab: (t: WorkbenchTab) => void;
  selectedComponent: ComponentId | null;
  selectComponent: (c: ComponentId | null) => void;
  /** Rule id to expand in the Evidence Inspector (used by the guided demo). */
  expandedRule: string | null;
  expandRule: (id: string | null) => void;
  guidedActive: boolean;
  guidedStep: number;
  setGuidedActive: (v: boolean) => void;
  setGuidedStep: (n: number) => void;
  /** Reset everything to the initial demo state. */
  resetDemo: () => void;
  /** Change scenario and clear per-run UI state. */
  chooseScenario: (id: ScenarioId) => void;
}

const Ctx = createContext<WorkbenchContextValue | null>(null);

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [route, navigate] = useHashRoute();
  const runApi = useDiagnosticRun(DEFAULT_SCENARIO);
  const { setScenario, reset } = runApi;
  const [viewMode, setViewMode] = useState<ViewMode>('simple');
  const [tab, setTab] = useState<WorkbenchTab>('evidence');
  const [selectedComponent, selectComponent] = useState<ComponentId | null>(null);
  const [expandedRule, expandRule] = useState<string | null>(null);
  const [guidedActive, setGuidedActive] = useState(false);
  const [guidedStep, setGuidedStep] = useState(0);

  const chooseScenario = useCallback(
    (id: ScenarioId) => {
      setScenario(id);
      selectComponent(null);
      expandRule(null);
    },
    [setScenario],
  );

  const resetDemo = useCallback(() => {
    reset();
    selectComponent(null);
    expandRule(null);
    setTab('evidence');
    setViewMode('simple');
  }, [reset]);

  const value = useMemo<WorkbenchContextValue>(
    () => ({
      ...runApi,
      scenario: SCENARIO_BY_ID[runApi.scenarioId],
      route,
      navigate,
      viewMode,
      setViewMode,
      tab,
      setTab,
      selectedComponent,
      selectComponent,
      expandedRule,
      expandRule,
      guidedActive,
      guidedStep,
      setGuidedActive,
      setGuidedStep,
      resetDemo,
      chooseScenario,
    }),
    [runApi, route, navigate, viewMode, tab, selectedComponent, expandedRule, guidedActive, guidedStep, resetDemo, chooseScenario],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkbench(): WorkbenchContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useWorkbench must be used inside <WorkbenchProvider>');
  return v;
}
