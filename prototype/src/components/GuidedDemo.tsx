import { ChevronLeft, ChevronRight, MousePointerClick, RotateCcw, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useWorkbench } from '../app/WorkbenchContext';
import { prefersReducedMotion } from '../hooks/useReducedMotion';

type Ctx = ReturnType<typeof useWorkbench>;

interface DemoStep {
  title: string;
  body: string;
  /** Matches a data-demo="..." attribute; that element is outlined and scrolled into view. */
  focus: string;
  /** Side effects applied when the step is entered. They only set state; the user stays in control. */
  enter: (c: Ctx) => void;
  /** Optional shortcut button on the panel. */
  action?: { label: string; run: (c: Ctx) => void };
}

/** Make sure the Workbench shows scenario B; replay the run if it has not completed. */
function ensureScenarioRun(c: Ctx, id: 'A' | 'B') {
  c.navigate('workbench');
  if (c.scenarioId !== id) {
    c.chooseScenario(id);
    c.run();
  } else if (c.phase === 'idle') {
    c.run();
  }
}

/** The intended two-minute demonstration, in the order from the brief. */
const STEPS: DemoStep[] = [
  {
    title: 'Meet BridgeDoctor',
    body: 'A diagnostic workbench for GST digital-signature failures. It checks five links in the chain and says where the evidence points. Everything here is simulated.',
    focus: 'hero',
    enter: (c) => c.navigate('overview'),
  },
  {
    title: 'Pick “Local signing service stopped”',
    body: 'Scenario B. The map shows only what the user notices (a portal message), not the answer.',
    focus: 'scenarios',
    enter: (c) => {
      c.navigate('workbench');
      c.chooseScenario('B');
      c.setViewMode('simple');
      c.setTab('evidence');
    },
  },
  {
    title: 'Click Run Diagnosis',
    body: 'Try the button yourself, or let the demo press it.',
    focus: 'run',
    enter: (c) => {
      c.navigate('workbench');
      if (c.scenarioId !== 'B' || c.phase !== 'idle') c.chooseScenario('B');
    },
    action: { label: 'Run it for me', run: (c) => c.run() },
  },
  {
    title: 'Watch the workflow map',
    body: 'Seven stages play in order. Each link turns teal, amber, red or grey as evidence arrives.',
    focus: 'diagram',
    enter: (c) => ensureScenarioRun(c, 'B'),
  },
  {
    title: 'The failed component',
    body: 'The Local Signing Service is flagged red, and the link into it breaks. The links after it go dim because the signing flow never reaches them.',
    focus: 'diagram',
    enter: (c) => {
      ensureScenarioRun(c, 'B');
      c.selectComponent(null);
    },
  },
  {
    title: 'Open the Evidence Inspector',
    body: 'Technical view shows each observation: expected vs actual, evidence class, source and simulated timestamp.',
    focus: 'inspector',
    enter: (c) => {
      ensureScenarioRun(c, 'B');
      c.setTab('evidence');
      c.setViewMode('technical');
    },
  },
  {
    title: 'Read the triggered rule',
    body: 'BD-SVC-001: process absent AND endpoint refused. The browser’s refused-connection error corroborates it, which is why confidence is HIGH.',
    focus: 'rules',
    enter: (c) => {
      ensureScenarioRun(c, 'B');
      c.setTab('evidence');
      c.setViewMode('technical');
      c.expandRule('BD-SVC-001');
    },
  },
  {
    title: 'The recommended next action',
    body: 'Plain-language, non-destructive guidance, plus what to avoid and what remains unverified.',
    focus: 'actions',
    enter: (c) => {
      ensureScenarioRun(c, 'B');
      c.setViewMode('simple');
      c.setTab('actions');
    },
  },
  {
    title: 'Switch to Healthy environment',
    body: 'Scenario A runs through the same engine. Note the caveat: passing simulated checks never guarantee real signing success.',
    focus: 'diagram',
    enter: (c) => {
      c.navigate('workbench');
      c.chooseScenario('A');
      c.setTab('evidence');
      c.setViewMode('simple');
      c.run();
    },
  },
  {
    title: 'Compare the two runs',
    body: 'Same engine, different evidence, different conclusion. The comparison lists exactly what changed between the two runs.',
    focus: 'compare',
    enter: (c) => {
      ensureScenarioRun(c, 'A');
    },
  },
];

/**
 * Guided two-minute demo. A floating, non-modal panel: it never blocks the page, and the user
 * can change scenarios, views or tabs at any time. Steps only set state when they are entered.
 */
export function GuidedDemo() {
  const ctx = useWorkbench();
  const { guidedActive, guidedStep, setGuidedActive, setGuidedStep, resetDemo } = ctx;
  const latest = useRef(ctx);
  latest.current = ctx;

  const step = STEPS[Math.min(guidedStep, STEPS.length - 1)];

  // Apply the step's side effects and move the spotlight when the step changes.
  useEffect(() => {
    if (!guidedActive) {
      delete document.documentElement.dataset.demoFocus;
      return;
    }
    const s = STEPS[Math.min(guidedStep, STEPS.length - 1)];
    s.enter(latest.current);
    document.documentElement.dataset.demoFocus = s.focus;
    const t = window.setTimeout(() => {
      document.querySelector(`[data-demo="${s.focus}"]`)?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }, 260);
    return () => window.clearTimeout(t);
  }, [guidedActive, guidedStep]);

  // Layout grows as a run completes, so re-centre the focused element once it does.
  useEffect(() => {
    if (!guidedActive || ctx.phase !== 'complete') return;
    const f = STEPS[Math.min(guidedStep, STEPS.length - 1)].focus;
    const t = window.setTimeout(() => {
      document.querySelector(`[data-demo="${f}"]`)?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }, 150);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.phase, guidedActive]);

  useEffect(() => () => void delete document.documentElement.dataset.demoFocus, []);

  if (!guidedActive) return null;

  const last = guidedStep >= STEPS.length - 1;
  const exit = () => setGuidedActive(false);

  return (
    <aside className="guided" role="complementary" aria-label="Guided demo">
      <div className="guided-top">
        <span className="guided-kicker">
          <MousePointerClick size={14} aria-hidden /> Guided demo · step {guidedStep + 1} of {STEPS.length}
        </span>
        <button type="button" className="icon-btn" onClick={exit} aria-label="Exit guided demo">
          <X size={16} aria-hidden />
        </button>
      </div>
      <ol className="guided-dots" aria-hidden>
        {STEPS.map((_, i) => (
          <li key={i} className={i === guidedStep ? 'is-on' : i < guidedStep ? 'is-done' : ''} />
        ))}
      </ol>
      <h2 className="guided-title">{step.title}</h2>
      <p className="guided-body">{step.body}</p>
      {step.action && (
        <button type="button" className="btn btn-primary btn-sm" onClick={() => step.action?.run(ctx)}>
          {step.action.label}
        </button>
      )}
      <div className="guided-nav">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setGuidedStep(Math.max(0, guidedStep - 1))} disabled={guidedStep === 0}>
          <ChevronLeft size={15} aria-hidden /> Previous
        </button>
        {last ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={exit}>
            Finish
          </button>
        ) : (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setGuidedStep(guidedStep + 1)}>
            Next step <ChevronRight size={15} aria-hidden />
          </button>
        )}
      </div>
      <div className="guided-foot">
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            resetDemo();
            setGuidedStep(0);
            ctx.navigate('overview');
          }}
        >
          <RotateCcw size={13} aria-hidden /> Reset demo
        </button>
        <button type="button" className="link-btn" onClick={exit}>
          Exit guided demo
        </button>
      </div>
    </aside>
  );
}
