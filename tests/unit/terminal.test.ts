// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mountTerminal } from '../../src/terminal/terminal';
import { startRain } from '../../src/terminal/rain';
import type { Context } from '../../src/terminal/commands';

// Hidden command names are base64 here so the repo doesn't list them in plain text.
const egg = (b64: string) => atob(b64);
const ctx: Context = {
  profiles: [
    { id: 'linkedin', name: 'LinkedIn', handle: 'gitnickg', url: 'https://www.linkedin.com/in/gitnickg/' },
    { id: 'github', name: 'GitHub', handle: 'gitnickg', url: 'https://github.com/gitnickg' },
  ],
  securityTxt: 'Contact: mailto:hello@icns.ca\nExpires: 2030-01-01\n',
};

let root: HTMLElement;
let output: HTMLElement;
let input: HTMLInputElement;
let form: HTMLFormElement;

function build() {
  document.body.innerHTML = `
    <div id="root">
      <div data-term-output aria-live="polite"><p>static intro</p></div>
      <div data-term-chips>
        <button type="button" data-cmd="status">status</button>
      </div>
      <form data-term-form><input data-term-input type="text" /></form>
    </div>`;
  root = document.getElementById('root')!;
  output = root.querySelector('[data-term-output]')!;
  input = root.querySelector('[data-term-input]')!;
  form = root.querySelector('form[data-term-form]')!;
}
function mount(opts: Parameters<typeof mountTerminal>[2] = {}) {
  mountTerminal(root, ctx, { typingDelayMs: 0, reducedMotion: true, ...opts });
}
function submit(value: string) {
  input.value = value;
  form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
}
function key(k: string) {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
  input.dispatchEvent(e);
  return e;
}

beforeEach(() => {
  localStorage.clear();
  build();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('mountTerminal', () => {
  it('replaces static intro with whoami only', () => {
    mount();
    const t = output.textContent!;
    expect(t).not.toContain('static intro');
    expect(t).toContain('visitor@icns.ca:~$ whoami');
    expect(t).toContain('Independent Consultant @ icns.ca');
    expect(t).not.toContain('visitor@icns.ca:~$ profiles');
    expect(t).not.toContain('visitor@icns.ca:~$ status');
  });

  it('renders hostile input as literal text', () => {
    mount();
    submit('<img src=x onerror=alert(1)>');
    expect(output.querySelector('img')).toBeNull();
    expect(output.textContent).toContain('<img src=x onerror=alert(1)>');
    submit('"><script>alert(1)</script>');
    expect(output.querySelector('script')).toBeNull();
  });

  it('clears the input after submit and echoes a bare prompt for empty input', () => {
    mount();
    submit('whoami');
    expect(input.value).toBe('');
    const before = output.children.length;
    submit('   ');
    expect(output.children.length).toBe(before + 1);
    expect(output.lastElementChild!.textContent!.trim()).toBe('visitor@icns.ca:~$');
  });

  it('history: ArrowUp/ArrowDown, skipping empty entries', () => {
    mount();
    submit('whoami');
    submit('');
    submit('status');
    key('ArrowUp');
    expect(input.value).toBe('status');
    key('ArrowUp');
    expect(input.value).toBe('whoami');
    key('ArrowDown');
    expect(input.value).toBe('status');
    key('ArrowDown');
    expect(input.value).toBe('');
  });

  it('Tab completes unique match and prevents default', () => {
    mount();
    input.value = 'pro';
    const e = key('Tab');
    expect(input.value).toBe('profiles');
    expect(e.defaultPrevented).toBe(true);
  });

  it('Tab with no match leaves input and does not prevent default', () => {
    mount();
    input.value = 'ma';
    const e = key('Tab');
    expect(input.value).toBe('ma');
    expect(e.defaultPrevented).toBe(false);
  });

  it('Tab on empty input is not default-prevented', () => {
    mount();
    input.value = '';
    const e = key('Tab');
    expect(input.value).toBe('');
    expect(e.defaultPrevented).toBe(false);
  });

  it('theme command sets dataset and localStorage; fresh mount reads it back', () => {
    mount();
    submit('theme amber');
    expect(root.dataset.theme).toBe('amber');
    expect(localStorage.getItem('icns-terminal-theme')).toBe('amber');
    build();
    mount();
    expect(root.dataset.theme).toBe('amber');
  });

  it('defaults to blue and ignores invalid stored theme', () => {
    localStorage.setItem('icns-terminal-theme', 'plaid');
    mount();
    expect(root.dataset.theme).toBe('blue');
  });

  it('survives localStorage throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    mount();
    expect(root.dataset.theme).toBe('blue');
    submit('theme green');
    expect(root.dataset.theme).toBe('green');
  });

  it('rainbow colours each character, keeps plain text for screen readers, and stops on another theme', async () => {
    mount();
    submit('theme rainbow');
    await Promise.resolve();
    const painted = output.querySelectorAll('.rb');
    expect(painted.length).toBeGreaterThan(0);
    for (const rb of painted) {
      const [sr, shown] = rb.children;
      expect(sr.className).toBe('visually-hidden');
      expect(shown.getAttribute('aria-hidden')).toBe('true');
      expect(shown.textContent).toBe(sr.textContent);
      for (const ch of shown.children) expect(ch.className).toMatch(/^rb\d+$/);
    }
    expect(output.querySelector('[style]')).toBeNull();
    submit('pwd');
    await Promise.resolve();
    expect(output.lastElementChild!.querySelector('.rb')).not.toBeNull();
    submit('theme blue');
    await Promise.resolve();
    submit('pwd');
    await Promise.resolve();
    expect(output.lastElementChild!.querySelector('.rb')).toBeNull();
    expect(output.lastElementChild!.textContent).toBe('/home/visitor');
  });

  it('clear empties the output', () => {
    mount();
    submit('clear');
    expect(output.children.length).toBe(0);
  });

  it('chip click runs the command with echo and output', () => {
    mount();
    const before = output.textContent!.split('bug bounties: active').length;
    root.querySelector<HTMLButtonElement>('button[data-cmd="status"]')!.click();
    expect(output.textContent!.split('bug bounties: active').length).toBe(before + 1);
    expect(output.lastElementChild!.textContent).toContain('consulting: open');
  });

  it('renders https and mailto as links, other schemes as text', () => {
    mount();
    submit('contact');
    submit('profiles');
    const mail = output.querySelector<HTMLAnchorElement>('a[href="mailto:hello@icns.ca"]');
    expect(mail).not.toBeNull();
    const gh = output.querySelector<HTMLAnchorElement>('a[href="https://github.com/gitnickg"]');
    expect(gh).not.toBeNull();
    expect(gh!.getAttribute('rel')).toBe('noopener noreferrer');

    build();
    mountTerminal(
      root,
      {
        profiles: [
          { id: 'x', name: 'X', handle: 'x', url: 'javascript:alert(1)' },
          { id: 'y', name: 'Y', handle: 'y', url: 'http://example.com/' },
        ],
        securityTxt: '',
      },
      { typingDelayMs: 0, reducedMotion: true },
    );
    submit('profiles');
    expect(output.querySelector('a')).toBeNull();
    expect(output.textContent).toContain('javascript:alert(1)');
  });

  it('types the intro over time and finishes immediately on submit', () => {
    vi.useFakeTimers();
    mount({ typingDelayMs: 10, reducedMotion: false });
    expect(output.textContent).not.toContain('Independent Consultant');
    vi.advanceTimersByTime(30);
    expect(output.textContent).toContain('visitor@icns.ca:~$ ');
    submit('contact');
    const t = output.textContent!;
    expect(t).toContain('Independent Consultant @ icns.ca');
    expect(t.indexOf('Independent Consultant @ icns.ca')).toBeLessThan(t.indexOf('hello@icns.ca'));
    vi.advanceTimersByTime(10000);
    expect(output.textContent).toBe(t);
  });

  it('marks the output busy while the intro types, and clears it after', () => {
    vi.useFakeTimers();
    mount({ typingDelayMs: 10, reducedMotion: false });
    expect(output.getAttribute('aria-busy')).toBe('true');
    vi.advanceTimersByTime(100000);
    expect(output.hasAttribute('aria-busy')).toBe(false);
  });

  it('clears aria-busy when submit skips the intro, and never sets it with no delay', () => {
    vi.useFakeTimers();
    mount({ typingDelayMs: 10, reducedMotion: false });
    submit('help');
    expect(output.hasAttribute('aria-busy')).toBe(false);
    build();
    mount();
    expect(output.hasAttribute('aria-busy')).toBe(false);
  });

  it('history: an unsent draft survives ArrowUp then ArrowDown, and ArrowDown alone keeps input', () => {
    mount();
    submit('whoami');
    input.value = 'half typed';
    key('ArrowDown');
    expect(input.value).toBe('half typed');
    key('ArrowUp');
    expect(input.value).toBe('whoami');
    key('ArrowDown');
    expect(input.value).toBe('half typed');
  });

  it('rain command with reduced motion prints the wake-up line', () => {
    mount();
    submit(egg('bWF0cml4'));
    expect(output.textContent).toContain('wake up, visitor…');
    expect(root.querySelector('canvas')).toBeNull();
  });

  it('restart with reduced motion prints the boot log then whoami, prompt usable', () => {
    mount();
    submit(egg('cmVib290'));
    const t = output.textContent!;
    expect(t).toContain('icns.ca login: visitor');
    expect(t.indexOf('login')).toBeLessThan(t.indexOf('Independent Consultant'));
    expect(input.disabled).toBe(false);
  });

  it('restart animates, locks the prompt, and a key press skips to the end', () => {
    vi.useFakeTimers();
    mount({ reducedMotion: false });
    submit(egg('cmVib290'));
    expect(input.disabled).toBe(true);
    expect(output.textContent).toContain('going down for reboot');
    vi.advanceTimersByTime(800);
    expect(root.classList.contains('term-off')).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
    expect(root.classList.contains('term-off')).toBe(false);
    expect(output.textContent).toContain('Last login');
    expect(output.textContent).toContain('Independent Consultant');
    expect(input.disabled).toBe(false);
  });

  it('wipe with reduced motion refuses and hides nothing', () => {
    mount();
    submit(egg('cm0gLXJmIC8='));
    expect(output.textContent).toContain("refusing to remove '/'");
    expect(document.querySelector('.rm-gone')).toBeNull();
  });

  it('wipe hides parts of the page, then restores everything', () => {
    vi.useFakeTimers();
    document.body.insertAdjacentHTML('beforeend', '<footer class="site-footer">f</footer>');
    mount({ reducedMotion: false });
    submit(egg('cm0gLXJmIC8='));
    vi.advanceTimersByTime(500);
    expect(document.querySelector('.site-footer')!.classList.contains('rm-gone')).toBe(true);
    expect(input.disabled).toBe(true);
    vi.advanceTimersByTime(4000);
    expect(root.classList.contains('rm-gone')).toBe(true);
    vi.advanceTimersByTime(3000);
    expect(document.querySelector('.rm-gone')).toBeNull();
    expect(output.textContent).toContain("removed '/'");
    expect(input.disabled).toBe(false);
  });
});

describe('startRain', () => {
  it('reduced motion prints one line and returns a no-op stop', () => {
    const stop = startRain(output, true);
    expect(output.textContent).toContain('wake up, visitor…');
    expect(() => stop()).not.toThrow();
  });

  it('without a canvas context it stops cleanly and leaves no canvas', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const stop = startRain(root, false);
    expect(root.querySelector('canvas')).toBeNull();
    expect(() => stop()).not.toThrow();
  });

  it('stops on keydown, pointerdown and Escape', () => {
    const fakeCtx = new Proxy({}, { get: () => () => undefined, set: () => true });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx as never);
    for (const ev of [new KeyboardEvent('keydown', { key: 'a' }), new Event('pointerdown'), new KeyboardEvent('keydown', { key: 'Escape' })]) {
      const stop = startRain(root, false);
      expect(root.querySelector('canvas.term-rain')).not.toBeNull();
      window.dispatchEvent(ev);
      expect(root.querySelector('canvas')).toBeNull();
      stop();
    }
  });
});
