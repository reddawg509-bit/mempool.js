import mempool from '../src';

test('exports liquid nft module', async () => {
  const client = mempool();
  expect(client).toHaveProperty('liquid');
  expect(client.liquid).toHaveProperty('nft');
  expect(typeof client.liquid.nft.getNFT).toBe('function');
  expect(typeof client.liquid.nft.getNFTOwners).toBe('function');
  expect(typeof client.liquid.nft.getNFTTxs).toBe('function');
});
