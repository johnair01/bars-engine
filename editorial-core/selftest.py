#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
selftest.py — install the core into a throwaway project and prove it works. Run it yourself.

    python3 editorial-core/selftest.py           # verdict only
    python3 editorial-core/selftest.py -v        # plus the full board and every assertion

## Why this exists

**Wendell, 2026-09-09:** *"I can't prove this actually did anything. I have to take your word for
it."*

He was right, and about the worst possible claim to have to take on trust: I had said the cold
install worked and that the board caught planted defects. The evidence was a transcript of me
running commands. **A pipeline whose whole argument is "counts repeat and readings do not" cannot
have an install story that rests on someone's report of a count.**

So this file makes the claim executable. It builds a project from nothing, plants prose with known
defects in it, runs the board, and checks the board found exactly those and nothing else. It prints
one line per assertion and exits non-zero if any fail. Nobody has to believe a summary.

## What it proves, and what it does not

It proves the **install** is correct and the **wiring** is live: that a fresh project's checks
actually run rather than reporting `n/a`, that each targeted scanner fires on its own defect, that
the ledger silences a hit when you accept one, and that clean prose comes back clean.

It does not prove any scanner's judgement is good. That is what the measured thresholds in each
module's docstring are for.
"""
import io, os, re, sys, shutil, tempfile, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
VERBOSE = "-v" in sys.argv

# Prose with one defect of each targeted class, and nothing else. Every line is chosen so that
# exactly one scanner fires on it: a fixture tripping two makes a failure ambiguous.
#
# The gate line is sentence-initial `And`, deliberately. The first version used a banned WORD,
# which passed only because the core shipped another book's vocabulary as its default. When that
# leak was fixed the fixture went green-to-red and said so, which is the test doing its job.
DEFECTIVE = """\
He walked to the door and he opened it and the room was empty.
And then the door closed behind him.
She reached the landing, and the door was already open.
It was a disaster.
She made a decision about the route.
Every room.
The mountain is cheaper than the table because it is not the table.

Three exchanges at minimum.
"""
# `Three exchanges at minimum.` (v32): a plural noun whose singular is also a verb. The gate counter
# fragment.py replaced read every -s word as a verb and passed it; this one must not.

# The same passage with every defect repaired. If ANY scanner fires on this, it has a false
# positive and the negative test says so — which is the half of a self-test that usually gets left
# out, and the half that catches an over-eager regex.
CLEAN = """\
He walked to the door. He opened it. The room was empty.
Then the door closed behind him.
She reached the landing. The door stood open already.
The folder hit the desk hard enough to slide.
She chose the northern route.
She crossed every room to reach it.
The mountain costs less than the guide who takes you up it.
That is why the room went quiet, and why the answer is a better map.
She wrote it in pencil, and not in this ink.
If the door sticks, and if nobody is home, the key is under the mat.
I'm here, with you.

**The method:**

<!-- SECTION 1 -->

There's a lamp by the door.

Your chest tightens.

Hand over the pen.
"""
# The last five paragraphs are fragment.py's v32 false positives, one per class: a label in
# emphasis, a section comment, `'s` after a pronoun, a verb the tagger only ever calls a noun, and a
# phrasal imperative. Each fired before v32. Kept as paragraphs so no two of them join.

EXPECT = [
    ("gate",         "sentence-initial And — a rule that needs no project vocabulary"),
    ("trailing_and", "comma, coordinating conjunction, second independent clause"),
    ("polysyndeton", "bare `X and Y and Z`, no comma"),
    ("fragment",     "a sentence with no verb"),
    ("telling",      "a labelled abstraction: It was a <noun>"),
    ("light_verb",   "made a decision, rather than decided"),
]

results = []


def check(ok, label, detail=""):
    results.append((ok, label, detail))
    print("  %s  %s%s" % ("PASS" if ok else "FAIL", label, ("  — " + detail) if detail else ""))
    return ok


def board(cwd):
    r = subprocess.run([sys.executable, os.path.join(cwd, "instruments", "coherence.py")],
                       cwd=cwd, capture_output=True, text=True)
    return r.stdout + r.stderr


def unresolved(text, name):
    m = re.search(r"\[zero\]\s+%s:\s+(\d+)\s+unresolved" % re.escape(name), text)
    return int(m.group(1)) if m else 0


def main():
    tmp = tempfile.mkdtemp(prefix="editorial-selftest-")
    try:
        proj = os.path.join(tmp, "book")
        os.makedirs(os.path.join(proj, "chapters"))
        with io.open(os.path.join(proj, "chapters", "chapter-01.md"), "w", encoding="utf-8") as fh:
            fh.write("---\ntitle: Fixture\n---\n## Chapter Text\n\n" + DEFECTIVE + "\n## Notes\nScratch.\n")

        print("editorial-core selftest — installing v%s into a throwaway project\n"
              % io.open(os.path.join(HERE, "VERSION"), encoding="utf-8").read().strip())

        r = subprocess.run([sys.executable, os.path.join(HERE, "init_project.py"), proj,
                            "--name", "Selftest", "--prose-section", "## Chapter Text", "## Notes"],
                           capture_output=True, text=True)
        if VERBOSE:
            print(r.stdout)
        check(os.path.exists(os.path.join(proj, "editorial.yaml")), "installer wrote editorial.yaml")
        check(os.path.exists(os.path.join(proj, "instruments", "review.py")),
              "review.py landed in instruments/", "coherence resolves it relative to itself")

        out = board(proj)
        if VERBOSE:
            print(out)

        # 1. THE CHECKS ARE ACTUALLY RUNNING. This is the assertion that would have caught the
        #    install bug: three checks reported `n/a` and looked like a clean board.
        for name in ("wiring", "orphan", "core", "ledger", "gates"):
            m = re.search(r"^\s+%s\s+(\S+)" % re.escape(name), out, re.M)
            got = m.group(1) if m else "MISSING"
            check(got in ("ok", "FAIL", "LOOK"), "check `%s` is live" % name,
                  "reads %s" % got)

        # 2. EACH TARGETED SCANNER FIRES ON ITS OWN DEFECT.
        for name, what in EXPECT:
            check(unresolved(out, name) >= 1, "%s fires" % name, what)
        check(unresolved(out, "fragment") == 2, "a plural noun is not a verb (v32)",
              "fragment reads %d of 2: `Every room.`, `Three exchanges at minimum.`"
              % unresolved(out, "fragment"))

        # 3. THE LEDGER SILENCES A HIT. Accept the polysyndeton sentence; the count must drop.
        before = unresolved(out, "polysyndeton")
        led = os.path.join(proj, "editorial_exceptions.yaml")
        y = io.open(led, encoding="utf-8").read().replace(
            "polysyndeton: []",
            'polysyndeton:\n  - quote: "He walked to the door and he opened it and the room was empty."\n'
            '    reason: "selftest fixture"')
        io.open(led, "w", encoding="utf-8").write(y)
        after = unresolved(board(proj), "polysyndeton")
        check(after == before - 1, "ledger acceptance silences one hit",
              "%d -> %d unresolved" % (before, after))

        # 4. CLEAN PROSE COMES BACK CLEAN. The negative test.
        with io.open(os.path.join(proj, "chapters", "chapter-01.md"), "w", encoding="utf-8") as fh:
            fh.write("---\ntitle: Fixture\n---\n## Chapter Text\n\n" + CLEAN + "\n## Notes\nScratch.\n")
        io.open(led, "w", encoding="utf-8").write(
            io.open(led, encoding="utf-8").read().replace(y[y.index("polysyndeton:"):], "polysyndeton: []\n"))
        out2 = board(proj)
        if VERBOSE:
            print(out2)
        noisy = [n for n, _ in EXPECT if unresolved(out2, n) > 0]
        check(not noisy, "repaired prose is clean on every scanner",
              ("still firing: " + ", ".join(noisy)) if noisy else "no false positives")

        # 5. A CORRUPT LEDGER IS CAUGHT. The 2026-09-09 incident: a broken exceptions file was
        #    read as an empty one and the board reported `ledger ok clean` over a dead ledger.
        good = io.open(led, encoding="utf-8").read()
        io.open(led, "a", encoding="utf-8").write("\n  - this: [is\n")
        broke = board(proj)
        m = re.search(r"^\s+readable\s+(\S+)", broke, re.M)
        check(bool(m) and m.group(1) == "FAIL", "a corrupt ledger fails the board",
              "reads %s" % (m.group(1) if m else "MISSING"))
        io.open(led, "w", encoding="utf-8").write(good)
        m = re.search(r"^\s+readable\s+(\S+)", board(proj), re.M)
        check(bool(m) and m.group(1) == "ok", "and passes again once repaired")

        # 6. THE LEDGER WRITER REFUSES TO CORRUPT. ledger.py parses, mutates and round-trips.
        r = subprocess.run([sys.executable, os.path.join(proj, "instruments", "ledger.py"),
                            "accept", "gate", "--quote", "And then the door closed behind him.",
                            "--reason", "selftest"], cwd=proj, capture_output=True, text=True)
        ok = subprocess.run([sys.executable, os.path.join(proj, "instruments", "ledger.py"),
                             "check"], cwd=proj, capture_output=True, text=True)
        check("parses" in ok.stdout, "ledger.py writes a file that still parses",
              r.stdout.strip().split("\n")[-1] if r.stdout.strip() else "")

        # 8. EVERY --keys LOCATION IS file:line. fragment.py emitted the raw line dict as its
        #    location until v23, which broke `ledger.py accept fragment --site`.
        with io.open(os.path.join(proj, "chapters", "chapter-01.md"), "w", encoding="utf-8") as fh:
            fh.write("---\ntitle: Fixture\n---\n## Chapter Text\n\n" + DEFECTIVE + "\n## Notes\nScratch.\n")
        badloc = []
        for name, _ in EXPECT:
            if name == "gate":
                continue
            r = subprocess.run([sys.executable, os.path.join(proj, "instruments", name + ".py"),
                                "--keys"], cwd=proj, capture_output=True, text=True)
            rows = [l for l in r.stdout.splitlines() if "\t" in l]
            badloc += ["%s: %s" % (name, l.split("\t")[0][:40]) for l in rows
                       if not re.match(r"^[^\t:]+\.md:\d+$", l.split("\t")[0])]
            if not rows:
                badloc.append("%s: no keys emitted" % name)
        check(not badloc, "every --keys location reads file:line", "; ".join(badloc[:3]))

        # 9. A SCORED FRAME IS READ, AN UNSCORED ONE IS NOT (v29). Boxed records at MTGOA are
        #    scored and ledgered as notes; everything else in a frame stays the margin.
        box = ("<!-- HANDBOOK -->\n> She reached the landing, and the stair was already dark.\n"
               "<!-- /HANDBOOK -->\n")
        with io.open(os.path.join(proj, "chapters", "chapter-01.md"), "w", encoding="utf-8") as fh:
            fh.write("---\ntitle: Fixture\n---\n## Chapter Text\n\n" + CLEAN + "\n" + box + "\n## Notes\nScratch.\n")
        man = os.path.join(proj, "editorial.yaml")
        base_manifest = io.open(man, encoding="utf-8").read()
        unscored = unresolved(board(proj), "trailing_and")
        io.open(man, "w", encoding="utf-8").write(base_manifest + "\nscored_frames: [HANDBOOK]\n")
        scored = unresolved(board(proj), "trailing_and")
        io.open(man, "w", encoding="utf-8").write(base_manifest)
        check(unscored == 0 and scored == 1, "a scored frame is read, an unscored one is not",
              "trailing_and %d unscored -> %d scored" % (unscored, scored))

        # 10. A DEAD LEDGER ENTRY IS CAUGHT EVEN WHEN ANOTHER ENTRY COVERS SEVERAL HITS (v30).
        #     One live entry accepts a sentence that appears twice; one entry matches nothing.
        #     The old check compared 2 entries with 2 accepted hits and read clean.
        twice = "He walked to the door and he opened it and the room was empty."
        with io.open(os.path.join(proj, "chapters", "chapter-01.md"), "w", encoding="utf-8") as fh:
            fh.write("---\ntitle: Fixture\n---\n## Chapter Text\n\n" + CLEAN + "\n" + twice +
                     "\n\nA later paragraph.\n\n" + twice + "\n\n## Notes\nScratch.\n")
        led = os.path.join(proj, "editorial_exceptions.yaml")
        keep = io.open(led, encoding="utf-8").read()
        io.open(led, "w", encoding="utf-8").write(keep.replace("polysyndeton: []",
            'polysyndeton:\n  - quote: "%s"\n    reason: selftest\n'
            '  - quote: "A sentence that is nowhere in the book and and and."\n    reason: dead' % twice))
        m = re.search(r"^\s+ledger\s+(\S+)", board(proj), re.M)
        io.open(led, "w", encoding="utf-8").write(keep)
        check(bool(m) and m.group(1) == "LOOK", "a dead ledger entry is caught under a multi-hit entry",
              "ledger reads %s" % (m.group(1) if m else "MISSING"))

        # 11. THE LEDGER WRITER REFUSES TO EMPTY AN INSTRUMENT BY ACCIDENT (v31).
        r = subprocess.run([sys.executable, "-c",
            "import sys; sys.argv=['x']; sys.path.insert(0,'instruments'); import ledger\n"
            "for i in range(6): ledger.accept('telling', 'Fixture sentence %d is a label.' % i, 'selftest')\n"
            "d = ledger.load(); d['telling'] = []\n"
            "try:\n    ledger.save(d); print('WROTE')\nexcept ValueError: print('REFUSED')\n"
            "d['telling'] = []; ledger.save(d, allow_mass_removal=True)"],
            cwd=proj, capture_output=True, text=True)
        check("REFUSED" in r.stdout, "the ledger writer refuses to empty an instrument by accident",
              (r.stdout.strip() or r.stderr.strip())[:80])

        # 12. A LINE THE PROJECT'S BUILD DROPS IS NOT SCANNED (v32). A provenance line carrying a
        #     trailing_and is counted until build_book.py declares it with `nonprinting(lines)`.
        status = "**Status:** She reached the landing, and the door was already open.\n"
        with io.open(os.path.join(proj, "chapters", "chapter-01.md"), "w", encoding="utf-8") as fh:
            fh.write("---\ntitle: Fixture\n---\n## Chapter Text\n\n" + CLEAN + "\n" + status +
                     "\n## Notes\nScratch.\n")
        bbp = os.path.join(proj, "instruments", "build_book.py")
        bb_src = io.open(bbp, encoding="utf-8").read()
        scanned = unresolved(board(proj), "trailing_and")
        io.open(bbp, "w", encoding="utf-8").write(bb_src + (
            "\n\ndef nonprinting(lines):\n"
            "    return {i for i, l in enumerate(lines) if l.startswith('**Status:**')}\n"))
        dropped = unresolved(board(proj), "trailing_and")
        io.open(bbp, "w", encoding="utf-8").write(bb_src)
        check(scanned == 1 and dropped == 0, "a line the build declares non-printing is not scanned",
              "trailing_and %d without the hook -> %d with it" % (scanned, dropped))

        # 7. THE APPARATUS IS NOT SCANNED. Front matter and the Notes section are in the fixture.
        check("title: Fixture" not in out2 and "Scratch" not in out2,
              "front matter and Notes are out of the corpus",
              "prose_section and the front-matter strip")

        bad = sum(1 for ok, _, _ in results if not ok)
        print("\n%s — %d/%d assertions passed"
              % ("SELFTEST PASS" if not bad else "SELFTEST FAIL", len(results) - bad, len(results)))
        if not bad:
            print("The install is correct, every check is live, each scanner fires on its own")
            print("defect, the ledger silences a hit, and repaired prose comes back clean.")
        return 1 if bad else 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
