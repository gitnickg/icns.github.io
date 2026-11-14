# icns.ca

Source for https://icns.ca: a static Astro site with an interactive terminal on the home page. Dark-only, no third-party requests, no runtime UI framework.

## Files

- `src/pages/`: routes (home, 404, `/contact/` redirect)
- `src/components/`, `src/layouts/`: Astro components and page layout
- `src/terminal/`: the terminal, in vanilla TypeScript
- `src/lib/`: helpers (e.g. build-time profile loading)
- `src/data/`: content data (`profiles.json`)
- `src/styles/`: all CSS
- `public/`: files served as-is: `CNAME`, `bitcoin.pdf`, `.well-known/security.txt`, `robots.txt`, `manifest.json`, icons, fonts, `images/` (logo files in `images/logo/`)
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

GitHub Actions (`.github/workflows/deploy.yml`) builds, tests and publishes to GitHub Pages on every push to `main` and daily.

## License

See `LICENSE`.
