import mempool from '../../../src';
import { resolveMetadataUri, fetchMetadata, setMetadataConfig, clearMetadataCache, getCacheInfo } from '../../../src/utils/metadata';

const argv = process.argv.slice(2);
if (argv.length < 1) {
  console.error('Usage: ts-node nft-advanced.ts <nft_id> [count]');
  process.exit(1);
}

const nftId = argv[0];
const count = parseInt(argv[1] || '3', 10);

const client = mempool({ protocol: 'https' });

// configure metadata fetching for this example
setMetadataConfig({ cacheDir: './.cache/metadata', ttlSeconds: 60, gateways: ['https://ipfs.io/ipfs/', 'https://cloudflare-ipfs.com/ipfs/'] });

async function summarizeTx(txid: string) {
  try {
    const tx = await client.liquid.transactions.getTx({ txid });
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
  console.log(`Fetching NFT info for: ${nftId}`);
  try {
    const info = await client.liquid.nft.getNFT({ nft_id: nftId });
    console.dir(info, { depth: 3 });
    // attempt to resolve metadata uri fields commonly used
    const metaUri = (info as any).metadata_uri || (info as any).metadata || (info as any).content;
    if (metaUri) {
      const resolved = resolveMetadataUri(typeof metaUri === 'string' ? metaUri : undefined);
      console.log('Resolved metadata uri:', resolved);
      const fetched = await fetchMetadata(typeof metaUri === 'string' ? metaUri : undefined);
      console.log('Fetched metadata (if available):');
      console.dir(fetched, { depth: 3 });
    }
  } catch (err) {
    console.error('Failed to fetch NFT info:', String(err));
  }

  try {
    const owners = await client.liquid.nft.getNFTOwners({ nft_id: nftId });
    console.log('Owners:');
    console.dir(owners, { depth: 2 });
  } catch (err) {
    console.error('Failed to fetch owners:', String(err));
  }

  try {
    const txs = await client.liquid.nft.getNFTTxs({ nft_id: nftId, is_mempool: false });
    if (!Array.isArray(txs) || txs.length === 0) {
      console.log('No txs found for this NFT.');
      return;
    }
    const slice = txs.slice(0, count);
    console.log(`Fetching details for ${slice.length} tx(s)...`);
    const summaries = await Promise.all(slice.map((t) => summarizeTx(t.txid)));
    console.table(summaries);
  } catch (err) {
    console.error('Failed to fetch NFT txs:', String(err));
  }
}

run();

// print cache info and optionally clear (demonstration)
getCacheInfo().then((info) => console.log('Cache info:', info)).catch(() => {});
// clearMetadataCache(); // uncomment to clear all cache
