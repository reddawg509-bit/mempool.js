import { fetchMetadata, listCachedUris, clearMetadataCache } from '../src/utils/metadata';

describe('metadata cache mapping', () => {
  test('maps data: uri to cache key and lists it', async () => {
    const json = JSON.stringify({ hello: 'world' });
    const b64 = Buffer.from(json).toString('base64');
    const dataUrl = `data:application/json;base64,${b64}`;
    // ensure clear
    await clearMetadataCache();
    const res = await fetchMetadata(dataUrl);
    expect(res).toBeTruthy();
    const list = await listCachedUris();
    const found = list.find((x) => x.uri === dataUrl);
    expect(found).toBeTruthy();
    expect(found && found.hasValue).toBe(true);
  });
});
