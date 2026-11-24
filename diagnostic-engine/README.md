# BridgeDoctor Diagnostic Engine

> **Status:** PLANNED / NOT YET IMPLEMENTED

## Overview

The BridgeDoctor Diagnostic Engine is a planned rule-based correlation component that analyzes collected multi-layer diagnostic evidence from both the browser extension and the native host to produce an evidence-backed diagnostic report.

## Planned Responsibilities

- **Rule-Based Evidence Evaluation:** Evaluates observation vectors against predefined diagnostic heuristics covering common GST DSC failure modes (service down, port blocked, certificate invalid, token absent, or portal communication failure).
- **Likely Cause Identification:** Correlates findings across layers to pinpoint the most probable bottleneck rather than presenting disjointed raw errors.
- **Confidence & Undetermined Outcomes:** Assigns confidence levels to diagnostic conclusions and explicitly reports an "Undetermined" outcome when available evidence is incomplete or inconclusive (e.g., potential external portal issues).
- **Actionable Next Steps:** Translates low-level diagnostic outcomes into clear, step-by-step remediation guidance for taxpayers, accountants, and technical support staff.

## Implementation Notice

This module is currently in the proposal and documentation stage. No diagnostic rules or logic implementations have been committed yet.
