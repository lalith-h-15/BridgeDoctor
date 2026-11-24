# Problem Statement

## Title
Difficulty Diagnosing GST Digital Signature Certificate (DSC) Failures

## Problem

The GST digital-signature workflow depends on communication between the browser, local signing application, operating-system components and the Digital Signature Certificate token.

When signing fails, users may receive an error without knowing which component is responsible.

Troubleshooting may require checking whether the signing service is running, whether the expected local port is reachable, whether certificate properties are valid, and whether the required token components are available.

These checks are often performed separately.

## Proposed Approach

BridgeDoctor aims to consolidate selected diagnostic checks into a single diagnostic workflow that combines browser-side observations and Windows-level checks.

It will present the available evidence, likely cause and recommended next step.

## Target Users

- GST taxpayers who use DSC-based workflows.
- Accountants and tax professionals.
- Technical support personnel who help users troubleshoot DSC-related issues.

## Scope

The initial prototype focuses on Windows and Chrome-based GST DSC troubleshooting.

It is a diagnostic assistant, not a digital-signature application.
