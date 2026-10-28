# icns.ca

Source for https://icns.ca, served by GitHub Pages from the root of the `main` branch.

Plain HTML and CSS, no build step and no framework. Edit the files directly and push.

## Files

- `index.html`: the whole site (services, experience, process, contact)
- `404.html`: shown by GitHub Pages for any missing URL
- `contact/index.html`: redirect from the old contact page to `/#contact`
- `css/site.css`: all styles, including dark mode
- `js/theme.js`: light/dark toggle (choice saved in the visitor's browser)
- `fonts/`: self-hosted Schibsted Grotesk (SIL Open Font License, see `fonts/OFL.txt`)
- `images/og.png`: 1200×630 link preview image
- `images/logo/`: logo files (scope mark)
  - `icns-mark.svg`, `icns-mark-dark.svg`: the mark alone, for light and dark backgrounds
  - `icns-lockup*.svg` / `.png`: mark with "icns"; `-legal` adds "consulting inc."; `-dark` for dark backgrounds
  - `icns-icon.svg`: app icon tile (same as `favicon.svg`)
  - `icns-avatar-1024.png`: square profile picture that crops cleanly to a circle
  - `icns-mark-1024.png`: transparent mark for documents and slides
- `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `images/icon-512.png`: icons
- `bitcoin.pdf`: the Bitcoin whitepaper, served at https://icns.ca/bitcoin.pdf (keep this file)
- `.well-known/security.txt`: how to report a vulnerability (RFC 9116). Renew the `Expires` date before 2027-10-27
- `.nojekyll`: tells GitHub Pages to serve files as-is, so `.well-known/` is published
- `CNAME`, `robots.txt`, `sitemap.xml`, `manifest.json`

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
