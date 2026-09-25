# apply.py PATH EDITS.py — EDITS.py defines E = [(old, new[, count])]. Atomic: every old must
# occur exactly `count` times (default 1) in the CURRENT text, or nothing is written.
import sys, io, runpy
path, edits = sys.argv[1], runpy.run_path(sys.argv[2])["E"]
text = io.open(path, encoding="utf-8").read()
bad = []
for e in edits:
    old, new = e[0], e[1]
    want = e[2] if len(e) > 2 else 1
    c = text.count(old)
    if c != want:
        bad.append((c, want, old[:90]))
if bad:
    for c, w, o in bad:
        print("ABORT found %d want %d: %s" % (c, w, o))
    sys.exit(1)
for e in edits:
    text = text.replace(e[0], e[1])
io.open(path, "w", encoding="utf-8").write(text)
print("applied %d edits to %s" % (len(edits), path))
