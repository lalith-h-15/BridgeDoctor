# BridgeDoctor Architecture

## Architecture Overview

BridgeDoctor uses a browser-extension and local-native-host architecture.

```text
GST Portal
    |
Chrome Browser
    |
BridgeDoctor Extension
    |
Chrome Native Messaging
    |
Windows Native Host
    |
    +-- Process Diagnostics
    |
    +-- Port Diagnostics
    |
    +-- TLS Certificate Inspection
    |
    +-- Supported Token Checks
    |
Diagnostic Engine
    |
Evidence-based Report
```

## Component Responsibilities

| Component | Responsibility |
|---|---|
| Chrome Extension | User interface and browser-side observations |
| Native Host | Approved local diagnostic operations |
| Process Diagnostics | Check relevant local processes |
| Port Diagnostics | Check configured local ports |
| TLS Inspection | Inspect certificate properties |
| Token Checks | Check supported PKCS#11 components |
| Diagnostic Engine | Correlate evidence using predefined rules |
| Report | Present findings and recommended actions |

## Communication

The extension communicates with the local application through Chrome Native Messaging.

The native host uses Chrome's length-prefixed JSON messaging protocol. Standard output is reserved for protocol communication, while diagnostic logs are written to standard error.

## Initial Scope

- Windows operating system
- Chrome browser
- GST DSC workflow
- Configurable local signing-service endpoint

Port 1585 is the initial diagnostic target based on GST troubleshooting guidance. Other ports should be configurable and validated before being presented as supported defaults.

## Limitations

- Token checks depend on compatible vendor-specific modules.
- TLS inspection does not independently establish browser trust.
- Browser-side observations may not expose every internal browser communication event.
- External portal failures may not be diagnosable through local checks.
