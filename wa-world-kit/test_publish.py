import json, subprocess, sys, tempfile, unittest
from pathlib import Path
KIT = Path(__file__).parent
PUB = str(KIT / "publish.py")

class Publish(unittest.TestCase):
    def run_pub(self, world, vol, *extra):
        return subprocess.run([sys.executable, PUB, str(world), "--volume", str(vol), *extra], capture_output=True, text=True)
    def test_example_publishes_with_portals(self):
        with tempfile.TemporaryDirectory() as v:
            r = self.run_pub(KIT / "world", v)
            self.assertEqual(r.returncode, 0, r.stderr)
            p = json.loads((Path(v) / "world" / "portals.json").read_text())
            hearth = next(m for m in p["maps"] if m["file"] == "hearth.tmj")
            self.assertEqual(hearth["exits"], ["garden.tmj"])
            self.assertEqual(hearth["from"], ["garden.tmj"])
    def test_refuses_bad_world(self):
        with tempfile.TemporaryDirectory() as w, tempfile.TemporaryDirectory() as v:
            m = json.loads((KIT / "world" / "hearth.tmj").read_text())
            m["tilewidth"] = 16; m["layers"] = m["layers"][1:]
            (Path(w) / "hearth.tmj").write_text(json.dumps(m))
            r = self.run_pub(w, v)
            self.assertEqual(r.returncode, 1)
            self.assertIn("32x32", r.stderr); self.assertIn("start", r.stderr); self.assertIn("not in this world", r.stderr)
            self.assertFalse(any(Path(v).iterdir()))

if __name__ == "__main__":
    unittest.main()
