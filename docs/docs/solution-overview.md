# Solution Overview

BridgeDoctor is a proposed diagnostic assistant for GST digital-signature workflow failures.

## Main Components

### 1. Browser Extension
A Chrome Manifest V3 extension that provides the diagnostic interface and collects supported browser-side observations.

### 2. Native Host
A local Windows application communicating with the extension through Chrome Native Messaging. It performs restricted local diagnostic operations.

### 3. Diagnostic Engine
A rule-based component that evaluates collected evidence and identifies likely failure points.

## Expected Output

A diagnostic report containing:

- Diagnostic check
- Observed result
- Evidence
- Possible explanation
- Recommended next action
- Confidence or undetermined status

## Important Limitation

A diagnostic result is based on available evidence. BridgeDoctor will not claim that every GST signing failure originates from the user's local computer.
