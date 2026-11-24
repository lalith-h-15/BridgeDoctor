# Research and References

This document records the technical references used to understand the GST digital-signature workflow and the proposed BridgeDoctor architecture.

## Official and Technical References

1. GST Portal — https://www.gst.gov.in/
2. GST Help and Taxpayer Services — https://www.gst.gov.in/help
3. Chrome Native Messaging — https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging
4. Chrome Manifest V3 — https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3
5. OASIS PKCS#11 Specification — https://docs.oasis-open.org/pkcs11/pkcs11-base/v3.1/os/pkcs11-base-v3.1-os.html
6. SoftHSM2 — https://github.com/softhsm/SoftHSMv2
7. Portcheck — https://github.com/roystondwork-dev/portcheck

## Research Notes

- GST documentation describes common DSC and emSigner troubleshooting steps.
- Chrome Native Messaging provides a communication mechanism between an extension and a local native application.
- PKCS#11 provides an interface for interacting with cryptographic tokens and modules.
- SoftHSM2 can simulate a software token for controlled testing.
- Existing local diagnostic tools demonstrate that process and port checks are not unique by themselves.

## Research Limitation

The existence of a reference does not mean BridgeDoctor has implemented or validated compatibility with it. Vendor-specific hardware compatibility and diagnostic coverage require separate testing.
