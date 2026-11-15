/** Screen effects for hidden terminal commands. Each returns a stop function that finishes the effect at once. */

export type EffectHost = {
  root: HTMLElement;
  output: HTMLElement;
  print: (text: string) => void;
  done: () => void;
  reducedMotion: boolean;
};

/** Runs `steps` one per tick; any key or pointer press skips to the end. */
function sequence(steps: Array<[number, () => void]>, finish: () => void): () => void {
  const timers: number[] = [];
  let i = 0;
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    timers.forEach((t) => window.clearTimeout(t));
    window.removeEventListener('keydown', stop, true);
    window.removeEventListener('pointerdown', stop, true);
    for (; i < steps.length; i++) steps[i][1]();
    finish();
  };
  let at = 0;
  steps.forEach(([wait], idx) => {
    at += wait;
    timers.push(
      window.setTimeout(() => {
        if (stopped) return;
        steps[idx][1]();
        i = idx + 1;
        if (i === steps.length) stop();
      }, at),
    );
  });
  window.addEventListener('keydown', stop, true);
  window.addEventListener('pointerdown', stop, true);
  return stop;
}

/** `Sat Nov 14 20:21:03 2026`, the format `last` and login(1) print. */
function loginDate(d: Date): string {
  const day = d.toLocaleDateString('en-US', { weekday: 'short' });
  const mon = d.toLocaleDateString('en-US', { month: 'short' });
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${day} ${mon} ${String(d.getDate()).padStart(2, ' ')} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${d.getFullYear()}`;
}

function bootLog(now: Date): string[] {
  return [
    '[    0.000000] Linux version 6.12.48-amd64 (gcc 14.2.0) #1 SMP PREEMPT_DYNAMIC',
    '[    0.004213] Memory: 16323584K/16777216K available',
    '[    1.218734] EXT4-fs (nvme0n1p2): mounted filesystem with ordered data mode',
    '[  OK  ] Started systemd-journald.service - Journal Service.',
    '[  OK  ] Reached target local-fs.target - Local File Systems.',
    '[  OK  ] Started nftables.service - nftables.',
    '[  OK  ] Started ssh.service - OpenBSD Secure Shell server.',
    '[  OK  ] Reached target multi-user.target - Multi-User System.',
    '',
    'Debian GNU/Linux 13 icns tty1',
    '',
    'icns login: visitor',
    `Last login: ${loginDate(now)} on tty1`,
    '',
  ];
}

export function startReboot(host: EffectHost): () => void {
  const { root, output, print, done, reducedMotion } = host;
  if (reducedMotion) {
    output.replaceChildren();
    bootLog(new Date()).forEach(print);
    done();
    return () => {};
  }
  print('The system is going down for reboot NOW!');
  const steps: Array<[number, () => void]> = [
    [700, () => root.classList.add('term-off')],
    [
      900,
      () => {
        output.replaceChildren();
        root.classList.remove('term-off');
      },
    ],
    ...bootLog(new Date()).map((line, n): [number, () => void] => [n === 0 ? 400 : 160 + Math.round(Math.random() * 180), () => print(line)]),
  ];
  return sequence(steps, () => {
    root.classList.remove('term-off');
    done();
  });
}

export function startRm(host: EffectHost): () => void {
  const { root, output, print, done, reducedMotion } = host;
  if (reducedMotion) {
    print("rm: refusing to remove '/'");
    done();
    return () => {};
  }
  const gone: Element[] = [];
  const hide = (els: Array<Element | null>) => {
    for (const el of els) {
      if (!el) continue;
      el.classList.add('rm-gone');
      gone.push(el);
    }
  };
  const history = [...output.children];
  const steps: Array<[number, () => void]> = [
    [300, () => print("removed '/srv/www/footer'")],
    [150, () => hide([document.querySelector('.site-footer')])],
    [550, () => print("removed '/usr/bin/shortcuts'")],
    [150, () => hide([root.querySelector('[data-term-chips]')])],
    [550, () => print("removed '/etc/titlebar'")],
    [150, () => hide([root.querySelector('.term-chrome')])],
    [550, () => print("removed '/home/visitor/.history'")],
    [150, () => hide(history)],
    [550, () => print("removed '/'")],
    [250, () => hide([root])],
    [1800, () => {}],
  ];
  return sequence(steps, () => {
    gone.forEach((el) => el.classList.remove('rm-gone'));
    done();
  });
}
