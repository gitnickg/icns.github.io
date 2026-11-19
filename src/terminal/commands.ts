import type { Profile } from '../lib/profiles';
import { md5 } from './md5';
import { DEFAULT_ENV, notFound, type Env } from './shells';
import { osCommand, osCompletions } from './os';
import { secTool } from './sec';
import { PRIVACY } from '../data/privacy';

export type Segment = { text: string; href?: string };
export type Line = Segment[];
/** Terminal look-alikes, each with its own prompt, shell and OS. */
export const TERMINALS = ['default', 'ubuntu', 'debian', 'fedora', 'arch', 'opensuse', 'kali', 'macosx', 'cmd.exe', 'powershell'] as const;
/** Colour schemes for the default terminal. */
export const COLORS = [
  'catppuccin-frappe',
  'catppuccin-latte',
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
export const THEMES = [...TERMINALS, ...COLORS] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = 'default';
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
  'security.txt',
  'privacy',
  'bitcoin',
  'theme',
  'clear',
];
export const INTRO: readonly string[] = ['whoami'];

const THEME_USAGE: Line[] = [
  [{ text: 'usage: theme <name>' }],
  [{ text: `terminals: ${TERMINALS.join(' ')}` }],
  [{ text: `colors (default): ${COLORS.join(' ')}` }],
];

const plain = (s: string): Line => [{ text: s }];

const DESCRIPTIONS: Record<string, string> = {
  help: 'this list',
  whoami: 'who runs this place',
  profiles: 'find me elsewhere',
  status: 'current availability',
  resume: 'work history',
  contact: 'get in touch',
  'security.txt': 'report a vuln',
  privacy: 'what this site collects',
  bitcoin: 'the whitepaper',
  theme: 'change terminal or colors',
  clear: 'clear the screen',
};

const normalize = (input: string): string => input.trim().toLowerCase().replace(/\s+/g, ' ');

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
    lines: ctx.profiles.filter((p) => p.terminal).map((p): Line => [{ text: p.name, href: p.url }]),
  }),
  status: () => ({
    lines: [plain('● bug bounties: active'), plain('● consulting: open, part-time, remote')],
  }),
  contact: () => ({ lines: [[{ text: 'hello@icns.ca', href: 'mailto:hello@icns.ca' }]] }),
  'security.txt': (ctx) => ({
    lines: ctx.securityTxt.replace(/\s+$/, '').split('\n').map(plain),
  }),
  privacy: () => ({
    lines: [...PRIVACY.map((l): Line => l.map((s) => ({ ...s }))), plain(''), [{ text: 'icns.ca/privacy', href: 'https://icns.ca/privacy/' }]],
  }),
  bitcoin: () => ({ lines: [[{ text: 'icns.ca/bitcoin.pdf', href: 'https://icns.ca/bitcoin.pdf' }]] }),
  resume: (ctx) => {
    const li = ctx.profiles.find((p) => p.id === 'linkedin');
    return { lines: li ? [[{ text: li.url.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, ''), href: li.url }]] : [] };
  },
  clear: () => ({ lines: [], effect: { kind: 'clear' } }),
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

export function run(input: string, ctx: Context, env: Env = DEFAULT_ENV): Result {
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
  const [name, ...args] = norm.split(' ');
  const tool = secTool(md5(name), args);
  if (tool) return tool;
  const sh = osCommand(norm, input, ctx, env);
  if (sh) return sh;
  return { lines: notFound(norm.split(' ')[0], env.shell).map(plain) };
}

/** Tab completion: the site's commands, then the current shell's own. */
// Listed in help but left out of tab completion.
const NO_COMPLETE: readonly string[] = ['security.txt'];

export function completions(env: Env = DEFAULT_ENV): string[] {
  const site = PUBLIC_COMMANDS.filter((c) => !NO_COMPLETE.includes(c));
  return [...site, ...osCompletions(env).filter((c) => !site.includes(c))];
}

export function complete(partial: string, env: Env = DEFAULT_ENV): string[] {
  const p = partial.toLowerCase().trimStart();
  return completions(env).filter((c) => c.startsWith(p));
}
