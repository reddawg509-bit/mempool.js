# Changelog

All notable changes to this project are documented in this file.

## Unreleased (feat/metadata-improvements)

### Added
- Robust metadata fetching utilities for NFTs and off-chain content.
  - `fetchMetadata(uri, options)` — IPFS gateway fallback, retries/backoff, `data:` URI decoding, JSON/text/binary handling.
  - `resolveMetadataUri(uri)` and `ipfsToGateway(uri)` helpers.
  - In-memory caching plus optional on-disk file cache (`cacheDir`) with TTL.
  - URI→cacheKey persistence (`uri-map.json`) and memory cache persistence (`memory-cache.json`) when `cacheDir` is set.
  - Cache management API: `setMetadataConfig()`, `clearMetadataCache()`, `invalidateMetadataByUri()`, `purgeExpiredMetadata()`, `getCacheInfo()`, `listCachedUris()`.
  - Background purge controls: `startMetadataPurge(intervalSeconds)` / `stopMetadataPurge()`; opt-in auto-start via `setMetadataConfig({ cacheDir, autoStartPurge: true, purgeIntervalSeconds })`.
  - Examples and tests demonstrating usage in `examples/nodejs` and `test/`.

  ### Security
  - Advisory: added discussion of `COMOLEAK` (information-leak / callback attacks) and mitigations in `SECURITY.md`. Libraries that automatically dereference off-chain metadata can leak runtime/network information; we recommend opt-in fetching, whitelists, and proxying.

### Changed
- Default IPFS gateways expanded and default metadata TTL raised to 1 day.
- Exposed metadata utilities on the top-level API as `mempool().metadata` for convenience.

### Notes for Upgrading
- To enable file caching and persistence, call:

```js
import mempool from './src';
mempool().metadata.setMetadataConfig({ cacheDir: './.cache/metadata', autoStartPurge: false });
```

- To enable background purge at startup, set `autoStartPurge: true` and optionally `purgeIntervalSeconds`.

- Use `mempool().metadata.fetchMetadata(uri)` to fetch and parse off-chain metadata (returns parsed JSON/text or base64 for binary).

### Testing & Examples
- Tests: `npm test` (Jest + ts-jest)
- Examples: `npx ts-node examples/nodejs/liquid/nft-advanced.ts <nft_id>`

---

If you want this changelog entry modified or split into smaller releases, tell me how you'd like it organized.
