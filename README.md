# One Click Xerox

Public website:
http://one-click.katuree.com/

GitHub repository:
https://github.com/katuree/one-click-xerox

One Click Xerox is a browser-based prototype for Xerox shop owners. It converts dark or messy WhatsApp camera photos of certificates, IDs, marksheets, receipts, and other documents into cleaner print-ready PNG, JPG, or PDF files.

## Public hosting

This project uses a single public GitHub repository. GitHub Pages serves the public website from the `docs/` folder on the `main` branch.

The website custom domain is:

http://one-click.katuree.com/

DNS for `one-click.katuree.com` must point to `katuree.github.io` for the domain to load.

## Search indexing

The site is intentionally not submitted to Google Search yet.

The deployed site includes:

- `robots.txt` with `Disallow: /`
- `<meta name="robots" content="noindex, nofollow, noarchive">`

## Run locally

Use Python 3.11 on Ganesh's Windows machine because the current global Python/Pillow path is mismatched for some other Python versions.

```bash
cd "G:/Obsidian_Vaults/Mugen/Projects/One Click Xerox"
py -3.11 -m uvicorn oneclickxerox.app:app --reload --host 127.0.0.1 --port 8088
```

Open:
http://127.0.0.1:8088

## Test

```bash
npm run test
```

This runs FastAPI endpoint tests, image processor tests, static UI checks, and JavaScript syntax checks.

## Current MVP features

- Upload one image.
- Cleanup modes:
  - Clean B/W
  - Soft Gray
  - Color Xerox
  - Photo Xerox
  - Color Certificate
- Download as PNG, JPG, or PDF.
- Browser-only public version for GitHub Pages.
- Custom print preview for copies, paper size, multi-up layouts, margins, scale, position, and color/BW options.

## Safety

This app only performs document cleanup and print-readiness enhancement. It must not modify names, marks, certificate content, or create fake documents.
