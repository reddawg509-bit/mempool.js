import mempool from '../../../src';

const client = mempool();

async function run() {
  try {
    // Replace with a real miniscript/script identifier supported by your API
    const script = '0230...';
    const info = await client.bitcoin.miniscript.getScriptInfo({ script });
    console.log('Miniscript info:', info);

    const txs = await client.bitcoin.miniscript.getScriptTxs({ script, is_mempool: true });
    console.log('Related mempool txs:', txs.slice(0, 5));
  } catch (err) {
    console.error(err);
  }
}

run();
