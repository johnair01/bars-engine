#!/usr/bin/env python3
"""
voice_gate.py: the lexicon gate behind `copy-scan.py --lexicon` (Teaching Desk, .specify/specs/voice-desk FR-006 to FR-011).

Every other check tests the shape of a line. This one tests that a word names something the player was shown.

  fail  a watched word on a screen that never showed it (FR-009; the six face names under vf-face-names-1 B)
  fail  a watched word whose entry is `banned`, or a `struck_for` stand-in (FR-008)
  fail  a string equal to the `old` of a bank line Wendell rewrote (FR-010)
  warn  a word in neither the lexicon nor content/voice/common-words.txt nor scripts/copy-scan.allow (FR-011)

Inputs are the files under content/voice/ (lexicon.yaml, bank.jsonl, screens.yaml, common-words.txt). Only a line with
`marked_by: wendell` is law, so a bank line marked by anyone else never fails a build. No AI, no network.

Matching is whole word and case blind, with one exception: "bar" is also plain English ("a progress bar"), so it matches
only as BAR or BARs (CASE_EXACT). Strings that are one lower-case token with no space ("shaman", "free-write", a CSS
class) are identifiers, never copy, and are skipped.
"""
import json
import pathlib
import re

import yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOICE = ROOT / "content" / "voice"

# word -> the spellings that count. Anything else spelled the same is ordinary English.
CASE_EXACT = {"bar": ("BAR", "BARs")}

TOKEN = re.compile(r"[A-Za-z][A-Za-z’']*")
IDENT = re.compile(r"^[a-z0-9_./:@\[\]-]+$")
WS = re.compile(r"\s+")


def load_yaml(name, base=None):
    p = (base or VOICE) / name
    return yaml.safe_load(p.read_text(encoding="utf-8")) or {}


def load_bank(base=None):
    p = (base or VOICE) / "bank.jsonl"
    if not p.exists():
        return []
    return [json.loads(ln) for ln in p.read_text(encoding="utf-8").splitlines() if ln.strip()]


def fold(s):
    return WS.sub(" ", s.strip()).lower()


def load_common(base=None):
    p = (base or VOICE) / "common-words.txt"
    if not p.exists():
        return set()
    return {ln.strip().lower() for ln in p.read_text(encoding="utf-8").splitlines() if ln.strip() and not ln.startswith("#")}


class Gate:
    def __init__(self, base=None):
        self.lex = load_yaml("lexicon.yaml", base).get("words", [])
        self.screens = {s["id"]: s for s in load_yaml("screens.yaml", base).get("screens", [])}
        self.bank_old = {fold(b["old"]): b for b in load_bank(base) if b.get("marked_by") == "wendell" and b.get("old")}
        self.common = load_common(base)
        self.entries = {}   # spelling (lower case) -> entry
        self.struck = {}    # spelling -> the entry it was struck for
        for e in self.lex:
            for w in [e["word"], *(e.get("forms") or [])]:
                self.entries[w.lower()] = e
            for w in e.get("struck_for") or []:
                self.struck[w.lower()] = e

    def screens_of(self, path):
        return [sid for sid, s in self.screens.items() if str(path) in (s.get("files") or [])]

    def chain(self, sid):
        """The screen and every screen the player passed on the way to it."""
        seen, todo = [], [sid]
        while todo:
            cur = todo.pop()
            if cur in seen:
                continue
            seen.append(cur)
            todo += (self.screens.get(cur) or {}).get("after") or []
        return seen

    def shown(self, entry, sid):
        return any(c in (entry.get("shown_on") or []) for c in self.chain(sid))

    def is_copy(self, text):
        return not IDENT.match(text.strip())

    def watched(self, text):
        """Yield (spelling, entry, kind) for each watched word in one string."""
        for m in TOKEN.finditer(text):
            tok = m.group(0).strip("’'")
            low = tok.lower()
            if low in self.struck:
                yield tok, self.struck[low], "struck"
                continue
            e = self.entries.get(low)
            if not e:
                continue
            exact = CASE_EXACT.get(e["word"])
            if exact and tok not in exact:
                continue
            yield tok, e, "word"
        # Multi-word entries ("clean up", "wake up") match as phrases.
        low = fold(text)
        for spelling, e in self.entries.items():
            if " " in spelling and re.search(r"\b" + re.escape(spelling) + r"\b", low):
                yield spelling, e, "word"

    def check_string(self, text, sid):
        """Failures for one player-facing string on screen `sid` (None = a file no screen owns)."""
        out = []
        if not self.is_copy(text):
            return out
        if fold(text) in self.bank_old:
            b = self.bank_old[fold(text)]
            out.append(("fail", "rewritten line", f"he rewrote this line ({b.get('at', '?')}); use: {b.get('new', '')!r}", fold(text)[:60]))
        for tok, e, kind in self.watched(text):
            if kind == "struck":
                out.append(("fail", "struck word", f"{tok!r} was struck for {e['word']!r}; write {e['word']!r}", tok.lower()))
            elif e.get("status") == "banned":
                out.append(("fail", "banned word", f"{tok!r} is banned", tok.lower()))
            elif sid and not self.shown(e, sid):
                out.append(("fail", "word the screen never showed",
                            f"{tok!r} is not in `shown_on` for {sid} or any screen before it; "
                            f"say what it means first: {e.get('plain') or '(no plain meaning yet)'}", e["word"]))
        return out

    def coinages(self, text, allow):
        if not self.is_copy(text) or any(a and a in text.lower() for a in allow):
            return []
        out, seen = [], set()
        for tok in re.findall(r"[A-Za-z]+", text):
            if re.search(r"[a-z][A-Z]", tok):   # camelCase is code, not copy
                continue
            low = tok.lower()
            if len(low) < 4 or low in seen:
                continue
            seen.add(low)
            if low in self.entries or low in self.struck or low in self.common:
                continue
            out.append(low)
        return out
