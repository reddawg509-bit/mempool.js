import mempool from '../../../src';

const client = mempool();

async function run() {
  try {
    const nftId = 'nft:abcdef';
    const info = await client.liquid.nft.getNFT({ nft_id: nftId });
    console.log('NFT info:', info);

    const owners = await client.liquid.nft.getNFTOwners({ nft_id: nftId });
    console.log('Owners:', owners);

    const txs = await client.liquid.nft.getNFTTxs({ nft_id: nftId, is_mempool: false });
    console.log('NFT txs:', txs.slice(0, 5));
  } catch (err) {
    console.error(err);
  }
}

run();
