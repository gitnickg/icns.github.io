// @vitest-environment jsdom
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const load = (f: string): Document => new DOMParser().parseFromString(readFileSync(join('dist', f), 'utf8'), 'text/html');

const sameOrigin = (url: string): boolean =>
  url.startsWith('https://icns.ca/') || url === 'https://icns.ca' || !/^[a-z][a-z0-9+.-]*:|^\/\//i.test(url);

describe('index.html', () => {
  const doc = load('index.html');
  const text = doc.body.textContent ?? '';

  test('has exactly one h1', () => expect(doc.querySelectorAll('h1')).toHaveLength(1));

  test('has no inline scripts, style elements or style attributes', () => {
    const inline = [...doc.querySelectorAll('script')].filter((s) => !s.hasAttribute('src'));
    expect(inline.map((s) => s.outerHTML)).toEqual([]);
    expect(doc.querySelectorAll('style')).toHaveLength(0);
    expect([...doc.querySelectorAll('[style]')].map((e) => e.outerHTML)).toEqual([]);
  });

  test('scripts, links and images are same-origin', () => {
    const urls = [
      ...[...doc.querySelectorAll('script[src]')].map((e) => e.getAttribute('src')!),
      ...[...doc.querySelectorAll('link[href]')].map((e) => e.getAttribute('href')!),
      ...[...doc.querySelectorAll('img[src]')].map((e) => e.getAttribute('src')!),
    ];
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.filter((u) => !sameOrigin(u))).toEqual([]);
  });

  test('link previews use the large og.png card', () => {
    const meta = (sel: string) => doc.querySelector(sel)?.getAttribute('content');
    expect(meta('meta[property="og:image"]')).toBe('https://icns.ca/images/og.png');
    expect(meta('meta[property="og:image:width"]')).toBe('1200');
    expect(meta('meta[property="og:image:height"]')).toBe('630');
    expect(meta('meta[property="og:image:alt"]')).toBeTruthy();
    expect(meta('meta[name="twitter:card"]')).toBe('summary_large_image');
    expect(meta('meta[name="twitter:image"]')).toBe('https://icns.ca/images/og.png');
    expect(existsSync(join('dist', 'images', 'og.png'))).toBe(true);
  });

  test('every img has width and height', () => {
    const bad = [...doc.querySelectorAll('img')].filter((i) => !i.hasAttribute('width') || !i.hasAttribute('height'));
    expect(bad.map((i) => i.outerHTML)).toEqual([]);
  });

  test('no readable section; the page h1 names the company', () => {
    expect(doc.querySelector('[data-readable]')).toBeNull();
    expect(doc.querySelector('h1')?.textContent).toBe('icns consulting inc.');
  });

  test('footer has only the copyright and profile icon links', () => {
    const footer = doc.querySelector('footer#contact')!;
    expect(footer).not.toBeNull();
    expect(footer.querySelector('p')?.textContent).toBe('© icns consulting inc., Halifax, Nova Scotia');
    const links = [...footer.querySelectorAll('a')];
    expect(links.map((a) => [a.getAttribute('href'), a.getAttribute('aria-label')])).toEqual([
      ['https://www.linkedin.com/in/gitnickg/', 'LinkedIn'],
      ['https://github.com/gitnickg', 'GitHub'],
    ]);
    for (const a of links) expect(a.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });

  test('copy avoids banned words', () => {
    const all = doc.documentElement.outerHTML.toLowerCase();
    for (const w of ['wealthsimple', 'atlseccon', 'organizer', 'free consultation', 'trusted', 'discreet', 'hands-on', 'private'])
      expect(all, w).not.toContain(w);
  });

  test('terminal output holds the static intro', () => {
    const out = doc.querySelector('[data-term-output]');
    expect(out).not.toBeNull();
    const t = (out!.textContent ?? '').replace(/\s+/g, ' ');
    expect(t).toContain('visitor@icns.ca:~$ whoami');
    expect(t).toContain('Sr. Security Developer, CISSP | CCSP');
    expect(t).toContain('Independent Consultant @ icns.ca');
    expect(t).not.toContain('visitor@icns.ca:~$ profiles');
    expect(t).not.toContain('visitor@icns.ca:~$ status');
    expect(out!.getAttribute('aria-live')).toBe('polite');
  });

  test('terminal has a labelled input, chips and context', () => {
    const root = doc.querySelector('[data-context]')!;
    expect(root).not.toBeNull();
    const ctx = JSON.parse(root.getAttribute('data-context')!);
    expect(ctx.securityTxt).toContain('Contact: mailto:hello@icns.ca');
    expect(ctx.profiles.length).toBeGreaterThan(0);
    const input = root.querySelector('form[data-term-form] input[data-term-input]')!;
    expect(input).not.toBeNull();
    expect(doc.querySelector(`label[for="${input.id}"]`)).not.toBeNull();
    const chips = [...root.querySelectorAll('[data-term-chips] button[data-cmd]')].map((b) => b.getAttribute('data-cmd'));
    expect(chips).toEqual(['whoami', 'profiles', 'status', 'contact', 'help']);
    expect(text).toContain('icns');
  });
});

test('contact/index.html redirects to /#contact', () => {
  const doc = load('contact/index.html');
  expect(doc.querySelector('meta[http-equiv="refresh"]')?.getAttribute('content')).toMatch(/url=\/#contact$/);
  expect(doc.querySelector('a[href="/#contact"]')).not.toBeNull();
  expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toContain('noindex');
});

test('404.html exists with noindex and one h1', () => {
  expect(existsSync('dist/404.html')).toBe(true);
  const doc = load('404.html');
  expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toContain('noindex');
  expect(doc.querySelectorAll('h1')).toHaveLength(1);
  expect([...doc.querySelectorAll('script')].filter((s) => !s.hasAttribute('src'))).toHaveLength(0);
});

test('sitemap.xml lists https://icns.ca/', () => {
  const xml = readFileSync('dist/sitemap.xml', 'utf8');
  expect(xml).toContain('<loc>https://icns.ca/</loc>');
  expect(xml).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
});
