import { describe, it, expect } from 'vitest';
import { run, complete, PUBLIC_COMMANDS, COMPLETIONS, THEMES, INTRO, type Context } from '../../src/terminal/commands';

const ctx: Context = {
  profiles: [
    { id: 'linkedin', name: 'LinkedIn', handle: 'gitnickg', url: 'https://www.linkedin.com/in/gitnickg/' },
    { id: 'github', name: 'GitHub', handle: 'gitnickg', url: 'https://github.com/gitnickg' },
  ],
  securityTxt: 'Contact: mailto:hello@icns.ca\nExpires: 2030-01-01\n\n',
};
// Hidden command names are base64 here so the repo doesn't list them in plain text.
const egg = (b64: string) => atob(b64);
const text = (r: ReturnType<typeof run>) => r.lines.map((l) => l.map((s) => s.text).join(''));

describe('run', () => {
  it('help lists public commands, last line fixed, no hidden', () => {
    const t = text(run('help', ctx));
    expect(t.length).toBe(PUBLIC_COMMANDS.length + 1);
    expect(t.at(-1)).toBe('some commands are not listed.');
    PUBLIC_COMMANDS.forEach((c, i) => expect(t[i].startsWith(c)).toBe(true));
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
    ]);
  });
  it('resume links to LinkedIn', () => {
    const r = run('resume', ctx);
    expect(r.lines).toEqual([[{ text: 'linkedin.com/in/gitnickg', href: 'https://www.linkedin.com/in/gitnickg/' }]]);
    expect(text(run('help', ctx)).some((l) => l.startsWith('resume'))).toBe(true);
    expect(text(run('help', ctx)).some((l) => l.startsWith('status'))).toBe(true);
  });
  it('shell basics', () => {
    expect(text(run('pwd', ctx))).toEqual(['/home/visitor']);
    expect(text(run('hostname', ctx))).toEqual(['icns.ca']);
    expect(text(run('id', ctx))).toEqual(['uid=1000(visitor) gid=1000(visitor) groups=1000(visitor)']);
    expect(text(run('ls', ctx))).toEqual(['security.txt']);
    expect(text(run('ls -a', ctx))).toEqual(['.  ..  .bash_history  .profile  security.txt']);
    expect(text(run('ls -la', ctx))[1]).toMatch(/^-rw-r--r-- 1 visitor visitor \d+ .* security\.txt$/);
    expect(text(run('ls /etc', ctx))).toEqual(["ls: cannot access '/etc': No such file or directory"]);
    expect(text(run('cat ~/security.txt', ctx))).toEqual(text(run('cat security.txt', ctx)));
    expect(text(run('cat notes.txt', ctx))).toEqual(['cat: notes.txt: No such file or directory']);
    expect(text(run('cd', ctx))).toEqual([]);
    expect(text(run('cd /tmp', ctx))).toEqual(['bash: cd: /tmp: No such file or directory']);
    expect(text(run('echo Hello  World', ctx))).toEqual(['Hello  World']);
    expect(text(run('uname', ctx))).toEqual(['Linux']);
    expect(text(run('uname -a', ctx))[0]).toMatch(/^Linux icns\.ca .* GNU\/Linux$/);
    expect(text(run('date', ctx))[0]).toMatch(/^\w{3} \w{3} [ \d]\d \d\d:\d\d:\d\d \S+ \d{4}$/);
    expect(text(run('uptime', ctx))[0]).toMatch(/^ \d\d:\d\d:\d\d up \d+ min,  1 user,  load average: /);
    expect(text(run('sudo ls', ctx))).toEqual(['[sudo] password for visitor: ', 'visitor is not in the sudoers file.']);
    expect(complete('up')).toEqual(['uptime']);
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
    const usage = ['usage: theme <name>', `themes: ${THEMES.join(' ')}`];
    expect(text(run('theme', ctx))).toEqual(usage);
    for (const t of ['solarized', 'dracula', 'nord', 'gruvbox', 'monokai', 'rainbow', 'pink'])
      expect(run(`theme ${t}`, ctx).effect).toEqual({ kind: 'theme', theme: t });
    expect(run('theme', ctx).effect).toBeUndefined();
    const g = run('theme green', ctx);
    expect(text(g)).toEqual(['theme set to green']);
    expect(g.effect).toEqual({ kind: 'theme', theme: 'green' });
    const bad = run('theme plaid', ctx);
    expect(text(bad)).toEqual(usage);
    expect(bad.effect).toBeUndefined();
  });
  it('clear and the hidden screen effects', () => {
    expect(run('clear', ctx)).toEqual({ lines: [], effect: { kind: 'clear' } });
    expect(run(egg('bWF0cml4'), ctx)).toEqual({ lines: [], effect: { kind: 'rain' } });
  });
  it('hidden effect aliases', () => {
    for (const c of [egg('cmVib290'), egg('c3VkbyByZWJvb3Q=')]) expect(run(c, ctx)).toEqual({ lines: [], effect: { kind: 'restart' } });
    for (const c of [egg('cm0gLXJmIC8='), egg('c3VkbyAgcm0gLXJmIC8='), egg('Uk0gLVJGIC8q'), egg('c3VkbyBybSAtcmYgLS1uby1wcmVzZXJ2ZS1yb290IC8=')])
      expect(run(c, ctx)).toEqual({ lines: [], effect: { kind: 'wipe' } });
    expect(complete('r')).toEqual(['resume']);
    expect(complete('s')).toEqual(['status']);
  });
  it('hidden text commands', () => {
    expect(text(run(egg('aXJj'), ctx))).toEqual(['* gitnickg has joined #icns']);
    expect(text(run(egg('c3VkbyBtYWtlIG1lIGEgc2FuZHdpY2g='), ctx))).toEqual(['Okay.']);
    expect(text(run(egg('cGFzc3dk'), ctx))).toEqual(['hunter2']);
  });
  it('normalizes input', () => {
    expect(run('  WHOAMI ', ctx)).toEqual(run('whoami', ctx));
    expect(text(run(egg('c3VkbyAgbWFrZSBtZSBhICAgc2FuZHdpY2g='), ctx))).toEqual(['Okay.']);
  });
  it('empty input', () => {
    expect(run('', ctx)).toEqual({ lines: [] });
    expect(run('   ', ctx)).toEqual({ lines: [] });
  });
  it('unknown', () => {
    expect(text(run('Foo bar', ctx))).toEqual(['bash: foo: command not found']);
  });
});

describe('complete', () => {
  it('works', () => {
    expect(complete('')).toEqual([...COMPLETIONS]);
    for (const c of PUBLIC_COMMANDS) expect(COMPLETIONS).toContain(c);
    expect(complete('p')).toEqual(['profiles', 'pwd']);
    expect(complete('pa')).toEqual([]);
    expect(complete('cat')).toEqual(['cat security.txt', 'cat']);
  });
});

it('INTRO', () => expect([...INTRO]).toEqual(['whoami']));
