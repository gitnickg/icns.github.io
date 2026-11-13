import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';

for (const f of ['CNAME', '.nojekyll', '.well-known/security.txt', 'bitcoin.pdf', 'robots.txt', 'favicon.svg', 'images/og.png'])
  test(`dist keeps ${f}`, () => expect(existsSync(join('dist', f))).toBe(true));
test('CNAME is icns.ca', () => expect(readFileSync('dist/CNAME', 'utf8').trim()).toBe('icns.ca'));
