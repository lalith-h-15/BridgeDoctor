# BridgeDoctor Interactive Prototype

> **Interactive prototype. All data is simulated. Not a real system diagnostic and not production-ready.**

BridgeDoctor is a proposed diagnostic assistant for failures in GST digital-signature workflows:

`GST Portal -> Chrome Browser -> Local Signing Service -> TLS Certificate -> PKCS#11 Interface -> DSC Token`

This prototype demonstrates the **proposed product experience**: a diagnostic workbench that combines browser-side and local observations, weighs the evidence through deterministic rules, and states a finding, a qualitative confidence and what remains unverified, or says the cause is inconclusive.

## Prototype scope

- Six predefined scenarios with scripted observations (no real machine, portal, browser event or token is read).
- A real, deterministic diagnostic engine that runs on those observations.
- Workflow map, seven-stage timeline, evidence inspector, recommendations, insights charts, security boundary, Judge Mode, guided demo and JSON export.
- Simple View (plain language) and Technical View (rules, structured evidence).

## Technology

React 19, TypeScript (strict), Vite, plain CSS, Lucide icons, Recharts (only on the Insights page). Fonts are bundled (`@fontsource`), so there are no CDN calls. No backend, database, API key, authentication or external AI.

## Architecture

```
src/
  app/        App shell, WorkbenchContext (state)
  components/ Workflow diagram, timeline, inspector, charts, guided demo, ...
  pages/      Overview, Workbench, Insights, Security, Judge
  data/       components.ts (workflow + stages), observations.ts, scenarios.ts
  engine/     diagnosticRules.ts, evidenceCorrelator.ts, recommendations.ts, timeline.ts, diagnosticEngine.ts
  hooks/      useDiagnosticRun (playback), useHashRoute, useReducedMotion
  utils/      report.ts (JSON export), stats.ts (chart data)
  types/      Shared TypeScript model
scripts/verify-engine.ts   Engine assertions for all six scenarios
```

Diagnostic logic never lives in React components. The UI only reveals an already-computed `Diagnosis` stage by stage.

## The six scenarios

| ID | Scenario | Conclusion | Confidence |
|----|----------|-----------|-----------|
| A | Healthy environment | All simulated checks passed. (No guarantee of real signing success.) | MEDIUM |
| B | Local signing service stopped | Likely local signing service unavailable. | HIGH |
| C | Local port unavailable | Local endpoint could not be reached. (No conflicting process is named.) | MEDIUM |
| D | TLS certificate issue | Certificate property issue detected. (Does not establish Chrome trust.) | HIGH |
| E | Token / PKCS#11 module unavailable | Token integration could not be verified. (Token absence is not claimed.) | MEDIUM |
| F | Portal-side or inconclusive failure | Cause remains inconclusive. | INCONCLUSIVE |

## Diagnostic engine

`runDiagnosis(scenario): Diagnosis` is a pure function: load observations, evaluate rules, correlate, classify evidence (`STRONG | PARTIAL | UNDETERMINED`), identify the failure point, derive a confidence category (`HIGH | MEDIUM | INCONCLUSIVE`), generate recommendations and list unverified conditions. The result includes a step-by-step `trace`.

Rule ids: `BD-SVC-001..003`, `BD-TLS-001..004`, `BD-TOKEN-001..002`, `BD-PORTAL-001..002`, `BD-BRW-001`, `BD-OK-001`, plus fallback `BD-GEN-001` so no observation is ever silently dropped.

Confidence is a **category derived from evidence strength**, not a measured accuracy: HIGH needs STRONG evidence plus independent browser-side corroboration; PARTIAL evidence (including "everything passed") is capped at MEDIUM; UNDETERMINED evidence yields INCONCLUSIVE.

## What is simulated

All observations: browser events, process/port/endpoint probes, TLS inspection, PKCS#11 module and slot results. Timestamps (`T+0.26s`) are labels within a simulated run, not measurements.

## What is not implemented

Chrome extension, Native Messaging bridge, Windows diagnostic host, real probes, vendor PKCS#11 module registry, physical token testing. No accuracy, speed, user or failure statistics are claimed anywhere.

## Install and run

```bash
cd prototype
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build into dist/
npm run preview      # serve the production build
npm run verify       # engine assertions for all six scenarios
```

## How to demonstrate (about two minutes)

Click **Guided demo** (top right) and follow the panel, or by hand: Overview, pick **B**, **Run Diagnosis**, watch the map, open the **Evidence Inspector** in Technical View, read rule `BD-SVC-001`, show **Recommended actions**, switch to **A**, run, and read **Compare runs**. **Reset Demo** returns to the start.

## Future integration roadmap

1. Chrome extension that records browser-side request errors for the local endpoint.
2. Native Messaging host (length-prefixed JSON) with an allow-listed extension.
3. Read-only Windows probes: process, listener, certificate properties, PKCS#11 module/slot queries that never log in.
4. Vendor module registry; validation with SoftHSM2 in development, then physical devices per vendor.
5. Evaluate the rules against real, consented diagnostic cases before making any accuracy claim.
