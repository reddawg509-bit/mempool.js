import axios, { AxiosInstance } from 'axios';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const ipfsToGateway = (uri: string, gateway = 'https://ipfs.io/ipfs/') => {
  if (!uri) return uri;
  if (uri.startsWith('ipfs://')) return uri.replace('ipfs://', gateway);
  if (uri.startsWith('/ipfs/')) return gateway + uri.replace(/^\/ipfs\//, '');
  return uri;
};

export const decodeDataUrl = (dataUrl: string) => {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null;
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) return null;
  try {
    const [, mime, b64] = match;
    const buf = Buffer.from(b64, 'base64');
    if (mime === 'application/json') return JSON.parse(buf.toString('utf8'));
    return { mime, data: buf.toString('utf8') };
  } catch (e) {
    return null;
  }
};

export const resolveMetadataUri = (uri?: string, gateway?: string) => {
  if (!uri) return null;
  if (uri.startsWith('ipfs://') || uri.startsWith('/ipfs/')) return ipfsToGateway(uri, gateway);
  if (uri.startsWith('data:')) return decodeDataUrl(uri);
  return uri;
};

export type FetchResult = { contentType?: string; data?: any; url?: string } | null;

export interface MetadataConfig {
  gateways?: string[];
  cacheDir?: string;
  autoStartPurge?: boolean;
  purgeIntervalSeconds?: number;
  ttlSeconds?: number;
}

const defaultConfig: Required<MetadataConfig> = {
  gateways: [
    'https://dweb.link/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
  ],
  cacheDir: '',
  autoStartPurge: false,
  purgeIntervalSeconds: 3600,
  ttlSeconds: 86400, // default TTL: 1 day
};

export const metadataConfig: MetadataConfig = { ...defaultConfig };

export const setMetadataConfig = (c: Partial<MetadataConfig>) => {
  if (c.gateways) metadataConfig.gateways = c.gateways;
  if (c.cacheDir !== undefined) {
    metadataConfig.cacheDir = c.cacheDir;
    // load persisted uri map and memory cache; optionally start purge
    loadUriMap(metadataConfig.cacheDir as string).catch(() => {});
    loadMemoryCache(metadataConfig.cacheDir as string).catch(() => {});
    try {
      const auto = (c as any).autoStartPurge !== undefined ? (c as any).autoStartPurge : (metadataConfig.autoStartPurge as boolean);
      const interval = (c as any).purgeIntervalSeconds !== undefined ? (c as any).purgeIntervalSeconds : (metadataConfig.purgeIntervalSeconds as number);
      if (auto) startMetadataPurge(interval);
    } catch (e) {}
  }
  if (c.ttlSeconds !== undefined) metadataConfig.ttlSeconds = c.ttlSeconds;
};

// forward declaration for purge starter (implemented later)

// in-memory cache stores { value, ts }
type CacheEntry = { value: FetchResult | Promise<FetchResult> | null; ts: number };
const memoryCache = new Map<string, CacheEntry>();
// map original uri -> cacheKey for listing
const uriToKey = new Map<string, string>();
const uriMapFileName = 'uri-map.json';

async function saveUriMap(cacheDir?: string) {
  try {
    const dir = cacheDir || (metadataConfig.cacheDir as string);
    if (!dir) return;
    await fs.mkdir(dir, { recursive: true });
    const obj: Record<string, string> = {};
    uriToKey.forEach((k, u) => (obj[u] = k));
    await fs.writeFile(path.join(dir, uriMapFileName), JSON.stringify(obj), 'utf8');
  } catch (e) {
    // ignore
  }
}

async function loadUriMap(cacheDir?: string) {
  try {
    const dir = cacheDir || (metadataConfig.cacheDir as string);
    if (!dir) return;
    const file = path.join(dir, uriMapFileName);
    const content = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(content) as Record<string, string>;
    Object.keys(parsed).forEach((uri) => uriToKey.set(uri, parsed[uri]));
  } catch (e) {
    // ignore
  }
}

const memoryCacheFileName = 'memory-cache.json';

async function saveMemoryCache(cacheDir?: string) {
  try {
    const dir = cacheDir || (metadataConfig.cacheDir as string);
    if (!dir) return;
    await fs.mkdir(dir, { recursive: true });
    const obj: Record<string, { ts: number; data: any }> = {};
    memoryCache.forEach((entry, key) => {
      if (!entry || !entry.value) return;
      if (entry.value instanceof Promise) return;
      obj[key] = { ts: entry.ts, data: (entry.value as FetchResult) };
    });
    await fs.writeFile(path.join(dir, memoryCacheFileName), JSON.stringify(obj), 'utf8');
  } catch (e) {
    // ignore
  }
}

async function loadMemoryCache(cacheDir?: string) {
  try {
    const dir = cacheDir || (metadataConfig.cacheDir as string);
    if (!dir) return;
    const file = path.join(dir, memoryCacheFileName);
    const content = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(content) as Record<string, { ts: number; data: any }>;
    Object.keys(parsed).forEach((key) => {
      const p = parsed[key];
      memoryCache.set(key, { value: p.data as FetchResult, ts: p.ts });
    });
  } catch (e) {
    // ignore
  }
}

function hashKey(key: string) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export const fetchMetadata = async (
  uri?: string,
  options?: {
    gateways?: string[]; // list of gateways to try for ipfs URIs
    axiosInstance?: AxiosInstance;
    cacheDir?: string; // optional directory to store cached responses
    ttlSeconds?: number;
    retriesPerGateway?: number;
    backoffMs?: number;
  }
): Promise<FetchResult> => {
  if (!uri) return null;
  const { gateways, axiosInstance, cacheDir, ttlSeconds, retriesPerGateway, backoffMs } = options || {};
  const gwList = gateways && gateways.length ? gateways : (metadataConfig.gateways as string[]);
  const cfgCacheDir = cacheDir !== undefined ? cacheDir : (metadataConfig.cacheDir as string);
  const cfgTtl = ttlSeconds !== undefined ? ttlSeconds : (metadataConfig.ttlSeconds as number);
  const cfgRetries = retriesPerGateway !== undefined ? retriesPerGateway : 1;
  const cfgBackoff = backoffMs !== undefined ? backoffMs : 200;

  // caching key uses the original uri
  const cacheKey = hashKey(uri);

  // First, handle data: URIs synchronously
  if (uri.startsWith('data:')) {
    const decoded = decodeDataUrl(uri);
    // record mapping for data URIs as well
    try {
      uriToKey.set(uri, cacheKey);
    } catch (e) {}
    // store in memory cache so listing shows hasValue
    try {
      memoryCache.set(cacheKey, { value: { data: decoded }, ts: Date.now() });
    } catch (e) {}
    return { data: decoded };
  }

  // For IPFS URIs, build candidate URLs
  const candidates: string[] = [];
  if (uri.startsWith('ipfs://') || uri.startsWith('/ipfs/')) {
    for (const gw of gwList) {
      if (uri.startsWith('ipfs://')) candidates.push(uri.replace('ipfs://', gw));
      else if (uri.startsWith('/ipfs/')) candidates.push(gw + uri.replace(/^\/ipfs\//, ''));
    }
  } else {
    candidates.push(uri);
  }


  // helper to sleep
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // check memory cache
  if (memoryCache.has(cacheKey)) {
    const entry = memoryCache.get(cacheKey)!;
    // if value is a promise, await it
    if (entry.value instanceof Promise) {
      const v = await entry.value;
      return v;
    }
    // check TTL
    if (Date.now() - entry.ts < cfgTtl * 1000) return entry.value as FetchResult;
    // expired
    memoryCache.delete(cacheKey);
  }

  // helper to write to file cache (stores { ts, data })
  const writeFileCache = async (data: FetchResult) => {
    if (!cfgCacheDir || !data) return;
    try {
      await fs.mkdir(cfgCacheDir, { recursive: true });
      const file = path.join(cfgCacheDir, `${cacheKey}.json`);
      await fs.writeFile(file, JSON.stringify({ ts: Date.now(), data }), 'utf8');
    } catch (e) {
      // ignore file cache errors
    }
  };

  // try to load from file cache
  if (cfgCacheDir) {
    try {
      const file = path.join(cfgCacheDir, `${cacheKey}.json`);
      const content = await fs.readFile(file, 'utf8');
      const parsed = JSON.parse(content) as { ts: number; data: FetchResult };
      if (parsed && parsed.ts && Date.now() - parsed.ts < cfgTtl * 1000) {
        const entry: CacheEntry = { value: parsed.data, ts: parsed.ts };
        memoryCache.set(cacheKey, entry);
        // record mapping from uri -> key
        try { uriToKey.set(uri, cacheKey); } catch (e) {}
        // persist mapping
        saveUriMap(cfgCacheDir).catch(() => {});
        // ensure memory cache persisted
        saveMemoryCache(cfgCacheDir).catch(() => {});
        return parsed.data;
      }
      // expired: try to continue and overwrite
    } catch (e) {
      // not found or invalid, continue
    }
  }

  // create a promise and set in memory cache to dedupe concurrent fetches
  const promise = (async (): Promise<FetchResult> => {
    const client = axiosInstance || axios;
    for (const candidate of candidates) {
      // for each gateway/URL allow retries with backoff
      for (let attempt = 0; attempt <= cfgRetries; attempt++) {
        try {
          const res = await client.get(candidate, { responseType: 'arraybuffer' });
          const contentType = res.headers && res.headers['content-type'] ? res.headers['content-type'] : undefined;
          const buffer = Buffer.from(res.data);
          let result: FetchResult = null;
          if (contentType && contentType.includes('application/json')) {
            try {
              result = { contentType, data: JSON.parse(buffer.toString('utf8')), url: candidate };
            } catch (e) {
              result = { contentType, data: buffer.toString('utf8'), url: candidate };
            }
          } else if (contentType && (contentType.startsWith('text/') || contentType.includes('json'))) {
            result = { contentType, data: buffer.toString('utf8'), url: candidate };
          } else {
            result = { contentType, data: buffer.toString('base64'), url: candidate };
          }
          // write caches
          const entry: CacheEntry = { value: result, ts: Date.now() };
          memoryCache.set(cacheKey, entry);
          try { uriToKey.set(uri, cacheKey); } catch (e) {}
          writeFileCache(result).catch(() => {});
          saveUriMap(cfgCacheDir).catch(() => {});
          saveMemoryCache(cfgCacheDir).catch(() => {});
          return result;
        } catch (e) {
          if (attempt < cfgRetries) await sleep(cfgBackoff * Math.pow(2, attempt));
          else break; // try next candidate
        }
      }
    }
    const entry: CacheEntry = { value: null, ts: Date.now() };
    memoryCache.set(cacheKey, entry);
    return null;
  })();

  memoryCache.set(cacheKey, { value: promise, ts: Date.now() });
  const out = await promise;
  return out;
};

export const clearMetadataCache = async (uri?: string) => {
  if (uri) {
    const key = hashKey(uri);
    memoryCache.delete(key);
    uriToKey.delete(uri);
    if (metadataConfig.cacheDir) {
      try {
        await fs.unlink(path.join(metadataConfig.cacheDir, `${key}.json`));
      } catch (e) {
        // ignore
      }
    }
    await saveUriMap().catch(() => {});
    await saveMemoryCache().catch(() => {});
    return;
  }
  // clear all
  memoryCache.clear();
  uriToKey.clear();
  if (metadataConfig.cacheDir) {
    try {
      const files = await fs.readdir(metadataConfig.cacheDir);
      for (const f of files) {
        if (f.endsWith('.json')) {
          try {
            await fs.unlink(path.join(metadataConfig.cacheDir, f));
          } catch (e) {}
        }
      }
    } catch (e) {
      // ignore
    }
  }
};

export const getCacheInfo = async () => {
  const infos: Array<{ key: string; ageSeconds: number; hasValue: boolean }> = [];
  const now = Date.now();
  memoryCache.forEach((v, k) => {
    infos.push({ key: k, ageSeconds: Math.floor((now - v.ts) / 1000), hasValue: !!v.value });
  });
  return infos;
};

export const listCachedUris = async () => {
  const out: Array<{ uri: string; key: string; ageSeconds: number; hasValue: boolean }> = [];
  const now = Date.now();
  uriToKey.forEach((key, uri) => {
    const entry = memoryCache.get(key);
    const age = entry ? Math.floor((now - entry.ts) / 1000) : -1;
    out.push({ uri, key, ageSeconds: age, hasValue: !!(entry && entry.value) });
  });
  return out;
};

let purgeTimer: NodeJS.Timeout | null = null;

export function startMetadataPurge(intervalSeconds = 3600) {
  if (purgeTimer) return;
  purgeTimer = setInterval(() => {
    purgeExpiredMetadata().catch(() => {});
  }, intervalSeconds * 1000) as unknown as NodeJS.Timeout;
}

export function stopMetadataPurge() {
  if (!purgeTimer) return;
  clearInterval(purgeTimer as any);
  purgeTimer = null;
}

export const invalidateMetadataByUri = async (uri: string) => {
  if (!uri) return;
  const key = hashKey(uri);
  memoryCache.delete(key);
  uriToKey.delete(uri);
  // persist map change
  saveUriMap().catch(() => {});
  saveMemoryCache().catch(() => {});
  if (metadataConfig.cacheDir) {
    try {
      await fs.unlink(path.join(metadataConfig.cacheDir, `${key}.json`));
    } catch (e) {
      // ignore
    }
  }
};

export const purgeExpiredMetadata = async () => {
  const now = Date.now();
  const ttl = (metadataConfig.ttlSeconds as number) * 1000;
  // purge memory cache
  const toDelete: string[] = [];
  memoryCache.forEach((v, k) => {
    if (!v || (now - v.ts) > ttl) toDelete.push(k);
  });
  for (const k of toDelete) memoryCache.delete(k);
  // persist memory cache after purge
  saveMemoryCache().catch(() => {});

  // purge file cache
  if (metadataConfig.cacheDir) {
    try {
      const files = await fs.readdir(metadataConfig.cacheDir);
      for (const f of files) {
        if (!f.endsWith('.json')) continue;
        try {
          const content = await fs.readFile(path.join(metadataConfig.cacheDir, f), 'utf8');
          const parsed = JSON.parse(content) as { ts: number; data: FetchResult };
          if (!parsed.ts || (now - parsed.ts) > ttl) {
            try {
              await fs.unlink(path.join(metadataConfig.cacheDir, f));
            } catch (e) {}
          }
        } catch (e) {
          // ignore parse/read errors
        }
      }
    } catch (e) {
      // ignore
    }
  }
};
