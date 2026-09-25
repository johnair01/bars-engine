# fragdump.py PROJECT OUT.tsv -- every fragment.py hit, full sentence, with class and location.
import sys, os, importlib.util, io
P, OUT = sys.argv[1], sys.argv[2]
sys.argv = ["fragment"]
spec = importlib.util.spec_from_file_location("fragment", os.path.join(P, "instruments", "fragment.py"))
fr = importlib.util.module_from_spec(spec); spec.loader.exec_module(fr)
pos_tag, word_tokenize = fr.dn.tagger()
lines = fr.dl.paragraphs([l for l in fr.fl.surfaces() if not fr.dl.is_apparatus(l["text"])])
lex = fr.verb_lexicon(lines, pos_tag, word_tokenize)
rows = []
for l in lines:
    if any(e in l["rel"] for e in fr.EXEMPT_SURFACE):
        continue
    for kind, n, st in fr.sites(l["text"], lex, pos_tag, word_tokenize):
        rows.append("%s\t%s:%d\t%d\t%s\t%s" % (kind, l["rel"], l["line"], n,
                    "boxed" if "boxed" in l.get("tags", ()) or l.get("boxed") else "", st))
io.open(OUT, "w", encoding="utf-8").write("\n".join(rows) + "\n")
print(len(rows), "hits;", len(lex), "lexicon words")
