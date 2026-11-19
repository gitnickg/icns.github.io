import { run, complete, INTRO, THEMES, DEFAULT_THEME, type Context, type Line, type Theme } from './commands';
import { promptFor, envFor, type PromptSeg } from './shells';
import { startRain } from './rain';
import { startRestart, startWipe } from './effects';
import { startRainbow } from './rainbow';
import { isSafeHref, opensInNewTab, NEW_TAB } from '../lib/links';

const STORAGE_KEY = 'icns-terminal-theme';

export type TerminalOptions = { reducedMotion?: boolean; typingDelayMs?: number };

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readTheme(): Theme {
  try {
    // Old theme names: 'ghostty' is now 'default', 'cmdline' is now 'cmd.exe'.
    const old: Record<string, Theme> = { ghostty: 'default', cmdline: 'cmd.exe' };
    const stored = localStorage.getItem(STORAGE_KEY);
    const v = stored && Object.hasOwn(old, stored) ? old[stored] : stored;
    const t = THEMES.find((x) => x === v);
    if (t) return t;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_THEME;
}

function saveTheme(t: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, t);
  } catch {
    /* storage unavailable */
  }
}

function renderLine(line: Line): HTMLElement {
  const div = document.createElement('div');
  div.className = 'term-line';
  let any = false;
  for (const seg of line) {
    if (seg.text) any = true;
    if (isSafeHref(seg.href)) {
      const a = document.createElement('a');
      a.className = 'term-link';
      a.href = seg.href;
      if (seg.href.startsWith('https:')) a.rel = 'noopener noreferrer';
      a.textContent = seg.text;
      if (opensInNewTab(seg.href)) {
        a.target = '_blank';
        a.setAttribute('aria-label', seg.text + NEW_TAB);
      }
      div.appendChild(a);
    } else {
      div.appendChild(document.createTextNode(seg.text));
    }
  }
  if (!any) div.classList.add('term-blank');
  return div;
}

/** A `.term-prompt` span holding coloured prompt pieces. */
export function promptSpan(segs: PromptSeg[], el: HTMLElement = document.createElement('span')): HTMLElement {
  el.className = 'term-prompt';
  el.replaceChildren(
    ...segs.map((s) => {
      if (!s.cls) return document.createTextNode(s.text);
      const span = document.createElement('span');
      span.className = s.cls;
      span.textContent = s.text;
      return span;
    }),
  );
  return el;
}

function longestCommonPrefix(items: string[]): string {
  let p = items[0] ?? '';
  for (const s of items) while (!s.startsWith(p)) p = p.slice(0, -1);
  return p;
}

export function mountTerminal(root: HTMLElement, ctx: Context, opts: TerminalOptions = {}): void {
  const output = root.querySelector<HTMLElement>('[data-term-output]');
  const form = root.querySelector<HTMLFormElement>('form[data-term-form]');
  const input = root.querySelector<HTMLInputElement>('input[data-term-input]');
  if (!output || !form || !input) return;

  const reduced = opts.reducedMotion ?? prefersReducedMotion();
  const delay = opts.typingDelayMs ?? 35;

  const formPrompt = form.querySelector<HTMLElement>('.term-prompt');
  const formPre = root.querySelector<HTMLElement>('[data-term-pre]');
  let theme: Theme = DEFAULT_THEME;
  let stopRainbow: (() => void) | null = null;
  const applyTheme = (t: Theme) => {
    theme = t;
    root.dataset.theme = t;
    const p = promptFor(t);
    if (formPrompt) promptSpan(p.main, formPrompt);
    if (formPre) {
      formPre.hidden = !p.pre;
      promptSpan(p.pre ?? [], formPre.querySelector<HTMLElement>('.term-prompt') ?? formPre.appendChild(document.createElement('span')));
    }
    stopRainbow?.();
    stopRainbow = t === 'rainbow' ? startRainbow(output) : null;
  };
  applyTheme(readTheme());

  const scroll = () => {
    output.scrollTop = output.scrollHeight;
  };

  const echo = (cmd: string): HTMLElement => {
    const p = promptFor(theme);
    if (p.pre) {
      const pre = document.createElement('div');
      pre.className = 'term-line term-pre';
      pre.appendChild(promptSpan(p.pre));
      output.appendChild(pre);
    }
    const div = document.createElement('div');
    div.className = 'term-line term-echo';
    const prompt = promptSpan(p.main);
    const text = document.createElement('span');
    text.className = 'term-cmd';
    text.textContent = cmd;
    div.append(prompt, ' ', text);
    output.appendChild(div);
    scroll();
    return text;
  };

  let stopRain: (() => void) | null = null;

  // Screen effects lock the prompt until they finish (or a key/pointer press skips them).
  const runEffect = (start: typeof startRestart, after?: () => void) => {
    const hadFocus = document.activeElement === input;
    input.disabled = true;
    start({
      root,
      output,
      reducedMotion: reduced,
      print: (text) => {
        output.appendChild(renderLine([{ text }]));
        scroll();
      },
      done: () => {
        after?.();
        input.disabled = false;
        if (hadFocus) input.focus({ preventScroll: true });
        scroll();
      },
    });
  };

  const printResult = (cmd: string) => {
    const result = run(cmd, ctx, envFor(theme));
    const eff = result.effect;
    if (eff?.kind === 'clear') {
      output.replaceChildren();
      return;
    }
    for (const line of result.lines) output.appendChild(renderLine(line));
    if (eff?.kind === 'theme') {
      applyTheme(eff.theme);
      saveTheme(eff.theme);
    } else if (eff?.kind === 'rain') {
      stopRain?.();
      stopRain = reduced ? startRain(output, true) : startRain(root, false);
    } else if (eff?.kind === 'restart') {
      runEffect(startRestart, () => {
        echo(INTRO[0]);
        printResult(INTRO[0]);
      });
    } else if (eff?.kind === 'wipe') {
      runEffect(startWipe);
    }
    scroll();
  };

  // Intro sequence
  let introIndex = 0;
  let introDone = false;
  let typingSpan: HTMLElement | null = null;
  let typed = 0;
  let timer: number | undefined;

  const finishIntro = () => {
    if (introDone) return;
    introDone = true;
    output.removeAttribute('aria-busy');
    if (timer !== undefined) window.clearTimeout(timer);
    if (typingSpan) {
      typingSpan.textContent = INTRO[introIndex];
      printResult(INTRO[introIndex]);
      typingSpan = null;
      introIndex++;
    }
    for (; introIndex < INTRO.length; introIndex++) {
      echo(INTRO[introIndex]);
      printResult(INTRO[introIndex]);
    }
  };

  const step = () => {
    const cmd = INTRO[introIndex];
    if (!typingSpan) {
      typingSpan = echo('');
      typed = 0;
    }
    if (typed < cmd.length) {
      typed++;
      typingSpan.textContent = cmd.slice(0, typed);
      timer = window.setTimeout(step, delay);
      return;
    }
    printResult(cmd);
    typingSpan = null;
    introIndex++;
    if (introIndex >= INTRO.length) {
      introDone = true;
      output.removeAttribute('aria-busy');
      return;
    }
    timer = window.setTimeout(step, delay * 4);
  };

  // History
  const history: string[] = [];
  let hIdx = 0;
  let draft = '';

  const execute = (cmd: string) => {
    finishIntro();
    echo(cmd);
    if (cmd.trim()) {
      history.push(cmd);
    }
    hIdx = history.length;
    draft = '';
    printResult(cmd);
  };

  const typing = !(reduced || delay <= 0);
  if (typing) output.setAttribute('aria-busy', 'true');
  output.replaceChildren();
  if (!typing) {
    finishIntro();
  } else {
    step();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value;
    input.value = '';
    execute(value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length) {
        if (hIdx === history.length) draft = input.value;
        if (hIdx > 0) hIdx--;
        input.value = history[hIdx];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hIdx < history.length - 1) {
        hIdx++;
        input.value = history[hIdx];
      } else if (hIdx < history.length) {
        hIdx = history.length;
        input.value = draft;
      }
    } else if (e.key === 'Tab') {
      const val = input.value;
      const matches = complete(val, envFor(theme));
      if (matches.length === 0) return;
      const next = matches.length === 1 ? matches[0] : longestCommonPrefix(matches);
      const changes = matches.length === 1 ? next !== val : next.length > val.length;
      if (!changes) return;
      e.preventDefault();
      input.value = next;
    }
  });

  root.querySelectorAll<HTMLButtonElement>('[data-term-chips] button[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', () => {
      execute(btn.dataset.cmd ?? '');
    });
  });
}
