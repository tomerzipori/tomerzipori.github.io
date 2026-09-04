import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("build_content", ROOT / "scripts" / "build_content.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ContentContractTests(unittest.TestCase):
    def test_public_content_passes_maturity_gate(self):
        records = MODULE.collect()
        self.assertEqual(MODULE.validate(records), [])
        public_urls = {record["url"] for record in records if record["status"] in {"finished", "nearly-finished"} and record["draft"] is False}
        self.assertNotIn("/posts/multilingual-embeddings-layers/", public_urls)


    def test_all_four_paths_are_used_by_public_content(self):
        records = MODULE.collect()
        paths = {path for record in records for path in record["paths"] if record["status"] != "draft"}
        self.assertEqual(paths, MODULE.ALLOWED_PATHS)

    def test_home_page_has_a_concise_public_structure(self):
        home = (ROOT / "index.qmd").read_text()
        self.assertIn("I make models easier to inspect.", home)
        self.assertIn("Selected work", home)
        self.assertNotIn("Play with an idea", home)
        self.assertNotIn("Walk the garden", home)

    def test_nested_pages_use_the_shared_stylesheet(self):
        config = (ROOT / "_quarto.yml").read_text()
        self.assertIn("css: /styles.css", config)
        self.assertIn("title-block-style: none", config)

    def test_surprise_link_tracks_its_previous_destination(self):
        script = (ROOT / "assets" / "site.js").read_text()
        self.assertIn('sessionStorage.getItem("lastOddDestination")', script)
        self.assertIn('candidate !== previous', script)


if __name__ == "__main__":
    unittest.main()
