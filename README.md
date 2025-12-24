# Mempool JS API

[![npm version](https://img.shields.io/npm/v/@mempool/mempool.js.svg?style=flat-square)](https://www.npmjs.org/package/@mempool/mempool.js)
[![NPM](https://img.shields.io/david/mempool/mempool.js.svg?style=flat-square)](https://david-dm.org/mempool/mempool.js#info=dependencies)
[![Known Vulnerabilities](https://snyk.io/test/github/mempool/mempool.js/badge.svg?style=flat-square)](https://snyk.io/test/github/mempool/mempool.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

NPM package module for Mempool APIs.

Documentation: [https://mempool.space/api](https://mempool.space/api)

---

## **Installation**

### **ES Modules**

Install the npm module.

```bash
# npm
$ npm install @mempool/mempool.js --save

# yarn
$ yarn add @mempool/mempool.js
```

Or if you're not into package management, just [download a ZIP](https://github.com/mempool/mempool.js/archive/refs/heads/main.zip) file.

Import the module.

```js
import mempoolJS from '@mempool/mempool.js';

// default mempool.space endpointsconst { bitcoin, liquid } = mempoolJS();

// (optional) your custom endpoints
const { bitcoin } = mempoolJS({
  protocol: 'https', // optional, defaults to http for localhost, otherwise https
  hostname: 'mempool.space',
  network: 'testnet4' // 'signet' | 'testnet' | 'testnet4' | 'mainnet',
  config: { // optional axios request config to add to requests
    headers: {
      authorization: 'Basic auth'
    }
  }
});

// Liquid API
const { liquid } = mempoolJS({
  protocol: 'https', // optional, defaults to http for localhost, otherwise https
  hostname: 'liquid.network',
  network: 'liquid' // 'liquid' | 'liquidtestnet'
});
```

### **CommonJS**

Include the line below in the `head` tag of your html file.

```html
<script type="text/javascript" src="https://mempool.space/mempool.js"></script>
```

Call `mempoolJS()` function to access the API methods.

```js
// default mempool.space endpoints
const { bitcoin } = mempoolJS();

// (optional) your custom endpoints
const { bitcoin } = mempoolJS({
  protocol: 'https', // optional, defaults to http for localhost, otherwise https
  hostname: 'mempool.space',
  network: 'testnet4', // 'signet' | 'testnet' | 'testnet4' | 'mainnet'
});

// Liquid API
const { liquid } = mempoolJS({
  protocol: 'https', // optional, defaults to http for localhost, otherwise https
  hostname: 'liquid.network',
  network: 'liquid' // 'liquid' | 'liquidtestnet'
});
```

---

## **Features**

- [Bitcoin](./README-bitcoin.md)
  - [Addresses](./README-bitcoin.md#get-address)
  - [Blocks](./README-bitcoin.md#get-blocks)
  - [Difficulty Adjustment](./README-bitcoin.md#get-difficulty-adjustment)
  - [Fees](./README-bitcoin.md#get-fees)
  - [Lightning](./README-bitcoin.md#get-network-stats)
  - [Mempool](./README-bitcoin.md#get-mempool)
  - [Transactions](./README-bitcoin.md#get-transactions)
  - [Websocket](./README-bitcoin.md#init-websocket)
- [Liquid](./README-liquid.md#get-address)
  - [Addresses](./README-liquid.md#get-address)
  - [Assets](./README-liquid.md#get-address)
  - [Blocks](./README-liquid.md#get-address)
  - [Fees](./README-liquid.md#get-address)
  - [Mempool](./README-liquid.md#get-address)
  - [Transactions](./README-liquid.md#get-address)
  - [Websocket](./README-liquid.md#init-websocket)

---

## **Smart Contracts / Miniscript**

- Bitcoin Miniscript: use `bitcoin.miniscript` to fetch script info and related txs.
- Liquid contracts/assets: use `liquid.contracts` to fetch contract data and txs.

Examples for Node.js are available under `examples/nodejs`:

- `examples/nodejs/bitcoin/miniscript.ts` — basic usage of `bitcoin.miniscript`.
- `examples/nodejs/liquid/contracts.ts` — basic usage of `liquid.contracts`.
 - `examples/nodejs/liquid/nft.ts` — basic usage of `liquid.nft`.
 - `examples/nodejs/bitcoin/ordinal.ts` — basic usage of `bitcoin.nft` (ordinals).
- `examples/nodejs/liquid/nft.ts` — basic usage of `liquid.nft`.

Run examples with `ts-node` (requires dev dependencies installed):

```bash
npm install
npx ts-node examples/nodejs/bitcoin/miniscript.ts
npx ts-node examples/nodejs/liquid/contracts.ts
```

Run tests:

```bash
npm install
npm test
```

---

## **NFTs & Metadata**

- Liquid NFTs: use `liquid.nft` to fetch NFT details, owners and related txs. Examples:
  - `examples/nodejs/liquid/nft.ts` (basic)
  - `examples/nodejs/liquid/nft-advanced.ts` (detailed)

- Bitcoin Ordinals: use `bitcoin.nft` to fetch inscription/ordinal info and related txs. Examples:
  - `examples/nodejs/bitcoin/ordinal.ts` (basic)
  - `examples/nodejs/bitcoin/ordinal-advanced.ts` (detailed)

- Metadata utilities: `src/utils/metadata.ts` includes helpers:
  - `resolveMetadataUri(uri)` — normalizes `ipfs://`, `/ipfs/` and `data:` URIs (returns decoded JSON for `data:application/json;base64,`), or returns an HTTP URL for IPFS via gateway.
  - `ipfsToGateway(uri, gateway?)` — convert `ipfs://` to a gateway URL.
  - `decodeDataUrl(dataUrl)` — decode base64 data URLs.

Additional metadata features (new):
  - `setMetadataConfig({ gateways?, cacheDir?, ttlSeconds? })` — configure IPFS gateways, optional on-disk `cacheDir`, and TTL for cached entries (seconds).
  - `fetchMetadata(uri, options?)` — fetch and parse metadata (handles IPFS gateway fallback, `data:` URIs, and returns parsed JSON/text or base64 for binaries). Supports retry/backoff options.
  - `clearMetadataCache(uri?)` — clear a specific metadata entry (by URI) or all cached entries when called without arguments.
  - `invalidateMetadataByUri(uri)` — invalidate a single metadata entry (alias to `clearMetadataCache` for one URI).
  - `purgeExpiredMetadata()` — remove expired entries from memory and file cache according to current TTL.
  - `getCacheInfo()` — inspect the in-memory cache keys and ages.
  - `listCachedUris()` — list cached URIs with cache key, age, and presence.
  - `startMetadataPurge(intervalSeconds?)` — start a background periodic purge of expired cache entries (returns immediately).
  - `stopMetadataPurge()` — stop the background purge started with `startMetadataPurge()`.
  - `autoStartPurge` (in `setMetadataConfig`) — when setting `cacheDir`, pass `{ autoStartPurge: true, purgeIntervalSeconds: 3600 }` to auto-start the background purge. Default is `false`.
  - Memory cache persistence: when `cacheDir` is set, the in-memory cache is saved to `memory-cache.json` and restored on startup. Use `saveMemoryCache()` / `loadMemoryCache()` programmatically if needed.

Run NFT examples:

```bash
npm run example:nft -- <nft_id> [count]
npm run example:nft-basic

npm run example:ordinal -- <id> [count]
npm run example:ordinal-basic
```

These helpers and examples make it easier to fetch and resolve off-chain metadata (IPFS/data URLs) commonly used by NFTs.

---

## **CLI Examples**

Use the included interactive CLI to run examples from the command line.

- Run interactive prompt:

```bash
npm run examples:cli
```

- Run a miniscript example non-interactively:

```bash
npm run examples:cli -- miniscript <script> [count]
```

- Run a liquid contract example non-interactively:

```bash
npm run examples:cli -- contracts <contract_id> [count]
```

The `examples:cli` script runs `scripts/examples-cli.ts` which can also be executed directly with `ts-node`.

---

## **Contributing**

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

**Security:** See [SECURITY.md](SECURITY.md) for advisory information, recommended mitigations for automatic metadata fetching (COMOLEAK), and responsible disclosure instructions.

---

## **License** [MIT](https://choosealicense.com/licenses/mit/)
