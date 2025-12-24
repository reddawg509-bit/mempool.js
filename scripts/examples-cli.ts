#!/usr/bin/env ts-node
import readline from 'readline';
import mempool from '../src';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function question(q: string) {
  return new Promise<string>((resolve) => rl.question(q, resolve));
}

async function runMiniscript(script: string, count = 3) {
  const client = mempool({ protocol: 'https' });
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
    const summaries = await Promise.all(
      slice.map(async (t) => {
        try {
          const tx = await client.bitcoin.transactions.getTx({ txid: t.txid });
          return {
            txid: tx.txid,
            vsize: tx.vsize,
            fee: tx.fee,
            inputs: tx.vin ? tx.vin.length : undefined,
            outputs: tx.vout ? tx.vout.length : undefined,
          };
        } catch (err) {
          return { txid: t.txid, error: String(err) };
        }
      })
    );
    console.table(summaries);
  } catch (err) {
    console.error('Failed to fetch script txs:', String(err));
  }
}

async function runContracts(contractId: string, count = 3) {
  const client = mempool({ protocol: 'https' });
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
    const summaries = await Promise.all(
      slice.map(async (t) => {
        try {
          const tx = await client.liquid.transactions.getTx({ txid: t.txid });
          return {
            txid: tx.txid,
            vsize: tx.vsize,
            fee: tx.fee,
            inputs: tx.vin ? tx.vin.length : undefined,
            outputs: tx.vout ? tx.vout.length : undefined,
          };
        } catch (err) {
          return { txid: t.txid, error: String(err) };
        }
      })
    );
    console.table(summaries);
  } catch (err) {
    console.error('Failed to fetch contract txs:', String(err));
  }
}

async function main() {
  const args = process.argv.slice(2);
  let cmd = args[0];
  if (!cmd) {
    console.log('Choose example:');
    console.log('1) miniscript');
    console.log('2) contracts');
    const choice = await question('Select (1|2): ');
    if (choice.trim() === '1') cmd = 'miniscript';
    else if (choice.trim() === '2') cmd = 'contracts';
    else {
      console.log('Invalid selection');
      rl.close();
      process.exit(1);
    }
  }

  if (cmd === 'miniscript') {
    const script = args[1] || (await question('Enter script identifier: '));
    const countInput = args[2] || (await question('How many txs to fetch (default 3): '));
    const count = parseInt(countInput || '3', 10) || 3;
    await runMiniscript(script.trim(), count);
  } else if (cmd === 'contracts') {
    const contractId = args[1] || (await question('Enter contract id: '));
    const countInput = args[2] || (await question('How many txs to fetch (default 3): '));
    const count = parseInt(countInput || '3', 10) || 3;
    await runContracts(contractId.trim(), count);
  } else {
    console.log('Unknown command. Use "miniscript" or "contracts".');
  }

  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});
