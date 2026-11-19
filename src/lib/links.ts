/** Only https: and mailto: URLs may become links. */
export function isSafeHref(href: string | undefined | null): href is string {
  if (!href) return false;
  try {
    const p = new URL(href).protocol;
    return p === 'https:' || p === 'mailto:';
  } catch {
    return false;
  }
}

/** https links that leave icns.ca. These open in a new tab. */
export function isExternalHref(href: string | undefined | null): href is string {
  if (!isSafeHref(href)) return false;
  const u = new URL(href);
  if (u.protocol !== 'https:') return false;
  const host = u.hostname.toLowerCase();
  return host !== 'icns.ca' && !host.endsWith('.icns.ca');
}

/** Links that open in a new tab: other sites, and PDFs (including icns.ca/bitcoin.pdf). */
export function opensInNewTab(href: string | undefined | null): href is string {
  if (!isSafeHref(href)) return false;
  if (isExternalHref(href)) return true;
  const u = new URL(href);
  return u.protocol === 'https:' && u.pathname.toLowerCase().endsWith('.pdf');
}

/** Appended to the accessible name of links that open in a new tab. */
export const NEW_TAB = ' (opens in a new tab)';
