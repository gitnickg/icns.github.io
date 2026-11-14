import { describe, it, expect } from 'vitest';
import { run, complete, PUBLIC_COMMANDS, INTRO, type Context } from '../../src/terminal/commands';

const ctx: Context = {
  profiles: [
    { id: 'linkedin', name: 'LinkedIn', handle: 'gitnickg', url: 'https://www.linkedin.com/in/gitnickg/' },
    { id: 'github', name: 'GitHub', handle: 'gitnickg', url: 'https://github.com/gitnickg', stats: '22 public repos' },
  ],
  securityTxt: 'Contact: mailto:hello@icns.ca\nExpires: 2030-01-01\n\n',
};
const text = (r: ReturnType<typeof run>) => r.lines.map((l) => l.map((s) => s.text).join(''));

describe('run', () => {
  it('help lists public commands, last line fixed, no hidden', () => {
    const t = text(run('help', ctx));
    expect(t.length).toBe(PUBLIC_COMMANDS.length + 1);
    expect(t.at(-1)).toBe('some commands are not listed.');
    PUBLIC_COMMANDS.forEach((c, i) => expect(t[i].startsWith(c)).toBe(true));
    const all = t.join('\n');
    for (const h of ['matrix', 'irc', 'sandwich', 'passwd']) expect(all).not.toContain(h);
  });
  it('whoami', () => {
    expect(text(run('whoami', ctx))).toEqual([
      'Sr. Security Developer, CISSP | CCSP',
      'ai dev, system integrations & automations',
      'Independent Consultant @ icns.ca',
    ]);
  });
  it('profiles', () => {
    const r = run('profiles', ctx);
    expect(r.lines[0]).toEqual([
      { text: 'linkedin   → ' },
      { text: 'linkedin.com/in/gitnickg', href: 'https://www.linkedin.com/in/gitnickg/' },
    ]);
    expect(r.lines[1]).toEqual([
      { text: 'github     → ' },
      { text: 'github.com/gitnickg', href: 'https://github.com/gitnickg' },
      { text: '  (22 public repos)' },
    ]);
  });
  it('status', () => {
    expect(text(run('status', ctx))).toEqual(['● bug bounties: active', '● consulting: open, part-time, remote']);
  });
  it('contact', () => {
    expect(run('contact', ctx).lines).toEqual([[{ text: 'hello@icns.ca', href: 'mailto:hello@icns.ca' }]]);
  });
  it('cat security.txt', () => {
    expect(text(run('cat security.txt', ctx))).toEqual(['Contact: mailto:hello@icns.ca', 'Expires: 2030-01-01']);
  });
  it('theme', () => {
    expect(text(run('theme', ctx))).toEqual(['usage: theme blue / green / amber']);
    expect(run('theme', ctx).effect).toBeUndefined();
    const g = run('theme green', ctx);
    expect(text(g)).toEqual(['theme set to green']);
    expect(g.effect).toEqual({ kind: 'theme', theme: 'green' });
    const bad = run('theme pink', ctx);
    expect(text(bad)).toEqual(['usage: theme blue / green / amber']);
    expect(bad.effect).toBeUndefined();
  });
  it('clear and matrix', () => {
    expect(run('clear', ctx)).toEqual({ lines: [], effect: { kind: 'clear' } });
    expect(run('matrix', ctx)).toEqual({ lines: [], effect: { kind: 'matrix' } });
  });
  it('hidden text commands', () => {
    expect(text(run('irc', ctx))).toEqual(['* gitnickg has joined #icns']);
    expect(text(run('sudo make me a sandwich', ctx))).toEqual(['Okay.']);
    expect(text(run('passwd', ctx))).toEqual(['hunter2']);
  });
  it('normalizes input', () => {
    expect(run('  WHOAMI ', ctx)).toEqual(run('whoami', ctx));
    expect(text(run('sudo  make me a   sandwich', ctx))).toEqual(['Okay.']);
  });
  it('empty input', () => {
    expect(run('', ctx)).toEqual({ lines: [] });
    expect(run('   ', ctx)).toEqual({ lines: [] });
  });
  it('unknown', () => {
    expect(text(run('Foo bar', ctx))).toEqual(["command not found: foo. Try 'help'."]);
  });
});

describe('complete', () => {
  it('works', () => {
    expect(complete('')).toEqual([...PUBLIC_COMMANDS]);
    expect(complete('p')).toEqual(['profiles']);
    expect(complete('pa')).toEqual([]);
    expect(complete('cat')).toEqual(['cat security.txt']);
  });
});

it('INTRO', () => expect([...INTRO]).toEqual(['whoami']));
