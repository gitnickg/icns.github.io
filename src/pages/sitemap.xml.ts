import type { APIRoute } from 'astro';
import { execSync } from 'node:child_process';

function lastCommitDate(): string {
  try {
    const d = execSync('git log -1 --format=%cs', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  } catch {
    /* no git available */
  }
  return new Date().toISOString().slice(0, 10);
}

export const GET: APIRoute = () => {
  const lastmod = lastCommitDate();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://icns.ca/</loc>
    <lastmod>${lastmod}</lastmod>
  </url>
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
