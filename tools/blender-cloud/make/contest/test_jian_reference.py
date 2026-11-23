"""The jian gate measures a sword, not the Guan Dao contest's shaft and rack."""
import importlib.util
import json
import pathlib
import unittest

HERE = pathlib.Path(__file__).resolve().parent
SCRIPT = HERE / "jian_reference.py"
PACK = json.loads((HERE / "reference" / "jian.json").read_text(encoding="utf-8"))
spec = importlib.util.spec_from_file_location("jian_reference", SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def part(name, xlo, xhi, ylo, yhi, zlo, zhi):
    return mod.part(name, [xlo, ylo, zlo], [xhi, yhi, zhi])


GOOD = [
    part("Blade", -.025, .025, -.005, .005, .20, 1.038),
    part("Guard", -.05, .05, -.015, .015, .18, .205),
    part("Grip", -.018, .018, -.018, .018, .035, .185),
    part("Pommel", -.022, .022, -.02, .02, 0, .04),
]


class JianReferenceTest(unittest.TestCase):
    def test_measured_jian_passes(self):
        checks = mod.measure(GOOD, PACK)
        self.assertTrue(all(c["ok"] for c in checks), checks)

    def test_missing_blade_fails(self):
        checks = mod.measure(GOOD[1:], PACK)
        self.assertFalse(all(c["ok"] for c in checks))
        self.assertIn("part blade", [c["check"] for c in checks if not c["ok"]])

    def test_short_blade_fails(self):
        parts = [part("Blade", -.025, .025, -.005, .005, .20, .80), *GOOD[1:]]
        self.assertFalse(next(c for c in mod.measure(parts, PACK) if c["check"] == "blade length")["ok"])

    def test_detached_blade_fails(self):
        parts = [part("Blade", -.025, .025, -.005, .005, .24, 1.078), *GOOD[1:]]
        self.assertFalse(next(c for c in mod.measure(parts, PACK) if c["check"] == "blade meets guard")["ok"])

    def test_polearm_scene_fails(self):
        checks = mod.measure([*GOOD, part("Rack", -1, 1, -.1, .1, 0, 1)], PACK)
        self.assertFalse(next(c for c in checks if c["check"] == "no polearm scene")["ok"])

    def test_open_blade_fails(self):
        parts = [mod.part("Blade", GOOD[0]["lo"], GOOD[0]["hi"], nonmanifold_edges=4), *GOOD[1:]]
        checks = mod.measure(parts, PACK)
        self.assertFalse(next(c for c in checks if c["check"] == "closed meshes")["ok"])

    def test_museum_length_is_tight(self):
        parts = [part("Blade", -.025, .025, -.005, .005, .20, 1.050), *GOOD[1:]]
        checks = mod.measure(parts, PACK)
        self.assertFalse(next(c for c in checks if c["check"] == "whole length")["ok"])


if __name__ == "__main__":
    unittest.main()

