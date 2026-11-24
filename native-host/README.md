# BridgeDoctor Windows Native Host

> **Status:** PLANNED / NOT YET IMPLEMENTED

## Overview

The BridgeDoctor Windows Native Host is a planned local Windows diagnostic application that performs low-level environment checks that cannot be performed from within the Chrome browser sandbox.

## Planned Responsibilities

- **Chrome Native Messaging Protocol:** Communicates with the BridgeDoctor Chrome extension using standard length-prefixed JSON messaging over standard input/output (`stdin`/`stdout`), reserving `stderr` for operational logging.
- **Process Diagnostics:** Verifies whether the expected local signing application (such as emSigner or equivalent GST DSC bridge) is running on the Windows host.
- **Port Diagnostics:** Probes whether the configured local loopback port (initially targeting port 1585 per GST guidelines, with configurable port validation) is open, bound, and reachable.
- **TLS Certificate Inspection:** Examines local certificate properties (expiry, issuer, self-signed status, and loopback binding) used by the local signing server.
- **Supported PKCS#11 Checks:** Inspects connected hardware cryptographic tokens and PKCS#11 interface modules where vendor-specific middleware is installed and configured.
- **Security Boundaries:** Operates strictly on an explicit allowlist of non-destructive diagnostic operations, validates all incoming messages, rejects arbitrary command execution, and never handles private cryptographic keys or DSC PINs.

## Implementation Notice

This module is currently in the proposal and documentation stage. No executable binaries or placeholder source files are present.
