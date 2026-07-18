import io
import unittest

import numpy as np
from PIL import Image, ImageDraw

from oneclickxerox.image_processor import CleanMode, clean_document_image, export_pdf


def make_shadowed_document():
    img = Image.new("RGB", (420, 300), "white")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            shade = int(245 - (x / img.width) * 75 - (y / img.height) * 35)
            px[x, y] = (shade, shade, shade)
    draw = ImageDraw.Draw(img)
    draw.rectangle((36, 32, 384, 264), outline=(60, 60, 60), width=3)
    draw.text((80, 90), "CERTIFICATE", fill=(12, 12, 12))
    draw.text((80, 132), "Ganesh Katuri", fill=(18, 18, 18))
    draw.line((80, 205, 250, 205), fill=(20, 20, 20), width=3)
    return img


class ImageProcessorTests(unittest.TestCase):
    def test_clean_bw_removes_shadow_and_preserves_text_contrast(self):
        source = make_shadowed_document()

        cleaned = clean_document_image(source, mode=CleanMode.CLEAN_BW)

        self.assertEqual(cleaned.mode, "L")
        background = np.asarray(cleaned.crop((300, 40, 380, 95)))
        text_area = np.asarray(cleaned.crop((75, 85, 205, 115)))
        self.assertGreater(float(background.mean()), 235)
        self.assertLess(int(text_area.min()), 80)

    def test_soft_gray_keeps_grayscale_for_stamps_or_signatures(self):
        source = make_shadowed_document()

        cleaned = clean_document_image(source, mode=CleanMode.SOFT_GRAY)

        self.assertEqual(cleaned.mode, "L")
        values = np.asarray(cleaned)
        self.assertGreater(int(values.max()), 240)
        self.assertLess(int(values.min()), 90)
        self.assertGreater(len(np.unique(values)), 16)

    def test_color_xerox_keeps_rgb_and_brightens_color_documents(self):
        source = make_shadowed_document()
        draw = ImageDraw.Draw(source)
        draw.rectangle((72, 224, 190, 260), fill=(80, 40, 190))

        cleaned = clean_document_image(source, mode=CleanMode.COLOR_XEROX)

        self.assertEqual(cleaned.mode, "RGB")
        values = np.asarray(cleaned)
        self.assertGreater(float(values[..., 2].mean()), float(values[..., 0].mean()))
        self.assertGreater(int(values.max()), 240)

    def test_photo_xerox_keeps_natural_rgb_without_thresholding(self):
        source = make_shadowed_document()
        draw = ImageDraw.Draw(source)
        draw.ellipse((70, 210, 150, 280), fill=(35, 140, 75))

        cleaned = clean_document_image(source, mode=CleanMode.PHOTO_XEROX)

        self.assertEqual(cleaned.mode, "RGB")
        values = np.asarray(cleaned)
        self.assertGreater(len(np.unique(values.reshape(-1, 3), axis=0)), 32)

    def test_export_pdf_returns_printable_pdf_bytes(self):
        source = clean_document_image(make_shadowed_document(), mode=CleanMode.CLEAN_BW)

        pdf = export_pdf([source])

        self.assertTrue(pdf.startswith(b"%PDF"))
        self.assertGreater(len(pdf), 1000)


if __name__ == "__main__":
    unittest.main()
