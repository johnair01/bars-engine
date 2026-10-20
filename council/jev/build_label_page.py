#!/usr/bin/env python3
"""Build the asset statement labelling page: council/jev/label_page.html.

Usage: python3 council/jev/build_label_page.py
Reads council/jev/asset_statements.json, keeps the 20 'asset-admin' rows (Wendell's ruling on jev-asset-piles,
option C), pulls a few lines of code around each referenced line, and embeds both in one page. It carries no
'note' or 'known_drift' field and no verdict. Spec: .specify/specs/jev-asset-labelling-page/spec.md
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
rows = [r for r in json.load(open(ROOT / "council/jev/asset_statements.json")) if r["scope"] == "asset-admin"]


def snippets(refs):
    by = {}
    for ref in refs:
        path, _, line = ref.rpartition(":")
        by.setdefault(path, []).append(int(line))
    out = []
    for path, lines in by.items():
        src = (ROOT / path).read_text(encoding="utf-8", errors="replace").splitlines()
        spans = []
        for n in sorted(set(lines)):
            a, b = max(1, n - 2), min(len(src), n + 4)
            if spans and a <= spans[-1][1] + 1:
                spans[-1][1] = max(spans[-1][1], b)
            else:
                spans.append([a, b])
        for a, b in spans[:2]:
            b = min(b, a + 13)
            out.append({"path": path, "from": a, "to": b, "marked": [n for n in lines if a <= n <= b],
                        "text": "\n".join(src[a - 1:b])})
    return out


cards = []
for r in rows:
    cards.append({"id": r["id"], "doc": r["doc"], "line": r["line"], "statement": r["statement"],
                  "code": snippets(r["code_refs"])})
data = json.dumps(cards, ensure_ascii=False).replace("</", "<\\/")
html = (ROOT / "council/jev/label_page_template.html").read_text(encoding="utf-8").replace("__CARDS__", data)
(ROOT / "council/jev/label_page.html").write_text(html, encoding="utf-8")
print(f"wrote council/jev/label_page.html with {len(cards)} cards, {sum(len(c['code']) for c in cards)} code excerpts")
