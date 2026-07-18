from __future__ import annotations

from enum import StrEnum
from io import BytesIO
from typing import Iterable

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps


class CleanMode(StrEnum):
    CLEAN_BW = "clean_bw"
    SOFT_GRAY = "soft_gray"
    COLOR_XEROX = "color_xerox"
    PHOTO_XEROX = "photo_xerox"
    COLOR_CERTIFICATE = "color_certificate"


def _as_rgb(image: Image.Image) -> Image.Image:
    if image.mode in {"RGBA", "LA"}:
        background = Image.new("RGB", image.size, "white")
        background.paste(image, mask=image.getchannel("A"))
        return background
    return image.convert("RGB")


def _normalize_illumination(gray: Image.Image) -> Image.Image:
    """Remove phone-camera shadows using a blurred background estimate."""
    # Large blur approximates uneven room lighting without following text strokes.
    radius = max(15, min(gray.size) // 18)
    background = gray.filter(ImageFilter.GaussianBlur(radius=radius))
    src = np.asarray(gray, dtype=np.float32)
    bg = np.asarray(background, dtype=np.float32)
    normalized = src / np.maximum(bg, 1.0) * 245.0
    normalized = np.clip(normalized, 0, 255).astype(np.uint8)
    return Image.fromarray(normalized, mode="L")


def _adaptive_threshold(gray: Image.Image) -> Image.Image:
    arr = np.asarray(gray, dtype=np.float32)
    # Local threshold: compare to a soft local average so text survives gradients.
    local = np.asarray(gray.filter(ImageFilter.GaussianBlur(radius=9)), dtype=np.float32)
    threshold = np.minimum(232, local - 11)
    bw = np.where(arr < threshold, 0, 255).astype(np.uint8)
    # Light median filter removes isolated compression dots from WhatsApp photos.
    return Image.fromarray(bw, mode="L").filter(ImageFilter.MedianFilter(size=3))


def _clean_color_channels(rgb: Image.Image) -> Image.Image:
    clean_channels = []
    for channel in rgb.split():
        clean_channels.append(ImageOps.autocontrast(_normalize_illumination(channel), cutoff=1))
    return Image.merge("RGB", clean_channels)


def clean_document_image(image: Image.Image, mode: CleanMode | str = CleanMode.CLEAN_BW) -> Image.Image:
    """Return a Xerox-ready cleaned image without changing document content.

    The function only performs scan-style cleanup: grayscale conversion, shadow
    normalization, contrast enhancement, and optional thresholding.
    """
    selected = CleanMode(mode)
    rgb = _as_rgb(image)

    if selected is CleanMode.COLOR_CERTIFICATE:
        return _clean_color_channels(rgb)

    if selected is CleanMode.COLOR_XEROX:
        cleaned = _clean_color_channels(rgb)
        cleaned = ImageEnhance.Color(cleaned).enhance(1.22)
        cleaned = ImageEnhance.Contrast(cleaned).enhance(1.12)
        return ImageEnhance.Sharpness(cleaned).enhance(1.08)

    if selected is CleanMode.PHOTO_XEROX:
        normalized = _clean_color_channels(rgb)
        blended = Image.blend(rgb, normalized, 0.55)
        blended = ImageEnhance.Color(blended).enhance(1.08)
        return ImageEnhance.Contrast(blended).enhance(1.04)

    gray = ImageOps.grayscale(rgb)
    normalized = _normalize_illumination(gray)
    contrasted = ImageOps.autocontrast(normalized, cutoff=1)

    if selected is CleanMode.SOFT_GRAY:
        return contrasted.filter(ImageFilter.SHARPEN)

    return _adaptive_threshold(contrasted)


def image_to_png_bytes(image: Image.Image) -> bytes:
    output = BytesIO()
    image.save(output, format="PNG", optimize=True)
    return output.getvalue()


def image_to_jpeg_bytes(image: Image.Image) -> bytes:
    output = BytesIO()
    image.convert("RGB").save(output, format="JPEG", quality=94, optimize=True)
    return output.getvalue()


def export_pdf(images: Iterable[Image.Image]) -> bytes:
    pages = [img.convert("RGB") for img in images]
    if not pages:
        raise ValueError("At least one image is required to export PDF")
    output = BytesIO()
    first, rest = pages[0], pages[1:]
    first.save(output, format="PDF", save_all=True, append_images=rest, resolution=300.0)
    return output.getvalue()
