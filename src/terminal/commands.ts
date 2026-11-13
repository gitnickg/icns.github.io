import type { Profile } from '../lib/profiles';

export type Segment = { text: string; href?: string };
export type Line = Segment[];
export type Theme = 'blue' | 'green' | 'amber';
export type Effect = { kind: 'clear' } | { kind: 'matrix' } | { kind: 'theme'; theme: Theme };
export type Context = { profiles: Profile[]; securityTxt: string };
export type Result = { lines: Line[]; effect?: Effect };

export const PUBLIC_COMMANDS: readonly string[] = [
  'help',
  'whoami',
  'profiles',
  'status',
  'contact',
  'cat security.txt',
  'theme',
  'clear',
];
export const INTRO: readonly string[] = ['whoami'];

const THEMES: readonly Theme[] = ['blue', 'green', 'amber'];
const THEME_USAGE = 'usage: theme blue / green / amber';

const plain = (s: string): Line => [{ text: s }];

const DESCRIPTIONS: Record<string, string> = {
  help: 'this list',
  whoami: 'who runs this place',
  profiles: 'find me elsewhere',
  status: 'current availability',
  contact: 'get in touch',
  'cat security.txt': 'vulnerability disclosure policy',
  theme: 'change colors',
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
    lines: ctx.profiles.map((p) => {
      const line: Line = [
        { text: `${p.id.padEnd(10)} → ` },
        { text: p.url.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, ''), href: p.url },
      ];
      if (p.stats) line.push({ text: `  (${p.stats})` });
      return line;
    }),
  }),
  status: () => ({
    lines: [plain('● bug bounties: active'), plain('● consulting: open, part-time, remote')],
  }),
  contact: () => ({ lines: [[{ text: 'hello@icns.ca', href: 'mailto:hello@icns.ca' }]] }),
  'cat security.txt': (ctx) => ({
    lines: ctx.securityTxt.replace(/\s+$/, '').split('\n').map(plain),
  }),
  clear: () => ({ lines: [], effect: { kind: 'clear' } }),
  matrix: () => ({ lines: [], effect: { kind: 'matrix' } }),
  irc: () => ({ lines: [plain('* gitnickg has joined #icns')] }),
  'sudo make me a sandwich': () => ({ lines: [plain('Okay.')] }),
  passwd: () => ({ lines: [plain('hunter2')] }),
};

export function run(input: string, ctx: Context): Result {
  const norm = normalize(input);
  if (!norm) return { lines: [] };
  if (norm === 'theme' || norm.startsWith('theme ')) {
    const arg = norm.slice(5).trim();
    const theme = THEMES.find((t) => t === arg);
    if (!theme) return { lines: [plain(THEME_USAGE)] };
    return { lines: [plain(`theme set to ${theme}`)], effect: { kind: 'theme', theme } };
  }
  if (Object.hasOwn(table, norm)) return table[norm](ctx);
  return { lines: [plain(`command not found: ${norm.split(' ')[0]}. Try 'help'.`)] };
}

export function complete(partial: string): string[] {
  const p = partial.toLowerCase().trimStart();
  return PUBLIC_COMMANDS.filter((c) => c.startsWith(p));
}
