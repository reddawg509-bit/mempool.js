import mempool from '../../../src';

const client = mempool();

async function run() {
  try {
    const id = 'ordinal:1';
    const info = await client.bitcoin.nft.getOrdinal({ id });
    console.log('Ordinal info:', info);
    const txs = await client.bitcoin.nft.getOrdinalTxs({ id, is_mempool: false });
    console.log('Ordinal txs:', txs.slice(0, 5));
  } catch (err) {
    console.error(err);
  }
}

run();
