# Guidance for coding agents

Static site for icns consulting inc. (https://icns.ca), Halifax, Nova Scotia. Astro with static output, deployed to GitHub Pages by GitHub Actions; `public/CNAME` sets the custom domain.

## Rules

- Zero runtime UI framework; the terminal is vanilla TypeScript in `src/terminal/`. No third-party scripts or fonts in the source, no CDN. The one exception is Google Analytics 4 (owner's choice, 2026-11-15): `gtag.js` loaded in `Base.astro`, setup in `public/analytics.js`, ID and CSP in `src/lib/analytics.ts`. Don't add other trackers or switch to Google Tag Manager (a GTM container can inject arbitrary scripts).
- Write markup that works under the CSP in `src/lib/analytics.ts` (`script-src 'self'` plus GA4's hosts; `style-src 'self'`): no inline `<script>`, no inline `<style>`, no `style` attributes (including in SVG). Built HTML is tested for this, and an e2e test loads the page under that CSP and fails on any violation. GitHub Pages cannot send headers; the CSP and other security headers are set by a Cloudflare response-header rule, so if you change the CSP in `analytics.ts`, the owner must update that rule to match.
- Cloudflare Email Obfuscation must stay off: it rewrites `visitor@icns.ca` in the prompt and injects a script.
- Fonts: only Schibsted Grotesk 400 and 700 are self-hosted. Don't add weights that nothing uses; hidden text still downloads its font.
- Link previews use `public/images/og.png` (1200×630), referenced absolutely in `src/layouts/Base.astro`.
- The page is dark (`color-scheme: dark`); only the terminal's `default` theme follows the system scheme (Catppuccin Frappé dark, Latte light). Styles live in `src/styles/` with colors as custom properties on `:root`.
- `Base.astro` preloads the 400-weight font; update that link if the font file changes.
- Keep it accessible: one `h1` per page, visible `:focus-visible` outlines, `width`/`height` on every `<img>`, and respect `prefers-reduced-motion`.
- Copy: do not name the owner's employer; no "trusted", "private", "hands-on", "discreet" or similar taglines; no AtlSecCon or community organizing.
- Hidden terminal commands are owner-chosen. Do not add any.
- Profiles (LinkedIn, GitHub) live in `src/data/profiles.json`.
- `sitemap.xml` is generated at build; every new public page must appear in it with absolute URLs (https://icns.ca/...).
- Optimize new images (WebP or compressed PNG/JPEG, well under 200 KB).
- Logo: the "scope" mark (four corner brackets around a dot). Brackets use the brand blue (#1c3ed3, #8da2ff on dark), the dot uses ink (#0e1838, #e8ebf6 on dark). Source files are in `public/images/logo/`; lockup text is outlined Schibsted Grotesk Bold.
- Keep `public/bitcoin.pdf`; it is intentionally served at /bitcoin.pdf.
- Renew the `Expires` date in `public/.well-known/security.txt` before 2027-10-27.
- The Pages artifact must include hidden files (/.well-known/security.txt); keep `include-hidden-files: true` in the deploy workflow.
- Contact channels are email (hello@icns.ca), LinkedIn and GitHub. There is no X/Twitter account.

## Preview

```bash
npm run dev
```

Before finishing: `npm run build && npm test && npm run test:e2e && npm run check`.
