# Development Roadmap

## Phase 1 — Documentation
- Define the problem.
- Document the architecture.
- Identify the security boundaries.
- Define the initial Windows and Chrome scope.

## Phase 2 — Basic Interface
- Build the diagnostic dashboard.
- Add a Run Diagnostics action.
- Display diagnostic results.

## Phase 3 — Local Diagnostics
- Check the configured signing-service endpoint.
- Inspect relevant process information.
- Check port availability.

## Phase 4 — Browser and Native Integration
- Create the Chrome Manifest V3 extension.
- Implement the Native Messaging host.
- Validate extension-to-host communication.

## Phase 5 — Advanced Diagnostics
- Inspect TLS certificate properties.
- Explore supported PKCS#11 checks.
- Use SoftHSM2 for controlled token simulation.

## Phase 6 — Evidence-Based Diagnostic Report
- Correlate multi-layer observations using rule-based evaluation.
- Present observed evidence, likely causes, confidence levels, and undetermined outcomes.
- Generate recommended next actions for taxpayers and support personnel.

## Phase 7 — Controlled Testing and Demonstration
- Test a healthy local-service scenario.
- Test a service-unavailable scenario.
- Test an insufficient-evidence scenario.
- Document limitations and evaluation results.

## Development Principle

Prioritize real, testable functionality. Do not mark a planned feature as completed until it has been implemented and tested.
