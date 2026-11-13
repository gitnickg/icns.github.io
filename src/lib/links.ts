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
