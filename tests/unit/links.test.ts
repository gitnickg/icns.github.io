import { describe, it, expect } from 'vitest';
import { isSafeHref, isExternalHref, opensInNewTab } from '../../src/lib/links';

describe('isSafeHref', () => {
  it('allows https and mailto', () => {
    expect(isSafeHref('https://icns.ca/')).toBe(true);
    expect(isSafeHref('mailto:hello@icns.ca')).toBe(true);
  });
  it('rejects other schemes, relative and empty values', () => {
    for (const h of ['javascript:alert(1)', 'http://icns.ca', 'data:text/html,x', '/relative', '', undefined])
      expect(isSafeHref(h as string | undefined), String(h)).toBe(false);
  });
});

describe('isExternalHref', () => {
  it('is true for https links off icns.ca', () => {
    for (const h of ['https://hackerone.com/gitnickg', 'https://www.linkedin.com/in/gitnickg/', 'https://noticns.ca/'])
      expect(isExternalHref(h), h).toBe(true);
  });
  it('is false for icns.ca, mailto and unsafe links', () => {
    for (const h of ['https://icns.ca/privacy/', 'https://www.icns.ca/', 'https://ICNS.ca/', 'mailto:hello@icns.ca', 'javascript:alert(1)', 'http://example.com/', undefined])
      expect(isExternalHref(h as string | undefined), String(h)).toBe(false);
  });
});

describe('opensInNewTab', () => {
  it('is true for other sites and PDFs', () => {
    for (const h of ['https://hackerone.com/gitnickg', 'https://icns.ca/bitcoin.pdf', 'https://icns.ca/a/B.PDF'])
      expect(opensInNewTab(h), h).toBe(true);
  });
  it('is false for icns.ca pages, mailto and unsafe links', () => {
    for (const h of ['https://icns.ca/privacy/', 'https://icns.ca/pdf/', 'mailto:hello@icns.ca', 'javascript:alert(1)', undefined])
      expect(opensInNewTab(h as string | undefined), String(h)).toBe(false);
  });
});
