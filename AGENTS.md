# Guidance for coding agents

Static site for icns consulting inc. (https://icns.ca), Halifax, Nova Scotia. Astro with static output, deployed to GitHub Pages by GitHub Actions; `public/CNAME` sets the custom domain.

## Rules

- Zero runtime UI framework; the terminal is vanilla TypeScript in `src/terminal/`. No third-party scripts or fonts, no CDN, no trackers or analytics.
- CSP is `script-src 'self'; style-src 'self'`: no inline `<script>`, no inline `<style>`, no `style` attributes (including in SVG). Built HTML is tested for this.
- The site is dark-only. Styles live in `src/styles/` with colors as custom properties on `:root`.
- Keep it accessible: one `h1` per page, visible `:focus-visible` outlines, `width`/`height` on every `<img>`, and respect `prefers-reduced-motion`.
- Copy: do not name the owner's employer; no "trusted", "private", "hands-on", "discreet" or similar taglines; no AtlSecCon or community organizing.
- Hidden terminal commands are owner-chosen. Do not add any.
- Profiles (LinkedIn, GitHub) live in `src/data/profiles.json`. GitHub stats are fetched at build time and the build must still succeed if the API is down.
- `sitemap.xml` is generated at build; every new public page must appear in it with absolute URLs (https://icns.ca/...).
- Optimize new images (WebP or compressed PNG/JPEG, well under 200 KB).
- Logo: the "scope" mark (four corner brackets around a dot). Brackets use the brand blue (#1c3ed3, #8da2ff on dark), the dot uses ink (#0e1838, #e8ebf6 on dark). Source files are in `public/images/logo/`; lockup text is outlined Schibsted Grotesk Bold.
- Keep `public/bitcoin.pdf`; it is intentionally served at /bitcoin.pdf.
- Renew the `Expires` date in `public/.well-known/security.txt` before 2027-10-27.
- Contact channels are email (hello@icns.ca), LinkedIn and GitHub. There is no X/Twitter account.

## Preview

```bash
npm run dev
```

Before finishing: `npm run build && npm test && npm run test:e2e && npm run check`.
