import profilesData from '../data/profiles.json';

export type Profile = { id: string; name: string; handle: string; url: string; stats?: string };

async function githubStats(handle: string, fetchFn: typeof fetch): Promise<string | undefined> {
  try {
    const res = await fetchFn(`https://api.github.com/users/${encodeURIComponent(handle)}`, {
      headers: { 'User-Agent': 'icns.ca-build', Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return undefined;
    const body = (await res.json()) as { public_repos?: unknown };
    const n = body?.public_repos;
    return typeof n === 'number' && Number.isFinite(n) ? `${n} public repos` : undefined;
  } catch {
    return undefined;
  }
}

export async function loadProfiles(fetchFn: typeof fetch = fetch): Promise<Profile[]> {
  const profiles: Profile[] = (profilesData as Profile[]).map((p) => ({ ...p }));
  for (const p of profiles) {
    if (p.id !== 'github') continue;
    const stats = await githubStats(p.handle, fetchFn);
    if (stats) p.stats = stats;
  }
  return profiles;
}
