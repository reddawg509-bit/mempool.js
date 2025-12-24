import mempool from '../../../src';
import { resolveMetadataUri, fetchMetadata, setMetadataConfig, clearMetadataCache, getCacheInfo } from '../../../src/utils/metadata';

const argv = process.argv.slice(2);
if (argv.length < 1) {
  console.error('Usage: ts-node ordinal-advanced.ts <id> [count]');
  process.exit(1);
}

const id = argv[0];
const count = parseInt(argv[1] || '3', 10);

const client = mempool({ protocol: 'https' });

// configure metadata fetching for this example
setMetadataConfig({ cacheDir: './.cache/metadata', ttlSeconds: 60, gateways: ['https://ipfs.io/ipfs/', 'https://cloudflare-ipfs.com/ipfs/'] });

async function summarizeTx(txid: string) {
  try {
    const tx = await client.bitcoin.transactions.getTx({ txid });
    return {
      txid: tx.txid,
      vsize: tx.vsize,
      fee: tx.fee,
      inputs: tx.vin ? tx.vin.length : undefined,
      outputs: tx.vout ? tx.vout.length : undefined,
    };
  } catch (err) {
    return { txid, error: String(err) };
  }
}

async function run() {
  console.log(`Fetching ordinal info for: ${id}`);
  try {
    const info = await client.bitcoin.nft.getOrdinal({ id });
    console.dir(info, { depth: 3 });
    // attempt to fetch content/metadata if present
    const possible = (info as any).content || (info as any).content_url || (info as any).metadata;
    if (possible) {
      const resolved = resolveMetadataUri(typeof possible === 'string' ? possible : undefined);
      console.log('Resolved content/metadata uri:', resolved);
      const fetched = await fetchMetadata(typeof possible === 'string' ? possible : undefined);
      console.log('Fetched content/metadata (if available):');
      console.dir(fetched, { depth: 3 });
    }
  } catch (err) {
    console.error('Failed to fetch ordinal info:', String(err));
  }

  try {
    const txs = await client.bitcoin.nft.getOrdinalTxs({ id, is_mempool: false });
    if (!Array.isArray(txs) || txs.length === 0) {
      console.log('No txs found for this ordinal.');
      return;
    }
    const slice = txs.slice(0, count);
    console.log(`Fetching details for ${slice.length} tx(s)...`);
    const summaries = await Promise.all(slice.map((t) => summarizeTx(t.txid)));
    console.table(summaries);
  } catch (err) {
    console.error('Failed to fetch ordinal txs:', String(err));
  }
}

run();

// print cache info and optionally clear (demonstration)
getCacheInfo().then((info) => console.log('Cache info:', info)).catch(() => {});
// clearMetadataCache(); // uncomment to clear all cache
