/**
 * OS-specific shell commands. Each terminal theme runs on an OS (see envFor in shells.ts),
 * and these answer the way that OS's default shell would.
 */
import type { Context, Line, Result } from './commands';
import { cdError, type Env } from './shells';

const plain = (s: string): Line => [{ text: s }];
const out = (...lines: string[]): Result => ({ lines: lines.map(plain) });
const clear: Result = { lines: [], effect: { kind: 'clear' } };

const pageStart = Date.now();
const pad2 = (n: number) => String(n).padStart(2, '0');
const clock = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
const part = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleString('en-US', o);
const upMinutes = (d: Date) => Math.max(1, Math.floor((d.getTime() - pageStart) / 60000));

function unixDate(d: Date): string {
  const zone = part(d, { timeZoneName: 'short' }).split(' ').pop() ?? 'UTC';
  return `${part(d, { weekday: 'short' })} ${part(d, { month: 'short' })} ${String(d.getDate()).padStart(2, ' ')} ${clock(d)} ${zone} ${d.getFullYear()}`;
}

const securityLines = (ctx: Context) => ctx.securityTxt.replace(/\s+$/, '').split('\n');

// ---------- Linux and macOS ----------

const UNAME_A: Record<string, string> = {
  debian: 'Linux icns.ca 6.12.48-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.12.48-1 x86_64 GNU/Linux',
  ubuntu: 'Linux icns.ca 6.8.0-49-generic #49-Ubuntu SMP PREEMPT_DYNAMIC Mon Nov  4 02:06:24 UTC 2024 x86_64 x86_64 x86_64 GNU/Linux',
  kali: 'Linux icns.ca 6.11.2-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.11.2-1kali1 (2024-10-15) x86_64 GNU/Linux',
  macos:
    'Darwin icns.ca 24.6.0 Darwin Kernel Version 24.6.0: Mon Jul 14 11:28:17 PDT 2025; root:xnu-11417.140.69~1/RELEASE_ARM64_T6000 arm64',
};

const OS_RELEASE: Record<string, string[]> = {
  debian: ['PRETTY_NAME="Debian GNU/Linux 13 (trixie)"', 'NAME="Debian GNU/Linux"', 'VERSION_ID="13"', 'VERSION="13 (trixie)"', 'ID=debian'],
  ubuntu: ['PRETTY_NAME="Ubuntu 24.04.1 LTS"', 'NAME="Ubuntu"', 'VERSION_ID="24.04"', 'VERSION="24.04.1 LTS (Noble Numbat)"', 'ID=ubuntu', 'ID_LIKE=debian'],
  kali: ['PRETTY_NAME="Kali GNU/Linux Rolling"', 'NAME="Kali GNU/Linux"', 'VERSION_ID="2025.3"', 'VERSION="2025.3"', 'ID=kali', 'ID_LIKE=debian'],
};

const UNIX_COMMANDS = ['cat', 'cd', 'date', 'echo', 'hostname', 'id', 'ls', 'pwd', 'uname', 'uptime'];

function unix(norm: string, raw: string, ctx: Context, env: Env): Result | null {
  const mac = env.os === 'macos';
  const home = mac ? '/Users/visitor' : '/home/visitor';
  const isHome = (p: string) => ['.', '~', './', '~/', home, `${home}/`].includes(p);
  const [cmd, ...args] = norm.split(' ');
  const flags = args.filter((a) => a.startsWith('-')).join('');
  const paths = args.filter((a) => !a.startsWith('-'));
  const size = ctx.securityTxt.length;

  switch (cmd) {
    case 'ls': {
      const bad = paths.find((p) => !isHome(p));
      if (bad) return out(mac ? `ls: ${bad}: No such file or directory` : `ls: cannot access '${bad}': No such file or directory`);
      if (flags.includes('l')) {
        const file = mac
          ? `-rw-r--r--  1 visitor  staff  ${size} Nov 14 09:00 security.txt`
          : `-rw-r--r-- 1 visitor visitor ${size} Nov 14 09:00 security.txt`;
        return out(mac ? 'total 8' : 'total 4', file);
      }
      const dots = env.shell === 'zsh' ? ['.zsh_history', '.zshrc'] : ['.bash_history', '.profile'];
      return out((flags.includes('a') ? ['.', '..', ...dots, 'security.txt'] : ['security.txt']).join('  '));
    }
    case 'cat': {
      if (!paths.length) return out();
      const lines: string[] = [];
      for (const p of paths) {
        if (p === '/etc/os-release' && !mac) lines.push(...OS_RELEASE[env.os]);
        else if (p.replace(/^(~\/|\.\/)/, '').replace(`${home}/`, '') === 'security.txt') lines.push(...securityLines(ctx));
        else lines.push(`cat: ${p}: No such file or directory`);
      }
      return out(...lines);
    }
    case 'cd': {
      const p = paths[0];
      if (!p || isHome(p)) return out();
      return out(cdError(p, env.shell));
    }
    case 'pwd':
      return out(home);
    case 'echo':
      return out(raw.trim().replace(/^echo\s*/i, ''));
    case 'hostname':
      return out('icns.ca');
    case 'id':
      return out(mac ? 'uid=501(visitor) gid=20(staff) groups=20(staff),12(everyone),61(localaccounts)' : 'uid=1000(visitor) gid=1000(visitor) groups=1000(visitor)');
    case 'uname':
      return out(flags.includes('a') ? UNAME_A[env.os] : mac ? 'Darwin' : 'Linux');
    case 'date':
      return out(unixDate(new Date()));
    case 'uptime': {
      const d = new Date();
      const m = upMinutes(d);
      if (mac) return out(`${clock(d).slice(0, 5)}  up ${m} min${m === 1 ? '' : 's'}, 1 user, load averages: 1.52 1.61 1.70`);
      const up = m < 60 ? `${m} min` : `${Math.floor(m / 60)}:${pad2(m % 60)}`;
      return out(` ${clock(d)} up ${up},  1 user,  load average: 0.00, 0.01, 0.00`);
    }
    case 'sw_vers':
      return mac ? out('ProductName:\t\tmacOS', 'ProductVersion:\t\t15.6', 'BuildVersion:\t\t24G84') : null;
    case 'sudo':
      return out(mac ? 'Password:' : '[sudo] password for visitor: ', 'visitor is not in the sudoers file.');
    default:
      return null;
  }
}

// ---------- Windows ----------

const WIN_HOME = 'C:\\Users\\visitor';
const winDate = (d: Date) => `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}/${d.getFullYear()}`;
const winTime12 = (d: Date) => {
  const h = d.getHours() % 12 || 12;
  return `${pad2(h)}:${pad2(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
};
const isWinHome = (p: string) => ['.', '~', WIN_HOME.toLowerCase(), `${WIN_HOME.toLowerCase()}\\`].includes(p);
const isSecurityTxt = (p: string) => ['security.txt', '.\\security.txt', `${WIN_HOME.toLowerCase()}\\security.txt`].includes(p);
const winEcho = (raw: string, cmd: RegExp) => raw.trim().replace(cmd, '');

const CMD_COMMANDS = ['cd', 'cls', 'date', 'dir', 'echo', 'hostname', 'time', 'type', 'ver'];

function cmdExe(norm: string, raw: string, ctx: Context): Result | null {
  const [cmd, ...args] = norm.split(' ');
  const rest = args.join(' ');
  switch (cmd) {
    case 'dir': {
      if (rest && !isWinHome(rest)) return out('File Not Found');
      const size = ctx.securityTxt.length;
      return out(
        ' Volume in drive C has no label.',
        ' Volume Serial Number is 4C1A-2B7E',
        '',
        ` Directory of ${WIN_HOME}`,
        '',
        '11/14/2026  09:00 AM    <DIR>          .',
        '11/14/2026  09:00 AM    <DIR>          ..',
        `11/14/2026  09:00 AM    ${String(size).padStart(14)} security.txt`,
        `               1 File(s)    ${String(size).padStart(11)} bytes`,
        '               2 Dir(s)  412,345,678,912 bytes free',
      );
    }
    case 'cd':
    case 'chdir':
      if (!rest) return out(WIN_HOME);
      return isWinHome(rest) ? out() : out(cdError(rest, 'cmd'));
    case 'type':
      if (!rest) return out('The syntax of the command is incorrect.');
      return isSecurityTxt(rest) ? out(...securityLines(ctx)) : out('The system cannot find the file specified.');
    case 'cls':
      return clear;
    case 'ver':
      return out('', 'Microsoft Windows [Version 10.0.26100.2314]');
    case 'hostname':
      return out('ICNS');
    case 'echo':
      return rest ? out(winEcho(raw, /^echo\s*/i)) : out('ECHO is on.');
    case 'date':
      return rest === '/t' ? out(`${part(new Date(), { weekday: 'short' })} ${winDate(new Date())}`) : null;
    case 'time':
      return rest === '/t' ? out(winTime12(new Date())) : null;
    default:
      return null;
  }
}

const PS_COMMANDS = [
  'cd',
  'clear-host',
  'cls',
  'dir',
  'echo',
  'get-childitem',
  'get-content',
  'get-date',
  'get-location',
  'hostname',
  'ls',
  'pwd',
  'set-location',
  'type',
  'write-output',
  '$psversiontable',
];

function powershell(norm: string, raw: string, ctx: Context): Result | null {
  const [cmd, ...args] = norm.split(' ');
  const rest = args.join(' ');
  const size = ctx.securityTxt.length;
  switch (cmd) {
    case 'ls':
    case 'dir':
    case 'gci':
    case 'get-childitem':
      if (rest && !isWinHome(rest)) return out(`Get-ChildItem: Cannot find path '${rest}' because it does not exist.`);
      return out(
        '',
        `    Directory: ${WIN_HOME}`,
        '',
        'Mode                 LastWriteTime         Length Name',
        '----                 -------------         ------ ----',
        `-a---          11/14/2026  9:00 AM ${String(size).padStart(14)} security.txt`,
        '',
      );
    case 'pwd':
    case 'gl':
    case 'get-location':
      return out('', 'Path', '----', WIN_HOME, '');
    case 'cat':
    case 'type':
    case 'gc':
    case 'get-content':
      if (!rest) return null;
      return isSecurityTxt(rest) ? out(...securityLines(ctx)) : out(`Get-Content: Cannot find path '${WIN_HOME}\\${rest}' because it does not exist.`);
    case 'cd':
    case 'sl':
    case 'set-location':
      return !rest || isWinHome(rest) ? out() : out(cdError(rest, 'ps'));
    case 'cls':
    case 'clear-host':
      return clear;
    case 'echo':
    case 'write-output':
    case 'write-host':
      return out(winEcho(raw, /^\S+\s*/));
    case 'hostname':
      return out('ICNS');
    case 'date':
    case 'get-date': {
      const d = new Date();
      const h = d.getHours() % 12 || 12;
      return out(
        '',
        `${part(d, { weekday: 'long' })}, ${part(d, { month: 'long' })} ${d.getDate()}, ${d.getFullYear()} ${h}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())} ${d.getHours() < 12 ? 'AM' : 'PM'}`,
        '',
      );
    }
    case '$psversiontable':
      return out(
        '',
        'Name                           Value',
        '----                           -----',
        'PSVersion                      7.4.6',
        'PSEdition                      Core',
        'OS                             Microsoft Windows 10.0.26100',
        'Platform                       Win32NT',
        '',
      );
    default:
      return null;
  }
}

/** Runs `norm` as a command of the env's OS shell. Null when that shell has no such command. */
export function osCommand(norm: string, raw: string, ctx: Context, env: Env): Result | null {
  if (env.shell === 'cmd') return cmdExe(norm, raw, ctx);
  if (env.shell === 'ps') return powershell(norm, raw, ctx);
  return unix(norm, raw, ctx, env);
}

export function osCompletions(env: Env): string[] {
  if (env.shell === 'cmd') return CMD_COMMANDS;
  if (env.shell === 'ps') return PS_COMMANDS;
  return env.os === 'macos' ? [...UNIX_COMMANDS, 'sw_vers'] : UNIX_COMMANDS;
}
