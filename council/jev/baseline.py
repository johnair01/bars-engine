#!/usr/bin/env python3
"""Deterministic baseline for the Jev quote-to-claim trial (spec Phase 1). No model is called.

Usage: python3 council/jev/baseline.py --fuzzy-threshold X --overlap-threshold Y [--file FILE] [--no-fetch]

For each pair it records:
  in_page_exact  the quote appears word for word on the cited page after normalising whitespace, quotes, backticks
  in_page_fuzzy  best difflib ratio of the quote against a sliding window of the page
  term_overlap   Jaccard overlap of lowercased content words in claim and quote
  flag           "read" if the pair is not in the page (exact false and fuzzy below --fuzzy-threshold)
                 or term_overlap is below --overlap-threshold; otherwise "ok"
The two thresholds are required. They are Wendell's numbers: the spec leaves sample size, threshold and
pass mark unset and his, and this script bakes in no default. Pages are cached in council/jev/cache/ by
a hash of the URL. A page that cannot be fetched is recorded as in_page_exact null and never fails the run.
"""
import difflib
import hashlib
import json
import os
import re
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(HERE, "labelled.json")
CACHE = os.path.join(HERE, "cache")

STOP = set("""a an the and or but if of to in on at by for with from as is are was were be been being it its this that these
those i we you he she they them his her their our your not no do does did done has have had can could will would should
may might must than then so such into about over under per via also which who whom what when where while there here
only just more most other some any each both all very""".split())

LABEL_MAP = {"yes": "match", "supports": "match", "no": "mismatch", "contradicts": "mismatch",
             "says_nothing": "mismatch"}


def normalise(text):
    text = text.replace("‘", "'").replace("’", "'").replace("“", '"').replace("”", '"')
    text = text.replace("`", "").replace('"', "").replace("'", "")
    return re.sub(r"\s+", " ", text).strip().lower()


def content_words(text):
    return {w for w in re.findall(r"[a-z0-9]+", text.lower()) if w not in STOP and len(w) > 1}


def term_overlap(claim, quote):
    a, b = content_words(claim), content_words(quote)
    return len(a & b) / len(a | b) if (a | b) else 0.0


def exact_in_page(quote, page):
    return normalise(quote) in normalise(page)


def fuzzy_in_page(quote, page):
    """Best difflib ratio of the quote over a sliding word window of the page."""
    q = normalise(quote).split()
    p = normalise(page).split()
    if not q or not p:
        return 0.0
    qs = " ".join(q)
    w = len(q)
    if w >= len(p):
        return difflib.SequenceMatcher(None, qs, " ".join(p)).ratio()
    best = 0.0
    step = max(1, w // 4)
    for i in range(0, len(p) - w + 1, step):
        r = difflib.SequenceMatcher(None, qs, " ".join(p[i:i + w])).ratio()
        if r > best:
            best = r
            if best == 1.0:
                break
    return best


def fetch(url, cache_dir=CACHE, fetcher=None):
    """Return page text or None. Cached by sha256 of the URL."""
    if not url:
        return None
    os.makedirs(cache_dir, exist_ok=True)
    path = os.path.join(cache_dir, hashlib.sha256(url.encode()).hexdigest() + ".txt")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return f.read()
    try:
        if fetcher:
            text = fetcher(url)
        else:
            req = urllib.request.Request(url, headers={"User-Agent": "council-jev-baseline/1"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                text = resp.read().decode("utf-8", errors="replace")
    except Exception as e:  # fail soft
        print(f"  could not fetch {url}: {e}", file=sys.stderr)
        return None
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    return text


def score_row(row, page, fuzzy_t, overlap_t):
    if page is None:
        exact, fuzzy = None, None
    else:
        exact = exact_in_page(row["quote"], page)
        fuzzy = 1.0 if exact else round(fuzzy_in_page(row["quote"], page), 4)
    ov = round(term_overlap(row["claim"], row["quote"]), 4)
    not_in_page = exact is False and fuzzy < fuzzy_t
    flag = "read" if (not_in_page or ov < overlap_t) else "ok"
    return {"id": row["id"], "kind": row.get("kind", "real"), "in_page_exact": exact,
            "in_page_fuzzy": fuzzy, "term_overlap": ov, "flag": flag}


def agreement(results, rows_by_id):
    """Per kind: how often the flag agrees with a person's or construction's label. Returns dict kind -> stats or None."""
    out = {}
    for kind in ("real", "constructed"):
        n = agree = 0
        for r in results:
            if r["kind"] != kind:
                continue
            truth = LABEL_MAP.get(rows_by_id[r["id"]].get("label"))
            if truth is None:
                continue
            n += 1
            agree += (r["flag"] == "read") == (truth == "mismatch")
        out[kind] = {"labelled": n, "agree": agree} if n else None
    return out


def main(argv):
    def opt(name, default=None):
        return argv[argv.index(name) + 1] if name in argv else default
    if not opt("--fuzzy-threshold") or not opt("--overlap-threshold"):
        print(__doc__)
        print("ERROR: --fuzzy-threshold and --overlap-threshold are required. They are Wendell's numbers.")
        return 2
    fuzzy_t, overlap_t = float(opt("--fuzzy-threshold")), float(opt("--overlap-threshold"))
    with open(opt("--file", FILE), encoding="utf-8") as f:
        rows = json.load(f)
    print(f"Thresholds in use: fuzzy {fuzzy_t}, overlap {overlap_t}. These are Wendell's numbers: the spec leaves "
          "sample size, threshold and pass mark unset and his.")
    pages = {}
    results = []
    for r in rows:
        u = r.get("source_url")
        if u not in pages:
            pages[u] = None if "--no-fetch" in argv else fetch(u)
        results.append(score_row(r, pages[u], fuzzy_t, overlap_t))
    by_id = {r["id"]: r for r in rows}
    print(f"{'id':44} {'kind':12} {'exact':6} {'fuzzy':7} {'overlap':8} flag")
    for r in results:
        print(f"{r['id']:44} {r['kind']:12} {str(r['in_page_exact']):6} {str(r['in_page_fuzzy']):7} "
              f"{r['term_overlap']:<8} {r['flag']}")
    ag = agreement(results, by_id)
    if ag["real"] is None:
        print("\nBaseline cannot be scored on real pairs: no real row has a label of yes/no/supports/contradicts/"
              "says_nothing. Labels come from a person, and none has been set.")
    else:
        print(f"\nReal pairs: {ag['real']['agree']} of {ag['real']['labelled']} labelled rows agree with the flag.")
    if ag["constructed"] is None:
        print("Constructed pairs: none present.")
    else:
        print(f"Constructed pairs (reported separately, never counted toward the pass): "
              f"{ag['constructed']['agree']} of {ag['constructed']['labelled']} flagged as read.")
    out = os.path.join(HERE, "baseline_results.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
        f.write("\n")
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
