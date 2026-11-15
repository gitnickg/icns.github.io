const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789';
const WAKE_UP = 'wake up, visitor…';

/** Falling-glyph overlay. Returns a stop function. */
export function startRain(container: HTMLElement, reducedMotion: boolean): () => void {
  if (reducedMotion) {
    const line = document.createElement('div');
    line.className = 'term-line';
    line.textContent = WAKE_UP;
    container.appendChild(line);
    return () => {};
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'term-rain';
  canvas.setAttribute('aria-hidden', 'true');
  const g = canvas.getContext('2d');
  if (!g) return () => {};

  const width = container.clientWidth || window.innerWidth || 800;
  const height = container.clientHeight || window.innerHeight || 600;
  // Back the canvas at device resolution so glyphs stay sharp on high-DPI screens; draw in CSS pixels.
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  g.scale(dpr, dpr);
  container.appendChild(canvas);

  const size = 16;
  const drops: number[] = Array.from({ length: Math.ceil(width / size) }, () => Math.random() * -50);
  const draw = () => {
    g.fillStyle = 'rgba(0, 0, 0, 0.08)';
    g.fillRect(0, 0, width, height);
    g.fillStyle = '#33ff66';
    g.font = `${size}px monospace`;
    drops.forEach((y, i) => {
      g.fillText(GLYPHS[Math.floor(Math.random() * GLYPHS.length)], i * size, y * size);
      drops[i] = y * size > height && Math.random() > 0.975 ? 0 : y + 1;
    });
  };
  const timer = window.setInterval(draw, 50);

  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    window.clearInterval(timer);
    window.removeEventListener('keydown', stop, true);
    window.removeEventListener('pointerdown', stop, true);
    canvas.remove();
  };
  window.addEventListener('keydown', stop, true);
  window.addEventListener('pointerdown', stop, true);
  return stop;
}
