import mempool from '../../../src';

const argv = process.argv.slice(2);
if (argv.length < 1) {
  console.error('Usage: ts-node contracts-advanced.ts <contract_id> [count]');
  process.exit(1);
}

const contractId = argv[0];
const count = parseInt(argv[1] || '3', 10);

const client = mempool({ protocol: 'https' });

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
  console.log(`Fetching contract info for: ${contractId}`);
  try {
    const info = await client.liquid.contracts.getContract({ contract_id: contractId });
    console.log('Contract info:');
    console.dir(info, { depth: 3 });
  } catch (err) {
    console.error('Failed to fetch contract info:', String(err));
  }

  try {
    const txs = await client.liquid.contracts.getContractTxs({ contract_id: contractId, is_mempool: false });
    if (!Array.isArray(txs) || txs.length === 0) {
      console.log('No chain txs found for this contract.');
      return;
    }

    const slice = txs.slice(0, count);
    console.log(`Fetching details for ${slice.length} tx(s)...`);
    const summaries = await Promise.all(slice.map((t) => summarizeTx(t.txid)));
    console.table(summaries);
  } catch (err) {
    console.error('Failed to fetch contract txs:', String(err));
  }
}

run();
