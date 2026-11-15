/**
 * Rainbow theme: every character gets a random colour class (no inline styles, so the CSP holds).
 * Screen readers get the plain text from a visually hidden copy; the coloured copy is aria-hidden.
 */

export const RAINBOW_COLOURS = 12;

function paint(text: Text): void {
  const value = text.data;
  if (!value.trim()) return;
  const wrap = document.createElement('span');
  wrap.className = 'rb';
  const sr = document.createElement('span');
  sr.className = 'visually-hidden';
  sr.textContent = value;
  const shown = document.createElement('span');
  shown.setAttribute('aria-hidden', 'true');
  for (const ch of value) {
    if (/\s/.test(ch)) {
      shown.appendChild(document.createTextNode(ch));
      continue;
    }
    const s = document.createElement('span');
    s.className = `rb${Math.floor(Math.random() * RAINBOW_COLOURS)}`;
    s.textContent = ch;
    shown.appendChild(s);
  }
  wrap.append(sr, shown);
  text.replaceWith(wrap);
}

/** Paints every unpainted text node under `el`. */
export function paintAll(el: Node): void {
  if (el.nodeType === Node.TEXT_NODE) {
    if (!el.parentElement?.closest('.rb')) paint(el as Text);
    return;
  }
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest('.rb') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach(paint);
}

/** Paints the output now and anything added later. Returns a stop function. */
export function startRainbow(output: HTMLElement): () => void {
  paintAll(output);
  const obs = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'characterData') paintAll(r.target.parentNode ?? r.target);
      r.addedNodes.forEach((n) => paintAll(n));
    }
  });
  obs.observe(output, { childList: true, subtree: true, characterData: true });
  return () => obs.disconnect();
}
