# Security and Privacy

BridgeDoctor is designed as a diagnostic-only tool.

## Security Principles

1. No DSC PIN collection.
2. No private-key access.
3. No signing operations.
4. No document uploads for diagnostics.
5. No arbitrary shell command execution.
6. Allowlisted diagnostic operations.
7. Validate messages received through Native Messaging.
8. Restrict communication to the intended extension.
9. Redact sensitive information from logs and reports.
10. No automatic modification of certificate trust settings.

## Local Data

Diagnostic information should be processed locally wherever possible.

The initial design does not require a cloud backend.

## Limitations

Security measures must be implemented and tested as development progresses. This document describes design requirements, not a claim that all protections are already implemented.
