#!/usr/bin/env python3
"""
voice-packet.py <screen>: what a writer pastes before drafting a line for one screen (Teaching Desk, FR-013).

Prints, as plain text: the lexicon entries for the words this screen may use, the words it may not use yet (the lexicon
gate, `copy-scan.py --lexicon`, fails them), the voice chart's faders as sentences, and up to ten before/after pairs
Wendell kept (this screen's first, then the screens it comes after, newest first). Reads content/voice/ only: no AI, no
network. Screens are the ids in content/voice/screens.yaml.

    python3 scripts/voice-packet.py tap-the-vein/free-write
    python3 scripts/voice-packet.py --list
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import voice_gate  # noqa: E402


def sentence(name, f):
    v = f["value"]
    side = f["low"] if v <= 4 else f["high"] if v >= 6 else f"between {f['low']} and {f['high']}"
    return f"{name}: {v} of 10, {side}."


def packet(gate, sid, limit=10):
    lines = [f"Voice packet for {sid}", ""]
    chain = gate.chain(sid)
    can = [e for e in gate.lex if gate.shown(e, sid)]
    cannot = [e for e in gate.lex if not gate.shown(e, sid)]
    lines.append("Words this screen has shown, and what each means:")
    lines += [f"  {e['word']} [{e['status']}]: {e.get('plain') or '(no plain meaning yet)'}"
              + (f" Use: {e['usage']}" if e.get("usage") else "") for e in can] or ["  (none)"]
    lines += ["", "Words it may not use yet. The build fails them. Say what the word names first, or use a plain word:"]
    lines += [f"  {e['word']}" + (f" ({', '.join(e['forms'])})" if e.get("forms") else "")
              + (f": means {e['plain']}" if e.get("plain") else ": no plain meaning yet") for e in cannot] or ["  (none)"]
    struck = [f"{w} (write {e['word']})" for e in gate.lex for w in e.get("struck_for") or []]
    if struck:
        lines += ["", "Struck stand-ins, never use: " + "; ".join(struck)]
    chart = voice_gate.load_yaml("chart.yaml")
    state = "his" if chart.get("set_by") else "the council's defaults, not his yet"
    lines += ["", f"Voice ({state}):"] + [f"  {sentence(n, f)}" for n, f in (chart.get("faders") or {}).items()]
    bank = [b for b in voice_gate.load_bank() if b.get("marked_by") == "wendell"]
    rank = {s: i for i, s in enumerate(chain)}
    bank = [b for b in bank if b.get("screen") in rank]
    bank.sort(key=lambda b: b.get("at", ""), reverse=True)
    bank.sort(key=lambda b: rank[b["screen"]])
    lines += ["", "Lines he kept (his rewrites, this screen first):"]
    for b in bank[:limit]:
        lines += [f"  was: {b['old']}", f"  now: {b['new']}"]
    if not bank:
        lines.append("  (none yet: no sitting has kept a line for this screen)")
    return "\n".join(lines)


def main(argv):
    gate = voice_gate.Gate()
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__); return 0
    if argv[0] == "--list":
        print("\n".join(sorted(gate.screens))); return 0
    if argv[0] not in gate.screens:
        print(f"voice-packet: no screen {argv[0]!r} in content/voice/screens.yaml. Screens: {', '.join(sorted(gate.screens))}")
        return 2
    print(packet(gate, argv[0]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
