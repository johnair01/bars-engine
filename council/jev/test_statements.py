#!/usr/bin/env python3
"""Self-check for validate_statements.py. Run: python3 council/jev/test_statements.py
No network and no model calls."""
import copy
import json
import tempfile
import unittest
from pathlib import Path

import validate_statements as v


class ValidatorTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / "docs").mkdir()
        (self.root / "src").mkdir()
        (self.root / "docs" / "a.md").write_text(
            "# Title\n\nLayers are **64x64 pixels** wide.\nThe key is `nation-arch`\nand continues here.\n",
            encoding="utf-8")
        (self.root / "src" / "code.ts").write_text("one\ntwo\nthree\n", encoding="utf-8")
        v._cache.clear()
        self.good = {
            "id": "AS-001", "doc": "docs/a.md", "line": 3,
            "statement": "Layers are **64x64 pixels** wide.", "kind": "numeric",
            "scope": "asset-admin", "code_refs": ["src/code.ts:2"], "checkable": True,
            "known_drift": None, "label": "unlabelled", "note": "number seen in both",
        }

    def tearDown(self):
        self.tmp.cleanup()
        v._cache.clear()

    def run_rows(self, rows):
        v._cache.clear()
        return v.validate(rows, root=self.root, check_git=False)

    def test_good_row_passes(self):
        self.assertEqual(self.run_rows([self.good]), [])

    def test_emphasis_tolerated(self):
        row = copy.deepcopy(self.good)
        row["statement"] = "Layers are 64x64 pixels wide."
        self.assertEqual(self.run_rows([row]), [])

    def test_multiline_statement(self):
        row = copy.deepcopy(self.good)
        row["line"], row["statement"] = 4, "The key is `nation-arch` and continues here."
        self.assertEqual(self.run_rows([row]), [])

    def test_missing_statement_fails(self):
        row = copy.deepcopy(self.good)
        row["statement"] = "Layers are 32x32 pixels wide."
        self.assertTrue(self.run_rows([row]))

    def test_far_line_fails(self):
        row = copy.deepcopy(self.good)
        row["doc"] = "docs/a.md"
        (self.root / "docs" / "a.md").write_text("x\n" * 20 + "Layers are 64x64 pixels wide.\n")
        row["line"], row["statement"] = 2, "Layers are 64x64 pixels wide."
        self.assertTrue(self.run_rows([row]))

    def test_missing_doc_fails(self):
        row = copy.deepcopy(self.good)
        row["doc"] = "docs/none.md"
        self.assertTrue(self.run_rows([row]))

    def test_line_out_of_range_fails(self):
        row = copy.deepcopy(self.good)
        row["line"] = 99
        self.assertTrue(self.run_rows([row]))

    def test_duplicate_id_fails(self):
        row2 = copy.deepcopy(self.good)
        self.assertTrue(any("duplicate" in f for f in self.run_rows([self.good, row2])))

    def test_label_must_be_unlabelled(self):
        row = copy.deepcopy(self.good)
        row["label"] = "agrees"
        self.assertTrue(self.run_rows([row]))

    def test_bad_scope_and_kind_fail(self):
        row = copy.deepcopy(self.good)
        row["scope"], row["kind"] = "player-uploads", "vibes"
        self.assertEqual(len(self.run_rows([row])), 2)

    def test_code_ref_checks(self):
        for ref in ("src/nope.ts:1", "src/code.ts:50", "src/code.ts:0", "src/code.ts"):
            row = copy.deepcopy(self.good)
            row["code_refs"] = [ref]
            self.assertTrue(self.run_rows([row]), ref)

    def test_checkable_requires_refs(self):
        row = copy.deepcopy(self.good)
        row["code_refs"] = []
        self.assertTrue(self.run_rows([row]))
        row["checkable"] = False
        self.assertEqual(self.run_rows([row]), [])

    def test_banned_words_in_note(self):
        for word in v.NOTE_BANNED:
            row = copy.deepcopy(self.good)
            row["note"] = f"this one has the word {word} in it"
            self.assertTrue(self.run_rows([row]), word)

    def test_unknown_drift_fails(self):
        row = copy.deepcopy(self.good)
        row["known_drift"] = "z"
        self.assertTrue(self.run_rows([row]))

    def test_order_checked(self):
        row2 = copy.deepcopy(self.good)
        row2["id"], row2["line"], row2["statement"] = "AS-002", 1, "# Title"
        self.assertTrue(any("ordered" in f for f in self.run_rows([self.good, row2])))


class RealFileTests(unittest.TestCase):
    def test_real_file_passes(self):
        v._cache.clear()
        rows = json.loads(v.DEFAULT_JSON.read_text(encoding="utf-8"))
        self.assertGreater(len(rows), 0)
        self.assertEqual(v.validate(rows), [])
        self.assertTrue(all(r["label"] == "unlabelled" for r in rows))


if __name__ == "__main__":
    unittest.main()
