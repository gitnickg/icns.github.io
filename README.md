# icns.ca

Source for https://icns.ca: a static Astro site with an interactive terminal on the home page. No runtime UI framework. The page is dark; the terminal's default theme follows the system scheme.

The only third-party traffic is analytics: Google Analytics 4 (`gtag.js`, set up in `public/analytics.js`) and Cloudflare Web Analytics (injected by Cloudflare at the edge, not in the HTML). Both are described at `/privacy/`.

## Files

- `src/pages/`: routes (home, `/privacy/`, 404, `/contact/` redirect, generated `sitemap.xml`)
- `src/components/`, `src/layouts/`: Astro components and page layout
- `src/terminal/`: the terminal, in vanilla TypeScript
- `src/lib/`: helpers (build-time profile loading, link checks); `analytics.ts` holds the GA4 ID and the production CSP
- `src/data/`: content data (`profiles.json`, and `privacy.ts`, the one source for the privacy page and the `privacy` command)
- `src/styles/`: all CSS
- `public/`: files served as-is: `CNAME`, `analytics.js`, `bitcoin.pdf`, `.well-known/security.txt`, `robots.txt`, `manifest.json`, icons, fonts, `images/` (logo files in `images/logo/`)
- `tests/unit/`, `tests/build/`, `tests/e2e/`: vitest unit tests, vitest tests on the built `dist/`, Playwright tests

## Commands

```bash
npm run dev       # local dev server
npm run build     # static build into dist/
npm test          # unit + build tests (run build first)
npm run test:e2e  # Playwright (needs a build)
npm run check     # astro check
```

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`) builds, tests and publishes to GitHub Pages on every push to `main` and daily. `main` only changes through a pull request whose `build` check passes.

## Security headers

GitHub Pages can't send headers, so Cloudflare adds them with a response-header rule: the CSP from `src/lib/analytics.ts`, plus `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` and HSTS. An e2e test loads the page under that CSP (with the Cloudflare beacon injected) and fails on any violation. If you change the CSP in `analytics.ts`, the Cloudflare rule must be updated to match.

If your network blocks analytics hosts (e.g. a DNS ad blocker), the two analytics e2e tests time out locally; CI runs them normally.

## License

See `LICENSE`.
