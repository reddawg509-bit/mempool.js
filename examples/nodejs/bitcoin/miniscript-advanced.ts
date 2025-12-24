import mempool from '../../../src';

const argv = process.argv.slice(2);
if (argv.length < 1) {
  console.error('Usage: ts-node miniscript-advanced.ts <script> [count]');
  process.exit(1);
}

const script = argv[0];
const count = parseInt(argv[1] || '3', 10);

const client = mempool({ protocol: 'https' });

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
  console.log(`Fetching miniscript info for: ${script}`);
  try {
    const info = await client.bitcoin.miniscript.getScriptInfo({ script });
    console.log('Script info:');
    console.dir(info, { depth: 3 });
  } catch (err) {
    console.error('Failed to fetch script info:', String(err));
  }

  try {
    const txs = await client.bitcoin.miniscript.getScriptTxs({ script, is_mempool: true });
    if (!Array.isArray(txs) || txs.length === 0) {
      console.log('No mempool txs found for this script.');
      return;
    }

    const slice = txs.slice(0, count);
    console.log(`Fetching details for ${slice.length} tx(s)...`);
    const summaries = await Promise.all(slice.map((t) => summarizeTx(t.txid)));
    console.table(summaries);
  } catch (err) {
    console.error('Failed to fetch script txs:', String(err));
  }
}

run();
