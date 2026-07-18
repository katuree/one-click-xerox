import io
import unittest
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient

from oneclickxerox.app import app


class ApiTests(unittest.TestCase):
    def test_health_endpoint(self):
        client = TestClient(app)
        response = client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_clean_endpoint_returns_png(self):
        img = Image.new("RGB", (220, 160), (205, 205, 205))
        draw = ImageDraw.Draw(img)
        draw.text((35, 60), "TEST DOC", fill=(0, 0, 0))
        payload = io.BytesIO()
        img.save(payload, format="JPEG")
        payload.seek(0)
        client = TestClient(app)

        response = client.post(
            "/api/clean?mode=clean_bw&format=png",
            files={"file": ("doc.jpg", payload, "image/jpeg")},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "image/png")
        self.assertGreater(len(response.content), 500)

    def test_clean_endpoint_returns_pdf(self):
        img = Image.new("RGB", (220, 160), "white")
        payload = io.BytesIO()
        img.save(payload, format="JPEG")
        payload.seek(0)
        client = TestClient(app)

        response = client.post(
            "/api/clean?mode=soft_gray&format=pdf",
            files={"file": ("doc.jpg", payload, "image/jpeg")},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF"))


if __name__ == "__main__":
    unittest.main()
