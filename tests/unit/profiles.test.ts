import { expect, test } from 'vitest';
import { loadProfiles } from '../../src/lib/profiles';

test('order is linkedin, github', () => {
  expect(loadProfiles().map((p) => p.id)).toEqual(['linkedin', 'github']);
});
