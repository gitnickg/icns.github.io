import { expect, test } from 'vitest';
import { loadProfiles } from '../../src/lib/profiles';

const ok = (body: unknown) => (async () => new Response(JSON.stringify(body), { status: 200 })) as typeof fetch;
const byId = (ps: Awaited<ReturnType<typeof loadProfiles>>, id: string) => ps.find((p) => p.id === id)!;

test('adds github stats only', async () => {
  const ps = await loadProfiles(ok({ public_repos: 22 }));
  expect(byId(ps, 'github').stats).toBe('22 public repos');
  expect(byId(ps, 'linkedin').stats).toBeUndefined();
});
test('order is linkedin, github', async () => {
  expect((await loadProfiles(ok({ public_repos: 1 }))).map((p) => p.id)).toEqual(['linkedin', 'github']);
});
test('rejected fetch gives no stats', async () => {
  const ps = await loadProfiles((async () => { throw new Error('down'); }) as typeof fetch);
  expect(ps.map((p) => p.id)).toEqual(['linkedin', 'github']);
  expect(ps.every((p) => p.stats === undefined)).toBe(true);
});
test('HTTP 403 gives no stats', async () => {
  const ps = await loadProfiles((async () => new Response('{}', { status: 403 })) as typeof fetch);
  expect(ps.every((p) => p.stats === undefined)).toBe(true);
});
test('bad JSON gives no stats', async () => {
  const ps = await loadProfiles((async () => new Response('nope', { status: 200 })) as typeof fetch);
  expect(ps.every((p) => p.stats === undefined)).toBe(true);
});
test('missing or non-numeric public_repos gives no stats', async () => {
  for (const body of [{}, { public_repos: '22' }, { public_repos: null }]) {
    const ps = await loadProfiles(ok(body));
    expect(byId(ps, 'github').stats).toBeUndefined();
  }
});
test('sends headers, signal and correct url', async () => {
  let seen: { url: string; init?: RequestInit } | undefined;
  await loadProfiles((async (url: string, init?: RequestInit) => {
    seen = { url, init };
    return new Response('{"public_repos":3}');
  }) as unknown as typeof fetch);
  expect(seen!.url).toBe('https://api.github.com/users/gitnickg');
  const h = seen!.init!.headers as Record<string, string>;
  expect(h['User-Agent']).toBe('icns.ca-build');
  expect(h['Accept']).toBe('application/vnd.github+json');
  expect(seen!.init!.signal).toBeInstanceOf(AbortSignal);
});
