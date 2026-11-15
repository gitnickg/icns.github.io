import type { Profile } from '../lib/profiles';
import { md5 } from './md5';

export type Segment = { text: string; href?: string };
export type Line = Segment[];
export const THEMES = [
  'blue',
  'green',
  'amber',
  'white',
  'red',
  'cyan',
  'purple',
  'pink',
  'solarized',
  'dracula',
  'nord',
  'gruvbox',
  'monokai',
  'rainbow',
] as const;
export type Theme = (typeof THEMES)[number];
export type Effect = { kind: 'clear' } | { kind: 'rain' } | { kind: 'restart' } | { kind: 'wipe' } | { kind: 'theme'; theme: Theme };
export type Context = { profiles: Profile[]; securityTxt: string };
export type Result = { lines: Line[]; effect?: Effect };

export const PUBLIC_COMMANDS: readonly string[] = [
  'help',
  'whoami',
  'profiles',
  'status',
  'resume',
  'contact',
  'cat security.txt',
  'theme',
  'clear',
];
export const INTRO: readonly string[] = ['whoami'];

const THEME_USAGE: Line[] = [[{ text: 'usage: theme <name>' }], [{ text: `themes: ${THEMES.join(' ')}` }]];

const plain = (s: string): Line => [{ text: s }];

const DESCRIPTIONS: Record<string, string> = {
  help: 'this list',
  whoami: 'who runs this place',
  profiles: 'find me elsewhere',
  status: 'current availability',
  resume: 'work history',
  contact: 'get in touch',
  'cat security.txt': 'report a vuln',
  theme: 'change colors',
  clear: 'clear the screen',
};

const normalize = (input: string): string => input.trim().toLowerCase().replace(/\s+/g, ' ');

// A small, believable shell around the site's own commands.
const HOST = 'icns.ca';
const HOME = '/home/visitor';
const FILES = ['security.txt'];
const SHELL_COMMANDS: readonly string[] = ['cat', 'cd', 'date', 'echo', 'hostname', 'id', 'ls', 'pwd', 'uname', 'uptime'];
export const COMPLETIONS: readonly string[] = [...PUBLIC_COMMANDS, ...SHELL_COMMANDS.filter((c) => !PUBLIC_COMMANDS.includes(c))];

const UNAME = 'Linux icns.ca 6.12.48-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.12.48-1 x86_64 GNU/Linux';
const pageStart = Date.now();
const pad2 = (n: number) => String(n).padStart(2, '0');
const clock = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

function dateLine(d: Date): string {
  const part = (o: Intl.DateTimeFormatOptions) => d.toLocaleString('en-US', o);
  const zone = part({ timeZoneName: 'short' }).split(' ').pop() ?? 'UTC';
  return `${part({ weekday: 'short' })} ${part({ month: 'short' })} ${String(d.getDate()).padStart(2, ' ')} ${clock(d)} ${zone} ${d.getFullYear()}`;
}

function uptimeLine(d: Date): string {
  const mins = Math.max(1, Math.floor((d.getTime() - pageStart) / 60000));
  const up = mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}:${pad2(mins % 60)}`;
  return ` ${clock(d)} up ${up},  1 user,  load average: 0.00, 0.01, 0.00`;
}

/** Shell commands that take arguments. Returns null when `cmd` isn't one of them. */
function shell(norm: string, raw: string, ctx: Context): Result | null {
  const [cmd, ...args] = norm.split(' ');
  const flags = args.filter((a) => a.startsWith('-')).join('');
  const paths = args.filter((a) => !a.startsWith('-'));
  switch (cmd) {
    case 'ls': {
      const bad = paths.find((p) => !['.', '~', './', '~/', HOME, `${HOME}/`].includes(p));
      if (bad) return { lines: [plain(`ls: cannot access '${bad}': No such file or directory`)] };
      if (flags.includes('l'))
        return {
          lines: [
            plain(`total 4`),
            plain(`-rw-r--r-- 1 visitor visitor ${ctx.securityTxt.length} Nov 14 09:00 security.txt`),
          ],
        };
      return { lines: [plain((flags.includes('a') ? ['.', '..', '.bash_history', '.profile', ...FILES] : FILES).join('  '))] };
    }
    case 'cat': {
      if (!paths.length) return { lines: [] };
      const lines: Line[] = [];
      for (const p of paths) {
        const name = p.replace(/^(~\/|\.\/|\/home\/visitor\/)/, '');
        if (name === 'security.txt') lines.push(...table['cat security.txt'](ctx).lines);
        else lines.push(plain(`cat: ${p}: No such file or directory`));
      }
      return { lines };
    }
    case 'cd': {
      const p = paths[0];
      if (!p || ['~', '.', '~/', HOME, `${HOME}/`].includes(p)) return { lines: [] };
      return { lines: [plain(`bash: cd: ${p}: No such file or directory`)] };
    }
    case 'echo':
      return { lines: [plain(raw.trim().replace(/^echo\s*/i, ''))] };
    case 'uname':
      return { lines: [plain(flags.includes('a') ? UNAME : 'Linux')] };
    case 'sudo':
      return { lines: [plain('[sudo] password for visitor: '), plain('visitor is not in the sudoers file.')] };
    default:
      return null;
  }
}

const table: Record<string, (ctx: Context) => Result> = {
  help: () => ({
    lines: [
      ...PUBLIC_COMMANDS.map((c) => plain(`${c.padEnd(17)}${DESCRIPTIONS[c]}`)),
      plain('some commands are not listed.'),
    ],
  }),
  whoami: () => ({
    lines: [
      plain('Sr. Security Developer, CISSP | CCSP'),
      plain('ai dev, system integrations & automations'),
      plain('Independent Consultant @ icns.ca'),
    ],
  }),
  profiles: (ctx) => ({
    lines: ctx.profiles.map((p): Line => [
      { text: `${p.id.padEnd(10)} → ` },
      { text: p.url.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, ''), href: p.url },
    ]),
  }),
  status: () => ({
    lines: [plain('● bug bounties: active'), plain('● consulting: open, part-time, remote')],
  }),
  contact: () => ({ lines: [[{ text: 'hello@icns.ca', href: 'mailto:hello@icns.ca' }]] }),
  'cat security.txt': (ctx) => ({
    lines: ctx.securityTxt.replace(/\s+$/, '').split('\n').map(plain),
  }),
  resume: (ctx) => {
    const li = ctx.profiles.find((p) => p.id === 'linkedin');
    return { lines: li ? [[{ text: li.url.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, ''), href: li.url }]] : [] };
  },
  clear: () => ({ lines: [], effect: { kind: 'clear' } }),
  pwd: () => ({ lines: [plain(HOME)] }),
  hostname: () => ({ lines: [plain(HOST)] }),
  id: () => ({ lines: [plain('uid=1000(visitor) gid=1000(visitor) groups=1000(visitor)')] }),
  date: () => ({ lines: [plain(dateLine(new Date()))] }),
  uptime: () => ({ lines: [plain(uptimeLine(new Date()))] }),
};

const rain: Result = { lines: [], effect: { kind: 'rain' } };
const restart: Result = { lines: [], effect: { kind: 'restart' } };
const wipe: Result = { lines: [], effect: { kind: 'wipe' } };

// Unlisted commands, keyed by the MD5 of the normalized input.
const hidden: Record<string, () => Result> = {
  '21b72c0b7adc5c7b4a50ffcb90d92dd6': () => rain,
  '2b755b30293f2f9f79ec1c86ab0943f2': () => restart,
  '06d12c03aa485826b7f204affe755aa8': () => restart,
  e8df9be294ac8e322ec835d26ba03281: () => wipe,
  '40a43584ccccdaf0766634be67aeb09c': () => wipe,
  b6f081a2140bb35e564495559b0bc8d0: () => wipe,
  '882e3cabc5c8166caff91a38eb2910df': () => wipe,
  '2442df115327711ed6e4aaf9304b3ed0': () => wipe,
  '7eaaa0beceb006ed2d0ccfd95671c72d': () => wipe,
  eb15301d463a9ce20497702ac91d1a0e: () => ({ lines: [plain('* gitnickg has joined #icns')] }),
  '0ab4f1d5aba1fd806359b6d7fda7a6ca': () => ({ lines: [plain('Okay.')] }),
  '76a2173be6393254e72ffa4d6df1030a': () => ({ lines: [plain('hunter2')] }),
};

export function run(input: string, ctx: Context): Result {
  const norm = normalize(input);
  if (!norm) return { lines: [] };
  if (norm === 'theme' || norm.startsWith('theme ')) {
    const arg = norm.slice(5).trim();
    const theme = THEMES.find((t) => t === arg);
    if (!theme) return { lines: THEME_USAGE };
    return { lines: [plain(`theme set to ${theme}`)], effect: { kind: 'theme', theme } };
  }
  if (Object.hasOwn(table, norm)) return table[norm](ctx);
  const h = md5(norm);
  if (Object.hasOwn(hidden, h)) return hidden[h]();
  const sh = shell(norm, input, ctx);
  if (sh) return sh;
  return { lines: [plain(`bash: ${norm.split(' ')[0]}: command not found`)] };
}

export function complete(partial: string): string[] {
  const p = partial.toLowerCase().trimStart();
  return COMPLETIONS.filter((c) => c.startsWith(p));
}
