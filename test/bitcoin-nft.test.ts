import mempool from '../src';

test('exports bitcoin nft (ordinals) module', async () => {
  const client = mempool();
  expect(client).toHaveProperty('bitcoin');
  expect(client.bitcoin).toHaveProperty('nft');
  expect(typeof client.bitcoin.nft.getOrdinal).toBe('function');
  expect(typeof client.bitcoin.nft.getOrdinalTxs).toBe('function');
});
