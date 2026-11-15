/**
 * Shell flavours behind the themes: each has its own prompt and error messages,
 * so a theme named after a terminal also behaves like that terminal's default shell.
 */
import type { Theme } from './commands';

/** A prompt piece. `cls` picks a per-theme colour in site.css (p-user, p-dir, ...). */
export type PromptSeg = { text: string; cls?: string };
export type Prompt = { pre?: PromptSeg[]; main: PromptSeg[] };
export type Flavor = 'bash' | 'zsh' | 'cmd' | 'ps';
export type Os = 'debian' | 'ubuntu' | 'kali' | 'macos' | 'windows';
export type Env = { shell: Flavor; os: Os };

// Ghostty running Oh My Zsh's default theme, with the user and host in front. The colour themes reuse it.
const GHOSTTY: Prompt = {
  main: [{ text: 'visitor@icns.ca', cls: 'p-user' }, { text: ' ' }, { text: '➜', cls: 'p-ok' }, { text: '  ' }, { text: '~', cls: 'p-dir' }],
};

const PROMPTS: Partial<Record<Theme, Prompt>> = {
  ubuntu: {
    main: [{ text: 'visitor@icns', cls: 'p-user' }, { text: ':', cls: 'p-sym' }, { text: '~', cls: 'p-dir' }, { text: '$', cls: 'p-sym' }],
  },
  debian: { main: [{ text: 'visitor@icns:~$', cls: 'p-sym' }] },
  kali: {
    pre: [
      { text: '┌──(', cls: 'p-frame' },
      { text: 'visitor㉿icns', cls: 'p-user' },
      { text: ')-[', cls: 'p-frame' },
      { text: '~', cls: 'p-dir' },
      { text: ']', cls: 'p-frame' },
    ],
    main: [{ text: '└─', cls: 'p-frame' }, { text: '$', cls: 'p-user' }],
  },
  macosx: { main: [{ text: 'visitor@icns ~ %', cls: 'p-sym' }] },
  cmdline: { main: [{ text: 'C:\\Users\\visitor>', cls: 'p-sym' }] },
  powershell: { main: [{ text: 'PS C:\\Users\\visitor>', cls: 'p-sym' }] },
};

export const DEFAULT_ENV: Env = { shell: 'zsh', os: 'debian' };

const ENVS: Partial<Record<Theme, Env>> = {
  ubuntu: { shell: 'bash', os: 'ubuntu' },
  debian: { shell: 'bash', os: 'debian' },
  kali: { shell: 'zsh', os: 'kali' },
  macosx: { shell: 'zsh', os: 'macos' },
  cmdline: { shell: 'cmd', os: 'windows' },
  powershell: { shell: 'ps', os: 'windows' },
};

/** Ghostty and every colour theme share the ghostty prompt and shell. */
export const promptFor = (t: Theme): Prompt => PROMPTS[t] ?? GHOSTTY;
export const envFor = (t: Theme): Env => ENVS[t] ?? DEFAULT_ENV;

export function notFound(cmd: string, flavor: Flavor): string[] {
  switch (flavor) {
    case 'zsh':
      return [`zsh: command not found: ${cmd}`];
    case 'cmd':
      return [`'${cmd}' is not recognized as an internal or external command,`, 'operable program or batch file.'];
    case 'ps':
      return [
        `${cmd}: The term '${cmd}' is not recognized as a name of a cmdlet, function, script file, or executable program.`,
        'Check the spelling of the name, or if a path was included, verify that the path is correct and try again.',
      ];
    default:
      return [`bash: ${cmd}: command not found`];
  }
}

export function cdError(path: string, flavor: Flavor): string {
  switch (flavor) {
    case 'zsh':
      return `cd: no such file or directory: ${path}`;
    case 'cmd':
      return 'The system cannot find the path specified.';
    case 'ps':
      return `Set-Location: Cannot find path '${path}' because it does not exist.`;
    default:
      return `bash: cd: ${path}: No such file or directory`;
  }
}
