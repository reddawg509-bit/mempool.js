import { fetchMetadata, decodeDataUrl } from '../src/utils/metadata';

describe('metadata utils', () => {
  test('decode data url with json', () => {
    const json = JSON.stringify({ a: 1 });
    const b64 = Buffer.from(json).toString('base64');
    const dataUrl = `data:application/json;base64,${b64}`;
    const decoded = decodeDataUrl(dataUrl);
    expect(decoded).toEqual({ a: 1 });
  });

  test('fetchMetadata handles data url', async () => {
    const json = JSON.stringify({ foo: 'bar' });
    const b64 = Buffer.from(json).toString('base64');
    const dataUrl = `data:application/json;base64,${b64}`;
    const res = await fetchMetadata(dataUrl);
    expect(res).toBeTruthy();
    expect(res && (res.data as any)).toEqual({ foo: 'bar' });
  });

  test('fetchMetadata tries multiple ipfs gateways and caches result', async () => {
    // mock axios instance that fails first then succeeds
    let calls = 0;
    const axiosMock: any = {
      get: jest.fn(async (url: string) => {
        calls++;
        if (calls === 1) throw new Error('gateway down');
        return {
          data: Buffer.from(JSON.stringify({ ok: true })),
          headers: { 'content-type': 'application/json' },
        };
      }),
    };

    const uri = 'ipfs://QmTestHash/metadata.json';
    const res = await fetchMetadata(uri, { gateways: ['https://bad.example/ipfs/', 'https://good.example/ipfs/'], axiosInstance: axiosMock });
    expect(res).toBeTruthy();
    expect(res && res.data).toEqual({ ok: true });
    // second call should use memory cache and not call axios.get again
    const res2 = await fetchMetadata(uri, { gateways: ['https://bad.example/ipfs/', 'https://good.example/ipfs/'], axiosInstance: axiosMock });
    expect(res2).toBeTruthy();
    expect(calls).toBe(2);
  });
});
