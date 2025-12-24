import mempool from '../src';

test('exports miniscript and contracts modules', async () => {
  const client = mempool();
  expect(client).toHaveProperty('bitcoin');
  expect(client.bitcoin).toHaveProperty('miniscript');
  expect(typeof client.bitcoin.miniscript.getScriptInfo).toBe('function');
  expect(typeof client.bitcoin.miniscript.getScriptTxs).toBe('function');

  expect(client).toHaveProperty('liquid');
  expect(client.liquid).toHaveProperty('contracts');
  expect(typeof client.liquid.contracts.getContract).toBe('function');
  expect(typeof client.liquid.contracts.getContractTxs).toBe('function');
});
