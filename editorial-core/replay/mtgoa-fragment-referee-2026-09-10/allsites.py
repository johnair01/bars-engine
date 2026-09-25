# allsites.py PROJECT OUT.tsv -- EVERY site of the six zero-target scanners, accepted or not,
# repeats included. `--keys` dedupes by sentence text and skips accepted hits, so a per-location
# comparison built on it cannot see a repeated sentence turning up somewhere new.
import sys, os, io, importlib.util, contextlib
P, OUT = sys.argv[1], sys.argv[2]
os.chdir(P)
rows = []
for name in "trailing_and fragment telling polysyndeton slop_shapes light_verb".split():
    sys.argv = [name]
    spec = importlib.util.spec_from_file_location(name, os.path.join(P, "instruments", name + ".py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    def emit(_n, pairs, name=name):
        for loc, key in pairs:
            rows.append("%s\t%s\t%s" % (name, loc, " ".join(str(key).split())))
        return 0
    mod.exc.emit_keys = emit
    sys.argv = [name, "--keys"]
    with contextlib.redirect_stdout(io.StringIO()):
        mod.main()
io.open(OUT, "w", encoding="utf-8").write("\n".join(rows) + "\n")
import collections
print(OUT.split("/")[-1], dict(collections.Counter(r.split("\t")[0] for r in rows)))
