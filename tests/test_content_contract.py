import hashlib
import importlib.util
import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("build_content", ROOT / "scripts" / "build_content.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

LEGACY_BODY_HASHES = {
    "bayes101": "b1730e3627ef3b715b69cbade40dd4963c0dab42f2b56754e08865c1b8a9cf62",
    "bayes102": "656e0593ffeb5a55021e8822163f868ce82cef26dc4b3f6773501785155e860c",
    "eggs": "0b591932d754e434a0c1f1d74b604746c720bfacc8719a02cadb5ac66611b56e",
    "elections2024": "7ed9f6f2e576f6652345dbaafc9085d2e915b082b591641993111b4b01263b39",
    "fifa23": "b4b754e1b9222f25c82ade6c2ec4195d2e0e06c4d68254a040e80ca190ca63b8",
    "football_fake_news": "b6bd82822fa2fb32f3df22d513aa6923f47eaa02eea18c709c8e6f181f819039",
    "micrograd": "88de06bcbeb02d27d5b22e4ddb9c1803f80b662c05ec3d37768ceb64b0cafd20",
    "netflix": "e7e89204b88c44e6182dcd152888eb8a3bc3ebccb44b068f4afde9a3ea42ff5e",
    "p_values_paradox": "bd6a8afde10a1c0537619c5c686386bef081bed819d3198e63f098ab84462652",
    "ufo": "ba9ccef2cf94b2b8957327bd845aadf1d34afb8639a684c788b01f7108623101",
}


def legacy_body(slug):
    text = (ROOT / "posts" / slug / "index.qmd").read_text(encoding="utf-8")
    start = text.index('<article class="prose real-post">')
    end = text.index("</article>", start) + len("</article>")
    return text[start:end]


class ContentContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.records = MODULE.collect()
        self_errors = MODULE.validate(cls.records)
        if self_errors:
            raise AssertionError("\n".join(self_errors))
        MODULE.generate(cls.records)

    def test_public_content_passes_maturity_gate(self):
        public = [record for record in self.records if MODULE.is_public(record)]
        self.assertEqual(len(public), 18)
        self.assertNotIn("/notes/pca-is-intuition-not-proof/", {record["url"] for record in self.records})
        self.assertNotIn("/posts/multilingual-embeddings-layers/", {record["url"] for record in self.records})

    def test_all_four_paths_are_used_by_public_content(self):
        paths = {path for record in self.records if MODULE.is_public(record) for path in record["paths"]}
        self.assertEqual(paths, MODULE.ALLOWED_PATHS)

    def test_home_page_has_the_brand_and_current_work(self):
        home = (ROOT / "index.qmd").read_text(encoding="utf-8")
        self.assertIn("Playful questions. Rigorous answers.", home)
        self.assertIn("I build models, experiments, and tools", home)
        self.assertIn("/garden/", home)
        self.assertIn("/notes/distilhubert-padding-study/", home)
        self.assertNotIn("I make models easier to inspect.", home)

    def test_nested_pages_use_shared_shell_and_pre_render(self):
        config = (ROOT / "_quarto.yml").read_text(encoding="utf-8")
        self.assertIn("css: /styles.css", config)
        self.assertIn("pre-render: python3 scripts/build_content.py", config)
        self.assertIn('"_generated/**"', config)
        self.assertIn("site-header.qmd", (ROOT / "posts" / "micrograd" / "index.qmd").read_text())

    def test_generated_inventory_drives_archive_garden_and_feeds(self):
        inventory = json.loads((ROOT / "_generated" / "content-index.json").read_text(encoding="utf-8"))
        urls = [item["url"] for item in inventory["items"]]
        self.assertEqual(len(urls), len(set(urls)))
        self.assertIn("/posts/micrograd/", urls)
        self.assertIn("/notes/distilhubert-padding-study/", urls)
        for path in ("writing/index.xml", "blog/blog.xml"):
            feed = (ROOT / path).read_text(encoding="utf-8")
            self.assertIn("/posts/micrograd/", feed)
            self.assertIn("/notes/distilhubert-padding-study/", feed)
            self.assertNotIn("multilingual", feed)

    def test_garden_map_has_one_node_per_public_item_and_static_list(self):
        map_html = (ROOT / "_generated" / "garden-map.html").read_text(encoding="utf-8")
        list_html = (ROOT / "_generated" / "garden-list.html").read_text(encoding="utf-8")
        script = (ROOT / "assets" / "site.js").read_text(encoding="utf-8")
        public = [record for record in self.records if MODULE.is_public(record)]
        self.assertEqual(map_html.count('class="garden-node '), len(public))
        self.assertEqual(list_html.count("data-garden-list-item"), len(public))
        self.assertIn('querySelectorAll(".garden-node")', script)
        for record in public:
            self.assertEqual(map_html.count(f'data-garden-url="{record["url"]}"'), 1)

    def test_relationships_expose_related_items_and_backlinks(self):
        criteria = (ROOT / "_generated" / "note-criteria-move-answers.html").read_text(encoding="utf-8")
        self.assertIn("Related", criteria)
        self.assertIn("Linked from", criteria)
        self.assertIn("OrdinalRegressionViz", criteria)
        self.assertIn("Can padding change audio-classification metrics?", criteria)

    def test_study_status_is_separate_from_editorial_status(self):
        padding = next(record for record in self.records if record["slug"] == "distilhubert-padding-study")
        self.assertEqual(padding["status"], "finished")
        self.assertEqual(padding["study-status"], "ongoing")
        self.assertEqual(padding["study-status-as-of"], "2026-09-05")
        note = (ROOT / "notes" / "distilhubert-padding-study" / "index.qmd").read_text(encoding="utf-8")
        self.assertIn("the original DistilHuBERT checkpoint does not use this positional BatchNorm path", note)
        self.assertIn("full matrix and controls are not complete", note)
        self.assertNotIn("/Users/Tomer.Zipori/research", note)

    def test_public_posts_keep_their_long_form_source_content(self):
        markers = {
            "bayes101": "Bayes theorem",
            "bayes102": "brms",
            "eggs": "eggproduction",
            "elections2024": "Nevada",
            "fifa23": "elastic_reg",
            "football_fake_news": "quanteda",
            "micrograd": "loss(",
            "netflix": "tfidf(",
            "p_values_paradox": "p-value",
            "ufo": "ufo_sightings",
        }
        for slug, marker in markers.items():
            post = (ROOT / "posts" / slug / "index.qmd").read_text(encoding="utf-8")
            self.assertIn(marker, post)
            self.assertEqual(hashlib.sha256(legacy_body(slug).encode()).hexdigest(), LEGACY_BODY_HASHES[slug])

    def test_threshold_component_is_scoped_and_resettable(self):
        script = (ROOT / "assets" / "evidence-thresholds.js").read_text(encoding="utf-8")
        self.assertIn('document.querySelectorAll("[data-evidence-component]")', script)
        self.assertIn("data-threshold-reset", (ROOT / "_includes" / "evidence-threshold-component.qmd").read_text())
        self.assertIn("state.thresholds = [...defaults.thresholds]", script)
        self.assertIn("Math.max(lower, Math.min(upper, value))", script)

    def test_surprise_link_excludes_previous_destination(self):
        script = (ROOT / "assets" / "site.js").read_text(encoding="utf-8")
        self.assertIn('sessionStorage.getItem("lastOddDestination")', script)
        self.assertIn("candidate !== previous", script)


if __name__ == "__main__":
    unittest.main()
