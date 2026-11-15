import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { md5 } from '../../src/terminal/md5';

describe('md5', () => {
  it('matches the RFC 1321 test suite', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(md5('abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(md5('message digest')).toBe('f96b697d7cb7938d525a2f31aaf161d0');
  });
  it('matches node:crypto across block boundaries and UTF-8', () => {
    for (const s of ['x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64), 'x'.repeat(200), 'é✓ 🍁'])
      expect(md5(s)).toBe(createHash('md5').update(s).digest('hex'));
  });
});
