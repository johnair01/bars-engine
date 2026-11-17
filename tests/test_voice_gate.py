"""scripts/voice_gate.py and voice-packet.py: the lexicon gate (Teaching Desk step 3, spec voice-desk FR-006 to FR-013)."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import voice_gate  # noqa: E402


def make(lex, bank=(), screens=None, common=()):
    d = Path(tempfile.mkdtemp())
    (d / "lexicon.yaml").write_text(yaml.safe_dump({"version": 1, "words": lex}))
    (d / "bank.jsonl").write_text("".join(json.dumps(b) + "\n" for b in bank))
    (d / "screens.yaml").write_text(yaml.safe_dump({"version": 1, "screens": screens or [
        {"id": "a", "files": ["a.tsx"], "after": []},
        {"id": "b", "files": ["b.tsx"], "after": ["a"]}]}))
    (d / "common-words.txt").write_text("\n".join(common))
    return voice_gate.Gate(d)


def entry(word, **kw):
    return {"word": word, "forms": kw.pop("forms", []), "plain": kw.pop("plain", ""), "status": kw.pop("status", "proposed"),
            "shown_on": kw.pop("shown_on", []), "struck_for": kw.pop("struck_for", []), **kw}


class GateTest(unittest.TestCase):
    def test_word_fails_on_a_screen_that_never_showed_it(self):
        g = make([entry("ribbon", forms=["ribbons"])])
        self.assertEqual(g.check_string("Pull a ribbon for the day", "a")[0][1], "word the screen never showed")
        self.assertEqual(len(g.check_string("Ribbons hang here", "a")), 1)   # case blind, forms count

    def test_word_passes_on_the_screen_that_shows_it_and_every_screen_after(self):
        g = make([entry("ribbon", shown_on=["a"])])
        self.assertEqual(g.check_string("Pull a ribbon", "a"), [])
        self.assertEqual(g.check_string("Pull a ribbon", "b"), [])        # b comes after a
        g2 = make([entry("ribbon", shown_on=["b"])])
        self.assertEqual(len(g2.check_string("Pull a ribbon", "a")), 1)   # a comes before b

    def test_whole_word_only(self):
        g = make([entry("face")])
        self.assertEqual(g.check_string("The surface is smooth and faceless", "a"), [])
        self.assertEqual(len(g.check_string("Face the wall", "a")), 1)    # common English still fires; the baseline or allow file owns it

    def test_bar_only_as_BAR(self):
        g = make([entry("bar", forms=["bars"])])
        self.assertEqual(g.check_string("The progress bar fills as you type", "a"), [])
        self.assertEqual(len(g.check_string("Your BAR is kept", "a")), 1)
        self.assertEqual(len(g.check_string("Your BARs are kept", "a")), 1)

    def test_phrase_entries(self):
        g = make([entry("clean up")])
        self.assertEqual(len(g.check_string("Time to clean up the desk", "a")), 1)

    def test_banned_and_struck(self):
        g = make([entry("seed", status="banned", marked_by="wendell", shown_on=["a"]),
                  entry("ribbon", shown_on=["a"], struck_for=["streamer"])])
        self.assertEqual(g.check_string("Plant a seed today", "a")[0][1], "banned word")
        self.assertEqual(g.check_string("Pull a streamer", "a")[0][1], "struck word")

    def test_a_line_he_rewrote_fails_and_a_line_marked_by_anyone_else_does_not(self):
        bank = [{"old": "Pull  the one that fits", "new": "Pick the card that fits", "marked_by": "wendell", "at": "2026-11-17"},
                {"old": "Some agent line here", "new": "x", "marked_by": None, "at": "2026-11-17"}]
        g = make([], bank)
        self.assertEqual(g.check_string("pull the one that fits ", "a")[0][1], "rewritten line")   # trim, case, whitespace
        self.assertEqual(g.check_string("Some agent line here", "a"), [])

    def test_identifiers_are_not_copy(self):
        g = make([entry("shaman")])
        self.assertEqual(g.check_string("shaman", "a"), [])
        self.assertEqual(g.check_string("free-write", "a"), [])
        self.assertEqual(len(g.check_string("Shaman", "a")), 1)

    def test_coinage_warns_for_a_word_in_no_list(self):
        g = make([entry("ribbon")], common=["write", "today", "with"])
        self.assertEqual(g.coinages("Write a ribbon today with a gleamwick", []), ["gleamwick"])
        self.assertEqual(g.coinages("Write a gleamwick", ["gleamwick"]), [])

    def test_a_file_in_no_screen_still_gets_struck_banned_and_bank_checks(self):
        g = make([entry("ribbon")])
        self.assertEqual(g.screens_of("c.tsx"), [])
        self.assertEqual(g.check_string("Pull a ribbon", None), [])       # no screen, no "never showed"

    def test_shipped_tap_the_vein_runs_and_the_packet_prints(self):
        g = voice_gate.Gate()
        self.assertIn("tap-the-vein/free-write", g.screens)
        for f in (s for sc in g.screens.values() for s in sc["files"]):
            self.assertTrue((ROOT / f).is_file(), f)                      # screens.yaml names real files
        sys.path.insert(0, str(ROOT / "scripts"))
        import importlib.util
        spec = importlib.util.spec_from_file_location("vp", ROOT / "scripts" / "voice-packet.py")
        vp = importlib.util.module_from_spec(spec); spec.loader.exec_module(vp)
        out = vp.packet(g, "tap-the-vein/ribbons")
        self.assertIn("ribbon", out)
        self.assertIn("Voice (the council's defaults", out)


if __name__ == "__main__":
    unittest.main()
