import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import baseline  # noqa: E402
import extract_pairs  # noqa: E402
import make_constructed  # noqa: E402

META = {"report": "r1.md", "pairs": [
    {"n": 1, "claims": ["Cats purr loudly [1].", "Cats sleep a lot [1]."], "url": "http://x/a", "quote": "Cats purr loudly at night."},
    {"n": 2, "claims": ["Rivers flow downhill [2]."], "url": "http://x/b", "quote": "Water flows downhill to the sea."},
    {"n": 3, "claims": ["Index page exists [3]."], "url": "http://x/c", "quote": None},
    {"n": 4, "claims": [], "url": "http://x/d", "quote": "orphan quote"},
]}


def real_rows():
    rows, _ = extract_pairs.extract_from_meta(META, "r1")
    return rows


class TestExtract(unittest.TestCase):
    def test_rows_and_skips(self):
        rows, skipped = extract_pairs.extract_from_meta(META, "r1")
        self.assertEqual(len(rows), 3)
        self.assertEqual(skipped, 2)
        self.assertTrue(all(r["label"] == "unlabelled" and r["by"] is None and r["kind"] == "real" for r in rows))
        self.assertEqual(rows[0]["id"], "r1#1.1")
        self.assertEqual(rows[1]["quote"], rows[0]["quote"])


class TestConstructed(unittest.TestCase):
    def test_never_own_quote(self):
        real = real_rows()
        cons, skipped = make_constructed.build_constructed(real)
        self.assertEqual(len(cons), len(real))
        self.assertEqual(skipped, [])
        own = {r["id"]: r["quote"] for r in real}
        for c in cons:
            self.assertNotEqual(c["quote"], own[c["id"][:-5]])
            self.assertEqual((c["kind"], c["label"], c["by"]), ("constructed", "no", "construction"))

    def test_skip_single_quote_report(self):
        cons, skipped = make_constructed.build_constructed(real_rows()[:2])
        self.assertEqual(cons, [])
        self.assertEqual(skipped, ["r1.md"])

    def test_separation(self):
        real = real_rows()
        cons, _ = make_constructed.build_constructed(real)
        self.assertTrue(all(r["kind"] == "real" for r in real))
        self.assertTrue(all(c["kind"] == "constructed" for c in cons))
        self.assertTrue(all(c["id"].endswith("~swap") for c in cons))


class TestBaseline(unittest.TestCase):
    def test_normalise(self):
        self.assertEqual(baseline.normalise("A  “quoted”   `code`\n word"), "a quoted code word")

    def test_exact_after_normalising(self):
        self.assertTrue(baseline.exact_in_page("it’s `fine`", "so  ITS fine here"))
        self.assertFalse(baseline.exact_in_page("absent words", "so its fine here"))

    def test_fuzzy(self):
        page = "intro text. The quick brown fox jumped over the lazy dog. outro"
        self.assertGreater(baseline.fuzzy_in_page("the quick brown fox jumps over the lazy dog", page), 0.9)
        self.assertLess(baseline.fuzzy_in_page("completely unrelated sentence about tax law", page), 0.6)

    def test_term_overlap(self):
        self.assertGreater(baseline.term_overlap("Cats purr loudly", "Cats purr loudly at night"), 0.5)
        self.assertEqual(baseline.term_overlap("Cats purr", "Rivers flow"), 0.0)

    def test_fetch_fails_soft_and_caches(self):
        with tempfile.TemporaryDirectory() as d:
            def boom(u):
                raise OSError("no network")
            self.assertIsNone(baseline.fetch("http://x/a", d, boom))
            self.assertEqual(baseline.fetch("http://x/a", d, lambda u: "page"), "page")
            self.assertEqual(baseline.fetch("http://x/a", d, boom), "page")

    def test_score_row_unfetched_page(self):
        row = {"id": "i", "kind": "real", "claim": "Cats purr", "quote": "Cats purr loudly"}
        r = baseline.score_row(row, None, 0.8, 0.2)
        self.assertIsNone(r["in_page_exact"])
        self.assertEqual(r["flag"], "ok")

    def test_agreement_separates_kinds_and_cannot_score(self):
        rows = [{"id": "a", "kind": "real", "label": "unlabelled"},
                {"id": "b", "kind": "constructed", "label": "no"}]
        res = [{"id": "a", "kind": "real", "flag": "ok"}, {"id": "b", "kind": "constructed", "flag": "read"}]
        ag = baseline.agreement(res, {r["id"]: r for r in rows})
        self.assertIsNone(ag["real"])
        self.assertEqual(ag["constructed"], {"labelled": 1, "agree": 1})

    def test_agreement_real_labelled(self):
        rows = [{"id": "a", "kind": "real", "label": "supports"}, {"id": "c", "kind": "real", "label": "contradicts"}]
        res = [{"id": "a", "kind": "real", "flag": "ok"}, {"id": "c", "kind": "real", "flag": "ok"}]
        ag = baseline.agreement(res, {r["id"]: r for r in rows})
        self.assertEqual(ag["real"], {"labelled": 2, "agree": 1})
        self.assertIsNone(ag["constructed"])


if __name__ == "__main__":
    unittest.main()
