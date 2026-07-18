# One Click Xerox

A prototype web app for Xerox shop owners. It converts bad WhatsApp camera photos of certificates, IDs, marksheets, and documents into cleaner print-ready PNG/JPG/PDF files.

## Run locally

Use Python 3.11 on Ganesh's Windows machine because the current global Python/Pillow path is mismatched for some other Python versions.

```bash
cd "G:/Obsidian_Vaults/Mugen/Projects/One Click Xerox"
py -3.11 -m uvicorn oneclickxerox.app:app --reload --host 127.0.0.1 --port 8088
```

Open: http://127.0.0.1:8088

## Test

```bash
py -3.11 -m unittest discover -s tests -v
```

## Current MVP features

- Upload one image.
- Cleanup modes:
  - Clean B/W
  - Soft Gray
  - Color Certificate
- Download as PNG, JPG, or PDF.
- Browser UI for Xerox shop owners.

## Safety

This app only performs document cleanup and print-readiness enhancement. It must not modify names, marks, certificate content, or create fake documents.
