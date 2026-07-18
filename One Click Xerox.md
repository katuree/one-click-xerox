---
tags:
  - project
  - app
  - xerox
  - document-processing
status: prototype
---
# One Click Xerox

Project hub for [[Ideas/One Click Xerox|One Click Xerox]].

## Goal

Build a simple web app for Xerox shop owners: upload bad WhatsApp camera document images, clean them automatically, and download print-ready output.

## Current prototype

- Backend: FastAPI
- Image processing: Pillow + NumPy
- Frontend: static HTML/CSS/JS
- Tests: Python unittest

## Run

```bash
cd "G:/Obsidian_Vaults/Mugen/Projects/One Click Xerox"
py -3.11 -m uvicorn oneclickxerox.app:app --reload --host 127.0.0.1 --port 8088
```

Open: http://127.0.0.1:8088

## Test

```bash
py -3.11 -m unittest discover -s tests -v
```

## Next features

- Manual crop and perspective correction.
- Batch upload to one PDF.
- Better certificate color preservation.
- Print size presets: A4, ID card, original size.
- Offline Windows desktop version for shops.
