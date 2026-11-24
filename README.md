# BridgeDoctor

### Diagnose. Understand. Resolve.

**BridgeDoctor is a GST digital-signature diagnostic assistant designed to help users identify why their local DSC signing workflow is failing.**

Instead of asking users to troubleshoot the browser, local signing service, network port, certificate and token separately, BridgeDoctor aims to bring selected diagnostic checks together and present their findings in one understandable report.

> **Project status:** Proposal and documentation stage. Implementation and testing are planned as part of the hackathon.

---

## 1. The Problem

Digital Signature Certificate (DSC) authentication is used in workflows on the GST portal. However, signing failures can arise from different components involved in the process.

For example:

- The local signing service may not be running.
- The expected local port may be unavailable.
- The local TLS certificate may have a problem.
- The required token or PKCS#11 module may not be available.
- The browser may be unable to communicate with the local signing service.
- The failure may originate from the portal or another external dependency.

Users may encounter an error without knowing which component caused it. They often need to investigate multiple settings and troubleshooting instructions manually.

## 2. Our Solution

BridgeDoctor proposes a browser-extension-based diagnostic system supported by a local Windows application.

It combines browser-side observations with local system diagnostics to help narrow down the likely cause of a GST DSC signing failure.

The goal is not to perform digital signatures. It is to diagnose the environment in which the signing workflow operates.

### Key capabilities

1. **Browser-side diagnostics:** Collect relevant browser-side observations during the supported diagnostic workflow.
2. **Local service checks:** Check whether the expected local signing service is reachable.
3. **Port diagnostics:** Inspect the availability of configured local ports.
4. **TLS certificate inspection:** Examine relevant local certificate properties.
5. **Token and PKCS#11 checks:** Check supported token components where the required vendor module is configured.
6. **Evidence-backed reports:** Present observed evidence, likely causes, confidence levels and recommended next steps.

Some capabilities depend on operating-system access and vendor-specific token modules. They will be implemented and validated incrementally.

## 3. How It Works

BridgeDoctor is designed around three main components:

**1. Chrome Extension (Manifest V3)**

Collects relevant browser-side diagnostic information and provides the user interface.

**2. Windows Native Host**

A local application that communicates with the extension through Chrome Native Messaging. It performs allowlisted system-level diagnostic checks.

**3. Diagnostic Engine**

Evaluates the collected evidence using predefined diagnostic rules and produces an understandable report.

### Proposed workflow

1. The user opens the BridgeDoctor interface.
2. The user starts a diagnostic check.
3. The extension collects supported browser-side observations.
4. The native host performs approved local system checks.
5. The diagnostic engine correlates the available evidence.
6. BridgeDoctor displays the findings and suggested next steps.

## 4. Technology Stack

| Component | Technology |
|---|---|
| Browser extension | Chrome Extension Manifest V3 |
| Local communication | Chrome Native Messaging |
| Local diagnostic application | Windows-compatible application |
| Diagnostic logic | Rule-based diagnostic engine |
| Certificate inspection | Node.js TLS capabilities |
| Token interface | PKCS#11 (interface standard, where supported) |
| Token simulation | SoftHSM2 for controlled testing (software token simulation) |
| Version control | Git and GitHub |

The exact implementation choices may evolve during development.

## 5. Architecture

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
    +-- Port Diagnostics
    +-- TLS Certificate Inspection
    +-- Supported Token Checks
    |
Diagnostic Engine
    |
Evidence-based Diagnostic Report
```

## 6. What Makes BridgeDoctor Different?

Existing tools and official troubleshooting instructions already address individual parts of digital-signature workflows.

BridgeDoctor focuses on bringing selected diagnostic checks together specifically for the GST DSC workflow.

Its intended differentiators are:

- Combining browser-side observations with Windows-level diagnostics.
- Checking multiple relevant layers of the local signing environment.
- Correlating findings instead of displaying unrelated technical checks.
- Showing the evidence behind a diagnosis.
- Providing an explicit undetermined result when available evidence is insufficient.

We do not claim that no similar troubleshooting tools exist. Our focus is GST-specific diagnostic correlation.

## 7. Security and Privacy

BridgeDoctor is designed around a diagnostic-only approach.

- It does not collect or request DSC PINs.
- It does not access private signing keys.
- It does not perform digital signatures.
- It does not upload users' documents for diagnosis.
- It does not execute arbitrary shell commands.
- It does not automatically modify certificate trust settings.
- Local diagnostic operations are intended to be restricted to an explicit allowlist.
- Sensitive diagnostic information should be redacted from reports and logs.

## 8. Scope and Limitations

The initial scope focuses on Windows and the Chrome browser.

Port 1585 is the initial diagnostic target based on standard GST troubleshooting guidance; other ports must be configurable and validated before being presented as supported defaults.

PKCS#11 is an interface standard, not a physical token. Physical token checks depend on installed vendor middleware.

SoftHSM2 may be used to simulate token-related scenarios during development. Such software-token simulation does not establish compatibility with physical DSC tokens.

TLS certificate inspection can report certificate properties, but does not by itself prove that Chrome trusts the certificate.

BridgeDoctor is strictly a diagnostic assistant, not a signing application. It does not perform digital signatures or handle cryptographic keys.

BridgeDoctor will report uncertainty rather than claim a definitive diagnosis when the available evidence is insufficient.

## 9. Development Roadmap

| Phase | Planned work |
|---|---|
| Phase 1 | Repository, architecture and documentation |
| Phase 2 | Basic diagnostic interface |
| Phase 3 | Local service and port diagnostics |
| Phase 4 | Native Messaging integration |
| Phase 5 | TLS and supported token checks |
| Phase 6 | Evidence-based diagnostic report |
| Phase 7 | Controlled testing and demonstration |

The initial hackathon prototype will prioritize a small number of real, testable diagnostic capabilities over a broad but unverified feature set.

## 10. Team

**Team Name:** NextGen Coders

- Lalith Raj B H — Team Lead
- K Sahana
- Keerthi Vasan

## 11. Project Status

BridgeDoctor is currently in the proposal and documentation stage.

The proposed architecture and diagnostic approach are documented here. Implementation, integration and testing will be added progressively. Features will be marked as implemented only after they have been built and verified.

## 12. References

- [GST Portal](https://www.gst.gov.in/)
- [GST Help and Taxpayer Services](https://www.gst.gov.in/help)
- [Chrome Native Messaging Documentation](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
- [PKCS#11 Specification](https://docs.oasis-open.org/pkcs11/pkcs11-base/v3.1/os/pkcs11-base-v3.1-os.html)
- [SoftHSM2](https://github.com/softhsm/SoftHSMv2)

## Interactive prototype

A runnable demonstration of the proposed diagnostic experience lives in [`prototype/`](prototype/README.md). It uses simulated data only and is not a real system diagnostic.

```bash
cd prototype && npm install && npm run dev
```

---

**BridgeDoctor — Making digital-signature failures easier to understand.**
