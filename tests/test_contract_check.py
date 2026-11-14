"""council/tools/contract_check.py: the analyze step reads a spec folder against the constitution and the stage
contract in council/pipeline.yaml (pass spec-contract-1, 2026-10-28)."""
import re
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "council" / "tools"))
import contract_check as cc  # noqa: E402

GOOD = ROOT / ".specify" / "specs" / "spec-contract"
FACES = set(yaml.safe_load((ROOT / "council" / "faces.yaml").read_text())["order"])
_SKILL = ROOT / ".claude/skills/design-ontology/SKILL.md"  # lives in six-faces-council only; this repo checks against the contract's own field list
FIELDS = (re.findall(r"^- `([a-z_]+)`$", _SKILL.read_text(), re.M) if _SKILL.exists()
          else list(yaml.safe_load((ROOT / "council" / "pipeline.yaml").read_text())["contract"]["field_owners"]))


class ContractCheck(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        shutil.copytree(GOOD, self.tmp / "f")
        self.folder = self.tmp / "f"

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def edit(self, name, old, new):
        path = self.folder / name
        text = path.read_text()
        self.assertIn(old, text)
        path.write_text(text.replace(old, new, 1))

    def stages(self):
        return {stage for stage, _ in cc.check(self.folder)}

    def test_the_contract_folder_keeps_its_own_contract(self):
        self.assertEqual(cc.check(GOOD), [])

    def test_a_marker_without_a_board_row_fails_clarify(self):
        self.edit("spec.md", "## Purpose\n", "## Purpose\n\n[NEEDS CLARIFICATION: which repo]\n")
        self.assertIn("clarify", self.stages())

    def test_a_marker_with_its_row_holds(self):
        self.edit("spec.md", "## Purpose\n", "## Purpose\n\n[NEEDS CLARIFICATION: which repo | board: spk-name]\n")
        self.assertEqual(cc.check(self.folder), [])

    def test_a_placeholder_field_fails_its_stage(self):
        self.edit("spec.md", "- `risks_and_tests`: risk", "- `risks_and_tests`: [Challenger]\n- `x`: risk")
        self.assertIn("falsify", self.stages())

    def test_a_missing_signature_fails(self):
        self.edit("spec.md", "- clarify: sage (2026-10-28)\n", "")
        self.assertIn("clarify", self.stages())

    def test_a_missing_article_row_fails_plan(self):
        self.edit("plan.md", "| 7 Something to see | pass | the matrix still on the board |\n", "")
        self.assertIn("plan", self.stages())

    def test_an_exception_needs_a_board_row(self):
        self.edit("plan.md", "| 7 Something to see | pass |", "| 7 Something to see | exception |")
        self.assertIn("plan", self.stages())

    def test_a_skipped_skill_needs_naming(self):
        self.edit("plan.md", "skipped: better - the ask was already deep; it named the three things to bind\n", "")
        self.assertIn("intake", self.stages())

    def test_a_requirement_with_no_task_fails(self):
        self.edit("spec.md", "## Design decisions", "- **FR-009** an orphan.\n\n## Design decisions")
        self.assertIn("plan", self.stages())

    def test_through_stops_early(self):
        (self.folder / "plan.md").write_text("# Plan\n")
        self.assertEqual(cc.check(self.folder, through="falsify"), [])


class TheContractItself(unittest.TestCase):
    data = cc.pipeline()

    def test_every_owner_is_a_face(self):
        for stage in self.data["stages"]:
            self.assertTrue(set(stage["owners"]) <= FACES, stage["id"])

    def test_field_owners_cover_the_ontology_output_contract(self):
        owners = self.data["contract"]["field_owners"]
        self.assertEqual(set(owners), set(FIELDS))
        self.assertTrue(set(owners.values()) <= FACES)

    def test_every_field_is_filled_by_one_stage(self):
        filled = [f for s in self.data["stages"] for f in s.get("fills") or []]
        self.assertEqual(sorted(filled), sorted(FIELDS))

    def test_every_stage_names_articles_that_exist(self):
        arts = cc.articles()
        self.assertEqual(sorted(arts), list(range(1, len(arts) + 1)))
        for stage in self.data["stages"]:
            self.assertIn("speckit", stage, stage["id"])
            self.assertTrue(stage.get("articles"), stage["id"])
            self.assertTrue(set(stage["articles"]) <= set(arts), stage["id"])

    def test_constitution_names_a_face(self):
        text = (ROOT / "council" / "constitution.md").read_text()
        guards = re.findall(r"\*\*Guard:\*\* ([a-z]+)\.", text)
        self.assertEqual(len(guards), len(cc.articles()))
        self.assertTrue(set(guards) <= FACES)
        # The constitution cites paths that live in six-faces-council; the home repo tests that they exist.


if __name__ == "__main__":
    unittest.main()
