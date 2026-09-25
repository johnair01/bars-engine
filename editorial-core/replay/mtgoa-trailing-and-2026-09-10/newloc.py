# newloc.py INST... — per-location hit counts, now vs the original-prose shadow project.
# Lines never shift under these edits (one paragraph per line), so a location whose count
# ROSE is a hit the pass introduced; one that fell is a hit it removed.
import subprocess, sys, os, collections
S = os.path.dirname(os.path.abspath(__file__))
LIVE = "/Users/wendellbritt/The Library/mtgoa-manuscript"
def keys(root, inst):
    r = subprocess.run([sys.executable, "instruments/%s.py" % inst, "--keys"], cwd=root, capture_output=True, text=True)
    c = collections.Counter(); k = collections.defaultdict(list)
    for l in r.stdout.splitlines():
        if "\t" in l:
            loc, key = l.split("\t", 1); c[loc] += 1; k[loc].append(key)
    return c, k
for inst in sys.argv[1:]:
    c0, _ = keys(os.path.join(S, "orig_proj"), inst)
    c1, k1 = keys(LIVE, inst)
    for loc in sorted(c1):
        if c1[loc] > c0.get(loc, 0):
            print("ROSE %-12s %-22s %d->%d  %s" % (inst, loc, c0.get(loc, 0), c1[loc], " | ".join(x[:80] for x in k1[loc])))
