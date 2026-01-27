# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static website for icns Consulting (https://icns.ca), a cybersecurity and GRC consulting firm. Built with Hugo, hosted on GitHub Pages.

## Development Workflow

This repository contains **pre-built static output only**. The Hugo source files are not in this repo.

- No build commands, package.json, or build automation exists here
- Edit HTML/CSS/JS files directly for changes
- CSS is minified Bootstrap-based (`css/style.min.*.css`)
- JavaScript is minimal - only mobile menu toggle (`js/scripts.min.*.js`)

## Serving Locally

```bash
# Use any static file server, e.g.:
python3 -m http.server 8000
# Then open http://localhost:8000
```

## Architecture

```
├── index.html           # Homepage with fullscreen hero image
├── contact/             # Contact page
├── pages/, history/, 404/, tags/  # Additional pages
├── css/                 # Minified Bootstrap-based styles
├── js/                  # Minimal scripts (menu toggle only)
├── images/              # Logos, backgrounds, service icons
├── social/              # Social media SVG icons
├── features/            # Feature SVG icons
├── robots.txt           # Search engine rules
├── sitemap.xml          # Site structure for SEO
└── CNAME                # GitHub Pages custom domain (icns.ca)
```

## Key Design Patterns

- **Fixed footer**: Overlays hero image at bottom of viewport
- **Fullscreen hero**: Background image fills viewport height
- **Responsive**: Bootstrap grid, mobile hamburger menu
- External links use `rel="noopener noreferrer"` for security

## Image Assets

Images are stored in `images/`. Critical assets have been optimized:
- `images/icns-logo.png` (~420KB)
- `images/icns-logo-circle.png` (~383KB)
- `images/space-icns.jpg` (~369KB)

**Maintenance Requirements:**
- **Images:** New images must be optimized (target <500KB). Use Python/Pillow scripts.
- **Sitemap:** `sitemap.xml` must use **absolute URLs** (https://icns.ca/...).
- **HTML:** Image tags must include `width` and `height` attributes to prevent CLS.


---

# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Project Overview

Static website for icns Consulting (https://icns.ca), a cybersecurity and GRC consulting firm. Built with Hugo, hosted on GitHub Pages.

## Development Workflow

This repository contains **pre-built static output only**. The Hugo source files are not in this repo.

- No build commands, package.json, or build automation exists here
- Edit HTML/CSS/JS files directly for changes
- CSS is minified Bootstrap-based (`css/style.min.*.css`)
- JavaScript is minimal - only mobile menu toggle (`js/scripts.min.*.js`)

## Serving Locally

```bash
# Use any static file server, e.g.:
python3 -m http.server 8000
# Then open http://localhost:8000
```

## Architecture

```
├── index.html           # Homepage with fullscreen hero image
├── contact/             # Contact page
├── pages/, history/, 404/, tags/  # Additional pages
├── css/                 # Minified Bootstrap-based styles
├── js/                  # Minimal scripts (menu toggle only)
├── images/              # Logos, backgrounds, service icons
├── social/              # Social media SVG icons
├── features/            # Feature SVG icons
├── robots.txt           # Search engine rules
├── sitemap.xml          # Site structure for SEO
└── CNAME                # GitHub Pages custom domain (icns.ca)
```

## Key Design Patterns

- **Fixed footer**: Overlays hero image at bottom of viewport
- **Fullscreen hero**: Background image fills viewport height
- **Responsive**: Bootstrap grid, mobile hamburger menu
- External links use `rel="noopener noreferrer"` for security

## Image Assets

Images are stored in `images/`. Critical assets have been optimized:
- `images/icns-logo.png` (~420KB)
- `images/icns-logo-circle.png` (~383KB)
- `images/space-icns.jpg` (~369KB)

**Maintenance Requirements:**
- **Images:** New images must be optimized (target <500KB). Use Python/Pillow scripts.
- **Sitemap:** `sitemap.xml` must use **absolute URLs** (https://icns.ca/...).
- **HTML:** Image tags must include `width` and `height` attributes to prevent CLS.

