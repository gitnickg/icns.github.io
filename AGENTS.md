# Guidance for coding agents

Static site for icns (https://icns.ca), an independent security consultancy in Halifax, Nova Scotia. Hosted on GitHub Pages; `CNAME` sets the custom domain.

## Rules

- Hand-written HTML and CSS only. No framework, build step, or third-party scripts or fonts loaded from other domains.
- All styling lives in `css/site.css`, with colors as custom properties on `:root` and a `prefers-color-scheme: dark` override. Do not add inline styles.
- Keep it accessible: one `h1` per page, visible `:focus-visible` outlines, `width`/`height` on every `<img>`, and respect `prefers-reduced-motion`.
- `sitemap.xml` uses absolute URLs (https://icns.ca/...). Add an entry for every new public page and update `lastmod`.
- Optimize new images (WebP or compressed PNG/JPEG, well under 200 KB).
- Contact channels are email (hello@icns.ca), LinkedIn and GitHub. There is no X/Twitter account.

## Preview

```bash
python3 -m http.server 8000
```
