import { expect, test } from 'vitest';
import { loadProfiles } from '../../src/lib/profiles';

test('order is linkedin, github, hackerone, bugcrowd, tryhackme, hackthebox', () => {
  expect(loadProfiles().map((p) => p.id)).toEqual(['linkedin', 'github', 'hackerone', 'bugcrowd', 'tryhackme', 'hackthebox']);
});

test('the footer shows linkedin, github, tryhackme and hackthebox', () => {
  expect(loadProfiles().filter((p) => p.footer).map((p) => p.id)).toEqual(['linkedin', 'github', 'tryhackme', 'hackthebox']);
});

test('profile URLs carry no tracking parameters', () => {
  for (const p of loadProfiles()) {
    const u = new URL(p.url);
    expect(u.search, p.id).toBe('');
    expect(u.hash, p.id).toBe('');
  }
});
