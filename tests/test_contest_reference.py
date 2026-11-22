"""contest/reference.py contact check: a blade buried in its socket collar touches it (skill-distill-fit-1, 2026-11-21).
The accepted Guan Dao failed this check with 'blade sits 14 cm above the nearest part below it'; a floating blade must
still fail."""
import json
import sys
import unittest
from pathlib import Path

CONTEST = Path(__file__).resolve().parent.parent / "tools/blender-cloud/make/contest"
sys.path.insert(0, str(CONTEST))
import reference  # noqa: E402

PACK = json.loads((CONTEST / "reference/guan-dao.json").read_text())


def part(name, lo, hi, long, mid, short, wx=0.1, wy=0.1):
    return {"name": name, "lo_z": lo, "hi_z": hi, "wx": wx, "wy": wy, "long": long, "mid": mid, "short": short}


def contact(blade_lo, collar):
    ps = [part("Shaft", 0.0, 2.0, 2.0, 0.05, 0.05),
          part("Collar", *collar, 0.09, 0.08, 0.08),
          part("Blade", blade_lo, blade_lo + 0.7, 0.7, 0.3, 0.03, wx=0.4),
          part("Wall", 0.0, 3.0, 3.0, 3.0, 0.2, wx=3.0)]
    return next(c for c in reference.measure(PACK, ps) if c["check"] == "contact")


class Contact(unittest.TestCase):
    def test_blade_buried_in_collar_touches(self):
        self.assertTrue(contact(2.135, (2.0, 2.15))["ok"])

    def test_floating_blade_fails(self):
        c = contact(2.3, (2.0, 2.09))
        self.assertFalse(c["ok"])

    def test_wall_does_not_count_as_touching(self):
        self.assertFalse(contact(2.5, (2.0, 2.09))["ok"])


if __name__ == "__main__":
    unittest.main()
