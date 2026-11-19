import { expect, test } from 'vitest';
import { loadProfiles } from '../../src/lib/profiles';

test('the footer shows tryhackme, hackthebox, github, linkedin, in that order', () => {
  expect(loadProfiles().filter((p) => p.footer).map((p) => p.id)).toEqual(['tryhackme', 'hackthebox', 'github', 'linkedin']);
});

test('the profiles command lists hackerone and bugcrowd only', () => {
  expect(loadProfiles().filter((p) => p.terminal).map((p) => p.id)).toEqual(['hackerone', 'bugcrowd']);
});

test('resume still finds the linkedin profile', () => {
  expect(loadProfiles().find((p) => p.id === 'linkedin')?.url).toBe('https://www.linkedin.com/in/gitnickg/');
});

test('profile URLs carry no tracking parameters', () => {
  for (const p of loadProfiles()) {
    const u = new URL(p.url);
    expect(u.search, p.id).toBe('');
    expect(u.hash, p.id).toBe('');
  }
});
