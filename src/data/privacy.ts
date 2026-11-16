/**
 * Privacy note: one source for the `privacy` terminal command and the /privacy/ page.
 * Keep it true to what the site loads (see src/lib/analytics.ts). Avoid the word "private" (banned copy).
 */
export type PrivacySegment = { text: string; href?: string };
export type PrivacyLine = PrivacySegment[];

export const PRIVACY_UPDATED = '2026-11-15';

export const PRIVACY: PrivacyLine[] = [
  [
    {
      text: 'This site counts visits with Google Analytics 4: pages viewed, the referring site, browser and device type, and approximate location (city level).',
    },
  ],
  [{ text: 'Google sets first-party cookies (_ga) to tell new visits from repeat ones. GA4 does not log or store IP addresses.' }],
  [{ text: 'The data is used only to see how the site is used. No ads, and the data is not sold.' }],
  [{ text: 'The site is delivered by Cloudflare and GitHub Pages, which process standard request data, such as IP address, to serve and protect it.' }],
  [{ text: 'The terminal runs in your browser. The only thing it stores is your theme choice (localStorage).' }],
  [
    { text: "Opt out: block cookies for icns.ca, use a content blocker, or install Google's opt-out add-on: " },
    { text: 'tools.google.com/dlpage/gaoptout', href: 'https://tools.google.com/dlpage/gaoptout' },
  ],
  [{ text: 'Questions or requests: ' }, { text: 'hello@icns.ca', href: 'mailto:hello@icns.ca' }],
];
