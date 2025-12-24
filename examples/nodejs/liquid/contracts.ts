import mempool from '../../../src';

const client = mempool();

async function run() {
  try {
    const contractId = 'contract:abcdef';
    const info = await client.liquid.contracts.getContract({ contract_id: contractId });
    console.log('Contract info:', info);

    const txs = await client.liquid.contracts.getContractTxs({ contract_id: contractId, is_mempool: false });
    console.log('Contract txs:', txs.slice(0, 5));
  } catch (err) {
    console.error(err);
  }
}

run();
