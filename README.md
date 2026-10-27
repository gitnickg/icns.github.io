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
- `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `images/icon-512.png`: icons
- `CNAME`, `robots.txt`, `sitemap.xml`, `manifest.json`

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
