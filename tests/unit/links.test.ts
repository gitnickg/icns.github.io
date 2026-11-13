import { describe, it, expect } from 'vitest';
import { isSafeHref } from '../../src/lib/links';

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
