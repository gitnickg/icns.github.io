import { expect, test } from 'vitest';
import { loadProfiles } from '../../src/lib/profiles';

test('order is linkedin, github, hackthebox, tryhackme', () => {
  expect(loadProfiles().map((p) => p.id)).toEqual(['linkedin', 'github', 'hackthebox', 'tryhackme']);
});

test('profile URLs carry no tracking parameters', () => {
  for (const p of loadProfiles()) {
    const u = new URL(p.url);
    expect(u.search, p.id).toBe('');
    expect(u.hash, p.id).toBe('');
  }
});
