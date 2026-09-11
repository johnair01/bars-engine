# ledg.py FILE "reason" SEL [SEL ...] — accept trailing_and sites in FILE through ledger.py.
# SEL is a LINE number (`32` or `L32`), which is stable across calls — the list index was not,
# and renumbered after every accept. `L16#2` picks the second site on line 16.
import sys, subprocess, os, collections
os.chdir("/Users/wendellbritt/The Library/mtgoa-manuscript")
S = os.path.dirname(os.path.abspath(__file__))
f, reason = sys.argv[1], sys.argv[2]
rows = [r.split("\t") for r in subprocess.run(
    [sys.executable, os.path.join(S, "work.py"), f], capture_output=True, text=True).stdout.splitlines() if r]
byline = collections.defaultdict(list)
for n, loc, key in rows:
    byline[loc].append(key)
pick = []
for sel in sys.argv[3:]:
    sel = sel if sel.startswith("L") else "L" + sel
    line, _, idx = sel.partition("#")
    keys = byline.get(line, [])
    if not keys:
        sys.exit("no unaccepted site on %s %s" % (f, line))
    pick += [(line, keys[int(idx) - 1])] if idx else [(line, k) for k in keys]
tsv = os.path.join(S, "_accept.tsv")
with open(tsv, "w", encoding="utf-8") as fh:
    for line, key in pick:
        fh.write("%s:%s\t%s\n" % (f, line[1:], key))
        print("  ledger %s:%s  %s" % (f, line[1:], key[:90]))
r = subprocess.run([sys.executable, "instruments/ledger.py", "accept", "trailing_and", "--file", tsv,
                    "--reason", reason], capture_output=True, text=True)
print(r.stdout.strip(), r.stderr.strip())
