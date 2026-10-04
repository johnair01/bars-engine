#!/usr/bin/env python3
"""Validate council/jev/asset_statements.json.

Checks the structure and the quoting of every row. It never judges whether a
statement is right; it only checks that the row is well formed, that the quoted
text is really in the doc, and that the code references point at real lines.

Usage: python3 council/jev/validate_statements.py [path/to/asset_statements.json]
Exit code 0 when every check passes, 1 otherwise. Standard library only.
"""
import collections
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_JSON = Path(__file__).resolve().parent / "asset_statements.json"

KINDS = {"numeric", "naming", "path", "schema", "process", "other"}
SCOPES = {"asset-admin", "sprite-current", "sprite-pre-august", "card-art-deprecated", "carousel"}
DRIFTS = {None, "a", "b", "c", "d", "e"}
REQUIRED = ["id", "doc", "line", "statement", "kind", "scope", "code_refs",
            "checkable", "known_drift", "label", "note"]
NOTE_BANNED = ["agrees", "disagrees", "drift", "mismatch", "contradict", "wrong", "stale"]
LINE_TOLERANCE = 3
AUGUST_CUTOFF = "2026-08-01"

_cache = {}


def norm(text):
    return re.sub(r"\s+", " ", text).strip()


def strip_emphasis(text):
    return text.replace("*", "").replace("`", "")


def read_file(root, rel):
    key = (str(root), rel)
    if key not in _cache:
        path = Path(root) / rel
        _cache[key] = path.read_text(encoding="utf-8") if path.is_file() else None
    return _cache[key]


def line_count(text):
    return text.count("\n") + (0 if text.endswith("\n") or text == "" else 1)


def normalised_with_lines(text):
    """Return (normalised text, list giving the 1-based source line of each char)."""
    out, lines = [], []
    prev_space, line = True, 1
    for ch in text:
        if ch.isspace():
            if not prev_space:
                out.append(" ")
                lines.append(line)
            prev_space = True
        else:
            out.append(ch)
            lines.append(line)
            prev_space = False
        if ch == "\n":
            line += 1
    return "".join(out), lines


def statement_lines(text, statement):
    """Source lines where the statement starts, strict match first, then emphasis-tolerant."""
    nt, lines = normalised_with_lines(text)
    target = norm(statement)
    found = []
    start = 0
    while target and True:
        i = nt.find(target, start)
        if i < 0:
            break
        found.append(lines[i])
        start = i + 1
    if found:
        return found
    # Tolerate markdown emphasis characters on either side.
    nt2, lines2 = [], []
    for ch, ln in zip(nt, lines):
        if ch not in "*`":
            nt2.append(ch)
            lines2.append(ln)
    nt2 = "".join(nt2)
    target2 = strip_emphasis(target)
    start = 0
    while target2:
        i = nt2.find(target2, start)
        if i < 0:
            break
        found.append(lines2[i])
        start = i + 1
    return found


def git_last_date(root, rel):
    try:
        out = subprocess.run(["git", "log", "-1", "--format=%as", "--", rel],
                             cwd=root, capture_output=True, text=True, timeout=20)
        value = out.stdout.strip()
        return value or None
    except Exception:
        return None


def validate(rows, root=ROOT, check_git=True):
    failures = []

    def fail(row, msg):
        failures.append(f"{row.get('id', '?')}: {msg}")

    if not isinstance(rows, list):
        return ["top level of the JSON must be a list"]

    seen_ids = set()
    prev_key = None
    git_dates = {}
    for row in rows:
        missing = [k for k in REQUIRED if k not in row]
        if missing:
            fail(row, f"missing fields {missing}")
            continue
        rid = row["id"]
        if not re.fullmatch(r"AS-\d{3,}", str(rid)):
            fail(row, "id does not look like AS-001")
        if rid in seen_ids:
            fail(row, "duplicate id")
        seen_ids.add(rid)

        if row["label"] != "unlabelled":
            fail(row, f"label is {row['label']!r}, it must be 'unlabelled'")
        if row["kind"] not in KINDS:
            fail(row, f"kind {row['kind']!r} is not allowed")
        if row["scope"] not in SCOPES:
            fail(row, f"scope {row['scope']!r} is not allowed")
        if row["known_drift"] not in DRIFTS:
            fail(row, f"known_drift {row['known_drift']!r} is not allowed")
        if not isinstance(row["code_refs"], list):
            fail(row, "code_refs must be a list")
            continue
        if not isinstance(row["checkable"], bool):
            fail(row, "checkable must be true or false")
        if not row["code_refs"] and row["checkable"] is not False:
            fail(row, "checkable must be false when code_refs is empty")
        if row["code_refs"] and row["checkable"] is not True:
            fail(row, "checkable must be true when code_refs is present")

        note = row.get("note") or ""
        low = note.lower()
        for word in NOTE_BANNED:
            if word in low:
                fail(row, f"note contains the banned word {word!r}")

        # Doc, line and verbatim quote.
        text = read_file(root, row["doc"])
        if text is None:
            fail(row, f"doc {row['doc']} does not exist")
        else:
            total = line_count(text)
            if not isinstance(row["line"], int) or not (1 <= row["line"] <= total):
                fail(row, f"line {row['line']} is outside {row['doc']} (1..{total})")
            else:
                starts = statement_lines(text, row["statement"])
                if not starts:
                    fail(row, "statement is not found verbatim in the doc")
                elif not any(abs(s - row["line"]) <= LINE_TOLERANCE for s in starts):
                    fail(row, f"statement starts at line(s) {starts}, not near line {row['line']}")
            if check_git and row["scope"] in ("sprite-current", "sprite-pre-august"):
                if row["doc"] not in git_dates:
                    git_dates[row["doc"]] = git_last_date(root, row["doc"])
                date = git_dates[row["doc"]]
                if date:
                    expected = "sprite-pre-august" if date < AUGUST_CUTOFF else "sprite-current"
                    if row["scope"] != expected:
                        fail(row, f"scope is {row['scope']} but the doc was last changed {date}")

        # Code references.
        for ref in row["code_refs"]:
            if not isinstance(ref, str) or ":" not in ref:
                fail(row, f"code_ref {ref!r} is not path:line")
                continue
            path, _, ln = ref.rpartition(":")
            body = read_file(root, path)
            if body is None:
                fail(row, f"code_ref path {path} does not exist")
                continue
            if not ln.isdigit() or not (1 <= int(ln) <= line_count(body)):
                fail(row, f"code_ref line {ln} is outside {path} (1..{line_count(body)})")

        key = (row["doc"], row["line"] if isinstance(row["line"], int) else 0)
        if prev_key is not None and key < prev_key:
            fail(row, "rows are not ordered by doc then line")
        prev_key = key
    return failures


def main(argv):
    path = Path(argv[1]) if len(argv) > 1 else DEFAULT_JSON
    rows = json.loads(path.read_text(encoding="utf-8"))
    failures = validate(rows)
    print(f"{len(rows)} rows in {path.name}")
    print("\nRows per doc:")
    for doc, n in sorted(collections.Counter(r["doc"] for r in rows).items()):
        print(f"  {n:4d}  {doc}")
    print("\nRows per scope:")
    for scope, n in sorted(collections.Counter(r["scope"] for r in rows).items()):
        print(f"  {n:4d}  {scope}")
    print("\nRows per kind:")
    for kind, n in sorted(collections.Counter(r["kind"] for r in rows).items()):
        print(f"  {n:4d}  {kind}")
    print(f"\nCheckable rows: {sum(1 for r in rows if r.get('checkable'))} of {len(rows)}")
    print(f"Rows tagged with a known drift: {sum(1 for r in rows if r.get('known_drift'))}")
    if failures:
        print(f"\n{len(failures)} FAILURE(S):")
        for f in failures:
            print("  " + f)
        return 1
    print("\nAll checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
