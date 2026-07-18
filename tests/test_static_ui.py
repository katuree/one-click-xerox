from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
STATIC = ROOT / "oneclickxerox" / "static"


class StaticUiTests(unittest.TestCase):
    def test_cleaned_output_has_direct_print_button(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")

        self.assertIn('id="printBtn"', html)
        self.assertIn('Print cleaned file', html)

    def test_main_cleanup_mode_has_color_xerox_options(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")

        self.assertIn('value="color_xerox"', html)
        self.assertIn('Color Xerox - bright color copy', html)
        self.assertIn('value="photo_xerox"', html)
        self.assertIn('Photo Xerox - keep natural colors', html)

    def test_print_button_prints_current_page_output_instead_of_empty_popup(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        css = (STATIC / "styles.css").read_text(encoding="utf-8")
        script = (STATIC / "app.js").read_text(encoding="utf-8")

        self.assertIn('id="printArea"', html)
        self.assertIn("const printImage = document.querySelector('#printImage');", script)
        self.assertIn("window.print();", script)
        self.assertNotIn("window.open", script)
        self.assertIn("@media print", css)
        self.assertIn("#printArea", css)

    def test_print_has_custom_preview_dialog_and_controls(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        css = (STATIC / "styles.css").read_text(encoding="utf-8")
        script = (STATIC / "app.js").read_text(encoding="utf-8")

        self.assertIn('id="printDialog" class="print-dialog" hidden', html)
        self.assertIn('id="printPreviewImage"', html)
        self.assertIn('id="paperSize"', html)
        self.assertIn('id="orientation"', html)
        self.assertIn('id="fitMode"', html)
        self.assertIn('id="confirmPrintBtn"', html)
        self.assertIn("openPrintPreview", script)
        self.assertIn("updatePrintPreview", script)
        self.assertIn("document.body.dataset.paperSize", script)
        self.assertIn(".print-dialog", css)

    def test_print_preview_supports_copies_and_multi_up_layouts(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        css = (STATIC / "styles.css").read_text(encoding="utf-8")
        script = (STATIC / "app.js").read_text(encoding="utf-8")

        self.assertIn('id="copies"', html)
        self.assertIn('id="copiesPerPage"', html)
        self.assertIn('id="printGap"', html)
        self.assertIn('id="showCutLines"', html)
        self.assertIn('id="printPreviewPages"', html)
        self.assertIn("buildPrintPages", script)
        self.assertIn("createPrintTile", script)
        self.assertIn("--copies-per-page", script)
        self.assertIn("--print-cols", script)
        self.assertIn("--print-rows", script)
        self.assertIn("syncCopiesWithLayout", script)
        self.assertIn(".print-tile", css)
        self.assertIn("grid-template-columns: repeat(var(--print-cols), 1fr)", css)
        self.assertIn("grid-template-rows: repeat(var(--print-rows), 1fr)", css)
        self.assertIn("break-after: page", css)

    def test_print_preview_has_more_paper_sizes_and_visible_page_shell(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        css = (STATIC / "styles.css").read_text(encoding="utf-8")
        script = (STATIC / "app.js").read_text(encoding="utf-8")

        for paper in ['value="a3"', 'value="a5"', 'value="legal"', 'value="photo-4x6"', 'value="photo-5x7"', 'value="passport"']:
            self.assertIn(paper, html)
        self.assertIn('id="paperInfo"', html)
        self.assertIn("paperLabel", script)
        self.assertIn("paperInfo.textContent", script)
        self.assertIn("--paper-ratio", script)
        self.assertIn("aspect-ratio: var(--paper-ratio)", css)
        self.assertIn("calc(72vh * var(--paper-ratio))", css)
        self.assertIn("outline:", css)
        self.assertIn("min-height: 72vh", css)
        self.assertIn("max-height: 72vh", css)

    def test_print_preview_has_friendly_browser_print_options(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        css = (STATIC / "styles.css").read_text(encoding="utf-8")
        script = (STATIC / "app.js").read_text(encoding="utf-8")

        for field in ['id="pageRange"', 'id="colorMode"', 'id="marginMode"', 'id="scaleMode"', 'id="scalePercent"', 'id="includeBackground"']:
            self.assertIn(field, html)
        for label in ['Printer', 'Pages', 'Color', 'Margins', 'Scale', 'Background']:
            self.assertIn(label, html)
        self.assertIn('class="settings-group"', html)
        self.assertIn("applyPrintOptions", script)
        self.assertIn("body.dataset.colorMode", script)
        self.assertIn("--print-margin", script)
        self.assertIn("--print-scale", script)
        self.assertIn("body[data-color-mode=\"bw\"]", css)
        self.assertIn("body[data-include-background=\"off\"]", css)

    def test_print_preview_has_xy_position_editor(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        css = (STATIC / "styles.css").read_text(encoding="utf-8")
        script = (STATIC / "app.js").read_text(encoding="utf-8")

        for field in ['id="offsetX"', 'id="offsetY"', 'id="resetPositionBtn"']:
            self.assertIn(field, html)
        for label in ['X position', 'Y position']:
            self.assertIn(label, html)
        self.assertIn("resetPositionBtn", script)
        self.assertIn("--image-offset-x", script)
        self.assertIn("--image-offset-y", script)
        self.assertIn("translate(var(--image-offset-x), var(--image-offset-y))", css)

    def test_print_settings_scroll_independently_preview_stays_fixed(self):
        css = (STATIC / "styles.css").read_text(encoding="utf-8")

        self.assertIn(".print-panel {", css)
        self.assertIn("overflow: hidden", css)
        self.assertIn(".print-settings {", css)
        self.assertIn("overflow-y: auto", css)
        self.assertIn(".print-preview-wrap {", css)
        self.assertIn("position: sticky", css)
        self.assertIn("top: 0", css)

    def test_github_pages_build_is_noindex_and_relative(self):
        html = (STATIC / "index.html").read_text(encoding="utf-8")
        script = (STATIC / "app.js").read_text(encoding="utf-8")

        self.assertIn('name="robots" content="noindex, nofollow, noarchive"', html)
        self.assertIn('href="./styles.css"', html)
        self.assertRegex(html, r'src="\./app\.js(?:\?v=[^"]+)?"')
        self.assertIn("cleanImageInBrowser", script)
        self.assertIn("Static GitHub Pages has no API", script)

    def test_static_browser_cleanup_uses_adaptive_shadow_normalization(self):
        script = (STATIC / "app.js").read_text(encoding="utf-8")

        self.assertIn("function normalizeIllumination", script)
        self.assertIn("function buildIntegral", script)
        self.assertIn("function localMean", script)
        self.assertIn("const normalizedIntegral = buildIntegral(normalizedGray, width, height);", script)
        self.assertIn("localPaper - 24", script)
        self.assertNotIn("const out = bright < 188 ? 0 : 255;", script)


if __name__ == "__main__":
    unittest.main()
