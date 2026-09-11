# cmpall.py A.tsv B.tsv -- per instrument: sites per file:line in A and B; lists every location
# whose count ROSE, and every (location, sentence) lost or gained.
import sys, collections
def load(p):
    d = collections.defaultdict(collections.Counter)
    for ln in open(p, encoding="utf-8"):
        if ln.count("\t") >= 2:
            i, loc, key = ln.rstrip("\n").split("\t", 2)
            d[i][(loc, key)] += 1
    return d
A, B = load(sys.argv[1]), load(sys.argv[2])
show = "-v" in sys.argv
for i in "trailing_and fragment telling polysyndeton slop_shapes light_verb".split():
    a, b = A[i], B[i]
    la, lb = collections.Counter(), collections.Counter()
    for (loc, _k), n in a.items(): la[loc] += n
    for (loc, _k), n in b.items(): lb[loc] += n
    rose = sorted(loc for loc in lb if lb[loc] > la[loc])
    lost, gained = a - b, b - a
    print("%-13s %4d -> %4d   locations that rose: %d   sites lost %d, gained %d"
          % (i, sum(a.values()), sum(b.values()), len(rose), sum(lost.values()), sum(gained.values())))
    for loc in rose: print("     ROSE %s  %d -> %d" % (loc, la[loc], lb[loc]))
    if show:
        for (loc, k), n in sorted(gained.items()): print("     + %s  %s" % (loc, k[:120]))
