# BridgeDoctor Chrome Extension

> **Status:** PLANNED / NOT YET IMPLEMENTED

## Overview

The BridgeDoctor Chrome extension is a planned browser-based diagnostic interface designed to help taxpayers and support personnel diagnose GST Digital Signature Certificate (DSC) workflow failures directly from the browser.

## Planned Responsibilities

- **Chrome Extension Manifest V3:** Built using the modern Manifest V3 platform architecture (service worker, action popup/dashboard, content script observations).
- **Diagnostic User Interface:** Provides a clean dashboard where users can initiate a diagnostic session ("Run Diagnostics") and view real-time inspection progress.
- **Browser-Side Observations:** Collects supported browser-side observations, such as portal origin context and connectivity checks to the local signing endpoint.
- **Native Host Communication:** Uses Chrome Native Messaging to communicate securely with the Windows Native Host diagnostic component.
- **Diagnostic Report Display:** Renders the correlated diagnostic findings, including observed evidence, likely root causes, confidence levels, and actionable next steps.

## Implementation Notice

This module is currently in the proposal and documentation stage. No source code or build artifacts are present. Implementation will proceed according to the project roadmap during subsequent development phases.
