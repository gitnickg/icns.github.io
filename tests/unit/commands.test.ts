import { describe, it, expect } from 'vitest';
import { envFor } from '../../src/terminal/shells';
import { PRIVACY } from '../../src/data/privacy';
import { run, complete, completions, PUBLIC_COMMANDS, THEMES, TERMINALS, COLORS, INTRO, type Context } from '../../src/terminal/commands';

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
  it('errors follow the theme\'s shell', () => {
    expect(text(run('nope', ctx))).toEqual(['zsh: command not found: nope']);
    expect(text(run('nope', ctx, envFor('ubuntu')))).toEqual(['bash: nope: command not found']);
    expect(text(run('nope', ctx, envFor('cmd.exe')))).toEqual(["'nope' is not recognized as an internal or external command,", 'operable program or batch file.']);
    expect(text(run('nope', ctx, envFor('powershell')))[0]).toBe("nope: The term 'nope' is not recognized as a name of a cmdlet, function, script file, or executable program.");
    expect(text(run('cd /tmp', ctx))).toEqual(['cd: no such file or directory: /tmp']);
    expect(text(run('cd /tmp', ctx, envFor('debian')))).toEqual(['bash: cd: /tmp: No such file or directory']);
    expect(text(run('cd /tmp', ctx, envFor('cmd.exe')))).toEqual(['The system cannot find the path specified.']);
    expect(text(run('cd /tmp', ctx, envFor('powershell')))).toEqual(["Set-Location: Cannot find path '/tmp' because it does not exist."]);
  });
  it('resume links to LinkedIn', () => {
    const r = run('resume', ctx);
    expect(r.lines).toEqual([[{ text: 'linkedin.com/in/gitnickg', href: 'https://www.linkedin.com/in/gitnickg/' }]]);
    expect(text(run('help', ctx)).some((l) => l.startsWith('resume'))).toBe(true);
    expect(text(run('help', ctx)).some((l) => l.startsWith('status'))).toBe(true);
  });
  it('linux shell basics (default: zsh on Debian)', () => {
    expect(text(run('pwd', ctx))).toEqual(['/home/visitor']);
    expect(text(run('hostname', ctx))).toEqual(['icns.ca']);
    expect(text(run('id', ctx))).toEqual(['uid=1000(visitor) gid=1000(visitor) groups=1000(visitor)']);
    expect(text(run('ls', ctx))).toEqual(['security.txt']);
    expect(text(run('ls -a', ctx))).toEqual(['.  ..  .zsh_history  .zshrc  security.txt']);
    expect(text(run('ls -a', ctx, envFor('ubuntu')))).toEqual(['.  ..  .bash_history  .profile  security.txt']);
    expect(text(run('ls -la', ctx))[1]).toMatch(/^-rw-r--r-- 1 visitor visitor \d+ .* security\.txt$/);
    expect(text(run('ls /etc', ctx))).toEqual(["ls: cannot access '/etc': No such file or directory"]);
    expect(text(run('cat ~/security.txt', ctx))).toEqual(text(run('cat security.txt', ctx)));
    expect(text(run('cat notes.txt', ctx))).toEqual(['cat: notes.txt: No such file or directory']);
    expect(text(run('cd', ctx))).toEqual([]);
    expect(text(run('echo Hello  World', ctx))).toEqual(['Hello  World']);
    expect(text(run('uname', ctx))).toEqual(['Linux']);
    expect(text(run('date', ctx))[0]).toMatch(/^\w{3} \w{3} [ \d]\d \d\d:\d\d:\d\d \S+ \d{4}$/);
    expect(text(run('uptime', ctx))[0]).toMatch(/^ \d\d:\d\d:\d\d up \d+ min,  1 user,  load average: /);
    expect(text(run('sudo ls', ctx))).toEqual(['[sudo] password for visitor: ', 'visitor is not in the sudoers file.']);
    expect(text(run('dir', ctx))).toEqual(['zsh: command not found: dir']);
    expect(complete('up')).toEqual(['uptime']);
  });
  it('each OS reports itself', () => {
    expect(text(run('uname -a', ctx))[0]).toMatch(/^Linux icns\.ca .*Debian.* GNU\/Linux$/);
    expect(text(run('uname -a', ctx, envFor('ubuntu')))[0]).toMatch(/-Ubuntu SMP/);
    expect(text(run('uname -a', ctx, envFor('kali')))[0]).toMatch(/kali1/);
    expect(text(run('cat /etc/os-release', ctx, envFor('kali')))[0]).toBe('PRETTY_NAME="Kali GNU/Linux Rolling"');
    expect(text(run('cat /etc/os-release', ctx, envFor('ubuntu')))[0]).toBe('PRETTY_NAME="Ubuntu 24.04.1 LTS"');
    expect(text(run('cat /etc/os-release', ctx, envFor('debian')))[0]).toBe('PRETTY_NAME="Debian GNU/Linux 13 (trixie)"');
    expect(text(run('sw_vers', ctx))).toEqual(['zsh: command not found: sw_vers']);
    expect(text(run('uname -a', ctx, envFor('fedora')))[0]).toMatch(/\.fc43\.x86_64 /);
    expect(text(run('uname -a', ctx, envFor('arch')))[0]).toMatch(/-arch1-1 /);
    expect(text(run('uname -a', ctx, envFor('opensuse')))[0]).toMatch(/-default /);
    expect(text(run('cat /etc/os-release', ctx, envFor('fedora')))).toContain('PRETTY_NAME="Fedora Linux 43 (Workstation Edition)"');
    expect(text(run('cat /etc/os-release', ctx, envFor('arch')))).toContain('PRETTY_NAME="Arch Linux"');
    expect(text(run('cat /etc/os-release', ctx, envFor('opensuse')))).toContain('PRETTY_NAME="openSUSE Tumbleweed"');
  });
  it('macOS', () => {
    const mac = envFor('macosx');
    expect(text(run('uname', ctx, mac))).toEqual(['Darwin']);
    expect(text(run('uname -a', ctx, mac))[0]).toMatch(/^Darwin icns\.ca .* arm64$/);
    expect(text(run('pwd', ctx, mac))).toEqual(['/Users/visitor']);
    expect(text(run('sw_vers', ctx, mac))[0]).toBe('ProductName:\t\tmacOS');
    expect(text(run('ls -la', ctx, mac))[1]).toMatch(/^-rw-r--r--  1 visitor  staff  \d+ /);
    expect(text(run('id', ctx, mac))[0]).toMatch(/^uid=501\(visitor\) gid=20\(staff\)/);
    expect(text(run('cat /etc/os-release', ctx, mac))).toEqual(['cat: /etc/os-release: No such file or directory']);
    expect(text(run('uptime', ctx, mac))[0]).toMatch(/^\d\d:\d\d  up \d+ mins?, 1 user, load averages: /);
  });
  it('cmd.exe', () => {
    const cmd = envFor('cmd.exe');
    const dir = text(run('dir', ctx, cmd));
    expect(dir[3]).toBe(' Directory of C:\\Users\\visitor');
    expect(dir.some((l) => l.endsWith(' security.txt'))).toBe(true);
    expect(text(run('cd', ctx, cmd))).toEqual(['C:\\Users\\visitor']);
    expect(text(run('type security.txt', ctx, cmd))).toEqual(text(run('cat security.txt', ctx)));
    expect(text(run('type notes.txt', ctx, cmd))).toEqual(['The system cannot find the file specified.']);
    expect(run('cls', ctx, cmd).effect).toEqual({ kind: 'clear' });
    expect(text(run('ver', ctx, cmd))).toEqual(['', 'Microsoft Windows [Version 10.0.26100.2314]']);
    expect(text(run('hostname', ctx, cmd))).toEqual(['ICNS']);
    expect(text(run('echo', ctx, cmd))).toEqual(['ECHO is on.']);
    expect(text(run('ECHO Hi There', ctx, cmd))).toEqual(['Hi There']);
    expect(text(run('date /t', ctx, cmd))[0]).toMatch(/^\w{3} \d\d\/\d\d\/\d{4}$/);
    for (const unix of ['ls', 'pwd', 'uname -a']) expect(text(run(unix, ctx, cmd))[1]).toBe('operable program or batch file.');
    expect(complete('ve', cmd)).toEqual(['ver']);
    expect(complete('ve')).toEqual([]);
  });
  it('PowerShell', () => {
    const ps = envFor('powershell');
    for (const c of ['ls', 'dir', 'gci', 'Get-ChildItem']) {
      const l = text(run(c, ctx, ps));
      expect(l[1]).toBe('    Directory: C:\\Users\\visitor');
      expect(l[5]).toMatch(/^-a--- .* security\.txt$/);
    }
    expect(text(run('pwd', ctx, ps))).toEqual(['', 'Path', '----', 'C:\\Users\\visitor', '']);
    expect(text(run('Get-Content security.txt', ctx, ps))).toEqual(text(run('cat security.txt', ctx)));
    expect(text(run('gc notes.txt', ctx, ps))[0]).toMatch(/^Get-Content: Cannot find path 'C:\\Users\\visitor\\notes\.txt'/);
    expect(run('Clear-Host', ctx, ps).effect).toEqual({ kind: 'clear' });
    expect(text(run('Write-Output Hello', ctx, ps))).toEqual(['Hello']);
    expect(text(run('$PSVersionTable', ctx, ps))[3]).toMatch(/^PSVersion\s+7\./);
    expect(text(run('uname', ctx, ps))[0]).toMatch(/^uname: The term 'uname' is not recognized/);
    expect(complete('get-c', ps)).toEqual(['get-childitem', 'get-content']);
  });
  it('status', () => {
    expect(text(run('status', ctx))).toEqual(['● bug bounties: active', '● consulting: open, part-time, remote']);
  });
  it('contact', () => {
    expect(run('contact', ctx).lines).toEqual([[{ text: 'hello@icns.ca', href: 'mailto:hello@icns.ca' }]]);
  });
  it('security.txt prints the file in every theme', () => {
    for (const t of TERMINALS)
      expect(text(run('security.txt', ctx, envFor(t)))).toEqual(['Contact: mailto:hello@icns.ca', 'Expires: 2030-01-01']);
  });
  it('each OS shows the file with its own command', () => {
    const file = text(run('security.txt', ctx));
    expect(text(run('cat security.txt', ctx, envFor('ubuntu')))).toEqual(file);
    expect(text(run('cat security.txt', ctx, envFor('macosx')))).toEqual(file);
    expect(text(run('type security.txt', ctx, envFor('cmd.exe')))).toEqual(file);
    expect(text(run('Get-Content security.txt', ctx, envFor('powershell')))).toEqual(file);
    expect(text(run('cat security.txt', ctx, envFor('cmd.exe')))[0]).toMatch(/is not recognized/);
    expect(text(run('type security.txt', ctx))).toEqual(['zsh: command not found: type']);
  });
  it('privacy prints the note from src/data/privacy.ts and links to the page', () => {
    const lines = run('privacy', ctx).lines;
    expect(lines.slice(0, PRIVACY.length)).toEqual(PRIVACY);
    expect(lines.at(-1)).toEqual([{ text: 'icns.ca/privacy', href: 'https://icns.ca/privacy/' }]);
    expect(completions()).toContain('privacy');
  });

  it('bitcoin links to the whitepaper', () => {
    expect(run('bitcoin', ctx).lines).toEqual([[{ text: 'icns.ca/bitcoin.pdf', href: 'https://icns.ca/bitcoin.pdf' }]]);
  });
  it('theme', () => {
    const usage = ['usage: theme <name>', `terminals: ${TERMINALS.join(' ')}`, `colors (default): ${COLORS.join(' ')}`];
    expect(THEMES).toEqual([...TERMINALS, ...COLORS]);
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
    expect(text(run('Foo bar', ctx))).toEqual(['zsh: command not found: foo']);
  });
});

describe('complete', () => {
  it('works', () => {
    expect(complete('')).toEqual(completions());
    for (const c of PUBLIC_COMMANDS.filter((c) => c !== 'security.txt')) expect(completions()).toContain(c);
    expect(completions()).not.toContain('security.txt');
    expect(complete('p')).toEqual(['profiles', 'privacy', 'pwd']);
    expect(complete('pa')).toEqual([]);
    expect(complete('cat')).toEqual(['cat']);
    expect(complete('sec')).toEqual([]);
  });
});

it('INTRO', () => expect([...INTRO]).toEqual(['whoami']));

describe('security tools', () => {
  it('scans an IP address or domain name and lists the joke ports in order', () => {
    for (const target of ['example.com', 'icns.ca', 'sub.example.co.uk', '10.0.0.1', '255.255.255.255', '::1', '2001:db8::1']) {
      for (const theme of ['default', 'kali', 'cmd.exe'] as const) {
        const t = text(run(`${egg('bm1hcA==')} ${target}`, ctx, envFor(theme)));
        expect(t[1]).toBe(`Nmap scan report for ${target}`);
        const ports = t.filter((l) => /^\d+\/tcp/.test(l)).map((l) => l.split(/\s+/));
        expect(ports.map(([p, , s]) => [parseInt(p, 10), s])).toEqual([
          [42, 'life'],
          [67, 'yo'],
          [69, 'nice'],
          [420, 'swed'],
          [666, 'mafia'],
          [1337, 'pwnd'],
        ]);
        expect(ports.every(([, st]) => st === 'open')).toBe(true);
      }
    }
  });
  const BAD_TARGETS = ['-sV example.com', 'example.com -p 80', 'example.com 10.0.0.1', 'localhost', 'hello', '256.1.1.1',
      '10.0.0', '10.0.0.1/24', 'http://example.com', 'example.com:80', '-bad-.com', 'exa_mple.com', 'example.123', '1::2::3'];
  it('rejects anything but a single IP address or domain name', () => {
    for (const args of BAD_TARGETS) {
      const t = text(run(`${egg('bm1hcA==')} ${args}`, ctx));
      expect(t[0]).toMatch(/^nmap: invalid target/);
      expect(t.at(-1)).toMatch(/^Usage: nmap/);
      expect(t.join('\n')).not.toMatch(/\/tcp/);
    }
  });
  it('without a target prints usage', () => {
    expect(text(run(egg('bm1hcA=='), ctx)).at(-1)).toMatch(/^Usage: nmap/);
  });
  it('ping replies four times from an IP address or domain name', () => {
    for (const target of ['example.com', '10.0.0.1', '::1']) {
      const t = text(run(`${egg('cGluZw==')} ${target}`, ctx));
      expect(t[0]).toBe(`PING ${target} 56(84) bytes of data.`);
      expect(t.filter((l) => l.startsWith(`69 bytes from ${target}: icmp_seq=`))).toHaveLength(4);
      expect(t).toContain('4 packets transmitted, 4 received, 0% packet loss, time 3004ms');
    }
  });
  it('ping rejects anything but a single IP address or domain name', () => {
    for (const args of BAD_TARGETS) {
      const t = text(run(`${egg('cGluZw==')} ${args}`, ctx));
      expect(t[0]).toMatch(/^ping: invalid target/);
      expect(t.at(-1)).toMatch(/^Usage: ping/);
      expect(t.join('\n')).not.toMatch(/bytes from/);
    }
    expect(text(run(egg('cGluZw=='), ctx))).toEqual(['Usage: ping {IP address | domain name}']);
  });
  it('other tools print a banner', () => {
    for (const b of ['bXNmY29uc29sZQ==', 'c3FsbWFw', 'aHlkcmE=', 'bmlrdG8=', 'am9obg==', 'aGFzaGNhdA==']) {
      const t = text(run(egg(b), ctx));
      expect(t.length).toBeGreaterThan(1);
      expect(t.join('\n')).not.toMatch(/command not found/);
    }
  });
  it('are not listed or completed', () => {
    expect(text(run('help', ctx)).join('\n')).not.toMatch(new RegExp(egg('bm1hcA==')));
    expect(complete(egg('bm1hcA=='))).toEqual([]);
    expect(text(run('help', ctx)).join('\n')).not.toMatch(new RegExp(egg('cGluZw==')));
    expect(complete(egg('cGluZw=='))).toEqual([]);
  });
});
