import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Real contents of public/.well-known/security.txt, read at build time (never duplicated by hand). */
export function readSecurityTxt(): string {
  return readFileSync(join(process.cwd(), 'public', '.well-known', 'security.txt'), 'utf8');
}
