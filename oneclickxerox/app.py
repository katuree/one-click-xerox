from __future__ import annotations

from io import BytesIO
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError

from .image_processor import CleanMode, clean_document_image, export_pdf, image_to_jpeg_bytes, image_to_png_bytes

APP_DIR = Path(__file__).resolve().parent
STATIC_DIR = APP_DIR / "static"

app = FastAPI(title="One Click Xerox", version="0.1.0")

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "app": "One Click Xerox"}


@app.get("/", response_class=HTMLResponse)
def index() -> str:
    index_path = STATIC_DIR / "index.html"
    return index_path.read_text(encoding="utf-8")


@app.post("/api/clean")
async def clean_image(
    file: UploadFile = File(...),
    mode: CleanMode = Query(CleanMode.CLEAN_BW),
    format: str = Query("png", pattern="^(png|jpg|pdf)$"),
) -> Response:
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Upload an image file first.")

    try:
        source = Image.open(BytesIO(raw))
        source.load()
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="The uploaded file is not a readable image.") from exc

    cleaned = clean_document_image(source, mode=mode)

    if format == "pdf":
        return Response(
            export_pdf([cleaned]),
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="one-click-xerox-clean.pdf"'},
        )
    if format == "jpg":
        return Response(
            image_to_jpeg_bytes(cleaned),
            media_type="image/jpeg",
            headers={"Content-Disposition": 'attachment; filename="one-click-xerox-clean.jpg"'},
        )
    return Response(
        image_to_png_bytes(cleaned),
        media_type="image/png",
        headers={"Content-Disposition": 'attachment; filename="one-click-xerox-clean.png"'},
    )
