# Security

This repository follows responsible disclosure practices. If you discover a vulnerability, please report it privately to the maintainers so it can be triaged and fixed.

Contact: open an issue and mark it with `security`, or email the maintainers via the address listed in the repository (or use the GitHub security contact for the project).

## Attacks & COMOLEAK advisory

Summary
- `COMOLEAK` describes a class of information-leak and callback attacks that can occur when off-chain metadata (IPFS, HTTP, data: URIs) is fetched automatically by a client library. An attacker can craft metadata URIs that cause the library to make requests to attacker-controlled endpoints, leaking the client's network identifiers, request headers, or other sensitive runtime information.

Risk
- Automatic metadata fetching that dereferences untrusted URIs can expose internal network topology, IP addresses, DNS resolution behavior, and can trigger side-effects on remote servers.

Examples of risky behavior
- Fetching arbitrary `http(s)://` or `ipfs://` URIs without validation or user consent.
- Automatically loading remote images or other binary resources that cause external callbacks.

Mitigations
- Do not automatically fetch untrusted metadata by default; require explicit opt-in for automatic resolution.
- Provide configuration options to whitelist allowed gateways and domains.
- Use a network proxy or gateway that strips sensitive headers and prevents DNS rebinding exposure.
- Use timeouts, retries limits, and size limits for remote fetches.
- Offer an option to only resolve `data:` URIs locally without performing network requests.
- Log and surface when external fetches are attempted so consumers can audit behavior.

Recommended library defaults (already implemented in this branch)
- `fetchMetadata()` supports configuration via `setMetadataConfig()`; set a `cacheDir` and `gateways` explicitly.
- Automatic background fetching and purge are opt-in (`autoStartPurge` defaults to `false`).
- Users should set conservative default gateways and enable whitelisting when needed.

Reporting
- To report a vulnerability, please open a private issue labeled `security` or contact the maintainers directly. Include a short description, steps to reproduce, and a disclosure timeline.

Legal
- Do not publish exploitation details before the maintainers have had reasonable time to respond and remediate. Follow coordinated disclosure best practices.
