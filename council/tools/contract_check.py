"""The analyze step: a spec folder against the council's constitution and stage contract.

Wendell, 2026-10-28, on github/spec-kit: "I want to use this discipline to create another formal way to integrate the
6 game masters the design ontology and the game studio skills into a contract that makes the moves More consistent".
Each stage in council/pipeline.yaml names its spec-kit command, the faces that sign it, the design-ontology fields it
fills and the studio skills it loads; council/constitution.md holds the articles every plan checks. This reads a
.specify/specs/<feature>/ folder (spec.md, plan.md, tasks.md) and says where it breaks the contract.

python3 council/tools/contract_check.py <spec folder>                   check through the analyze stage
python3 council/tools/contract_check.py <spec folder> --through plan    check only the stages up to plan
python3 council/tools/contract_check.py --matrix                         the stage contract as one table

Exit: 0 the contract holds, 1 it breaks, 2 usage.
"""
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
PIPELINE = ROOT / "council" / "pipeline.yaml"
CONSTITUTION = ROOT / "council" / "constitution.md"
SKILLS = ROOT / "council" / "skills.yaml"
FILES = ("spec.md", "plan.md", "tasks.md")
PLACEHOLDER = re.compile(r"^\s*\[[^\]]*\]\s*$")
ARTICLE = re.compile(r"^## Article (\d+): (.+)$", re.M)
FIELD = re.compile(r"^- `([a-z_]+)`:\s*(.*)$", re.M)
FR = re.compile(r"\bFR-\d{3}\b")
TASK = re.compile(r"^- \[[ x]\] T\d{3}\b.*$", re.M)
MARKER = re.compile(r"\[NEEDS CLARIFICATION:([^\]]*)\]")


def pipeline():
    return yaml.safe_load(PIPELINE.read_text(encoding="utf-8"))


def articles():
    return {int(n): name.strip() for n, name in ARTICLE.findall(CONSTITUTION.read_text(encoding="utf-8"))}


def skill_ids():
    return {s["id"]: s for s in yaml.safe_load(SKILLS.read_text(encoding="utf-8"))["skills"]}


def section(text, name):
    m = re.search(r"^## %s\s*\n(.*?)(?=^## |\Z)" % re.escape(name), text, re.S | re.M)
    return m.group(1) if m else None


def line(text, key):
    m = re.search(r"^\**%s:?\**:?\s*(.+)$" % re.escape(key), text, re.M | re.I)
    return m.group(1).strip() if m else None


def stages_through(data, through):
    ids = [s["id"] for s in data["stages"]]
    if through not in ids:
        raise SystemExit("unknown stage %r; stages: %s" % (through, ", ".join(ids)))
    return data["stages"][: ids.index(through) + 1]


def check(folder, through="analyze"):
    """Return a list of (stage, problem) pairs; empty when the contract holds."""
    folder = Path(folder)
    missing = [f for f in FILES if not (folder / f).exists()]
    if missing:
        return [("spec", "missing %s" % ", ".join(missing))]
    spec, plan, tasks = ((folder / f).read_text(encoding="utf-8") for f in FILES)
    every = re.sub(r"<!--.*?-->", "", "\n".join((spec, plan, tasks)), flags=re.S)  # the template's own example marker is not a question
    data = pipeline()
    stages = stages_through(data, through)
    reached = {s["id"] for s in stages}
    owners_of = data["contract"]["field_owners"]
    out = []

    # intake: the ask, quoted and dated
    ask = section(spec, "The ask") or ""
    if not re.search(r"^>.*\S", ask, re.M) or not re.search(r"20\d\d-\d\d-\d\d", ask):
        out.append(("intake", "spec.md `## The ask` needs his words quoted (`> ...`) with the date"))
    if re.search(r"^game:\s*yes", spec, re.M | re.I):
        intake = line(spec, "intake")
        if not intake or not (ROOT / intake.split()[0].strip("`")).exists():
            out.append(("intake", "a game or world spec names its callsheet on an `intake:` line (intake_check.py)"))

    # the ontology fields each reached stage fills
    onto = section(spec, "Ontology")
    filled = {k: v.strip() for k, v in FIELD.findall(onto or "")}
    for stage in stages:
        for field in stage.get("fills") or []:
            value = filled.get(field, "")
            if not value or PLACEHOLDER.match(value) or value.lower() in ("n/a", "n/a:"):
                out.append((stage["id"], "`%s` (%s) is not filled in spec.md `## Ontology`; write it or `n/a: <why>`"
                            % (field, owners_of[field])))

    # requirements, and the tasks that serve them
    reqs = sorted(set(FR.findall(spec)))
    if "spec" in reached and not reqs:
        out.append(("spec", "spec.md names no requirement (FR-001)"))

    # clarify: every marker names its board row
    if "clarify" in reached:
        for body in MARKER.findall(every):
            if not re.search(r"\|\s*board:\s*[a-z0-9][a-z0-9\-]+", body):
                out.append(("clarify", "[NEEDS CLARIFICATION:%s] has no board row; run the reach test" % body))

    # falsify
    if "falsify" in reached:
        failed = section(spec, "How we will know it failed") or ""
        bullets = [b for b in re.findall(r"^- (.+)$", failed, re.M) if not PLACEHOLDER.match(b.split(":**")[-1])]
        if len(bullets) < 2:
            out.append(("falsify", "spec.md needs the cheap test and the result that stops the work"))

    # plan: footing, skills, constitution check
    if "plan" in reached:
        for key in ("primitives", "footing", "tier", "scout"):
            if not line(plan, key):
                out.append(("plan", "plan.md has no `%s:` line" % key))
        named = set(re.findall(r"[a-z0-9][a-z0-9_\-]+", line(plan, "skills") or ""))
        skipped = set(re.findall(r"^skipped:\s*([a-z0-9_\-]+)\s+-\s+\S", plan, re.M))
        known = skill_ids()
        if not named:
            out.append(("plan", "plan.md has no `skills:` line naming the studio skills run"))
        for sid in sorted(named - set(known)):
            out.append(("plan", "skill `%s` is not in council/skills.yaml" % sid))
        seen = set()
        for stage in stages:
            for sid in stage.get("loads") or []:
                if sid in known and sid not in named | skipped | seen:
                    seen.add(sid)
                    out.append((stage["id"], "stage loads `%s`; name it on `skills:` or write `skipped: %s - <why>`"
                                % (sid, sid)))
        table = section(plan, "Constitution check") or ""
        for n, name in articles().items():
            row = re.search(r"^\|\s*%d\b[^|]*\|([^|]*)\|([^|]*)\|" % n, table, re.M)
            verdict = row.group(1).strip().lower() if row else ""
            if not row:
                out.append(("plan", "constitution check has no row for Article %d (%s)" % (n, name)))
            elif not re.match(r"(pass|n/a|exception)\b", verdict):
                out.append(("plan", "Article %d's verdict must be pass, n/a or exception" % n))
            elif verdict != "pass" and not row.group(2).strip():
                out.append(("plan", "Article %d is %s without a reason" % (n, verdict)))
            elif verdict.startswith("exception") and "board:" not in row.group(2):
                out.append(("plan", "Article %d's exception names no board row" % n))
        task_lines = TASK.findall(tasks)
        if not task_lines:
            out.append(("plan", "tasks.md has no numbered task (`- [ ] T001 ...`)"))
        served = set(FR.findall("\n".join(task_lines)))
        for req in reqs:
            if req not in served:
                out.append(("plan", "%s has no task in tasks.md" % req))
        for t in task_lines:
            if "[claude]" not in t and "[wendell]" not in t:
                out.append(("plan", "task is not tagged [claude] or [wendell]: %s" % t[:60]))

    # verify: something to see
    if "verify" in reached and not (line(tasks, "proof") or line(tasks, "preview")):
        out.append(("verify", "tasks.md has no `proof:` or `preview:` line (Article 7)"))

    # signatures
    signed = section(every, "Signed") or ""
    for stage in stages:
        m = re.search(r"^- %s:\s*(.+)$" % stage["id"], signed, re.M)
        names = set(re.findall(r"[a-z]+", m.group(1).lower())) if m else set()
        lacking = [f for f in stage["owners"] if f not in names]
        if lacking:
            out.append((stage["id"], "`## Signed` lacks %s for %s" % (", ".join(lacking), stage["id"])))
    return out


def matrix():
    data = pipeline()
    known = skill_ids()
    rows = ["| Stage | spec-kit | Signs | Ontology fields | Studio skills (hall) | Articles |", "|---|---|---|---|---|---|"]
    for s in data["stages"]:
        skills = ", ".join("%s (%s)" % (k, known[k]["dept"]) if k in known else k for k in s.get("loads") or [])
        rows.append("| %s | %s | %s | %s | %s | %s |" % (
            s["id"], s.get("speckit", ""), ", ".join(s["owners"]), ", ".join(s.get("fills") or []) or "-",
            skills or "-", ", ".join(str(a) for a in s.get("articles") or []) or "-"))
    return "\n".join(rows)


def main(argv):
    if argv == ["--matrix"]:
        print(matrix())
        return 0
    if not argv or argv[0].startswith("-"):
        print(__doc__)
        return 2
    through = "analyze"
    if "--through" in argv:
        i = argv.index("--through")
        through = argv[i + 1]
        argv = argv[:i] + argv[i + 2:]
    problems = check(argv[0], through)
    if not problems:
        print("contract holds through %s: %s" % (through, argv[0]))
        return 0
    for stage, problem in problems:
        print("%-8s %s" % (stage, problem))
    order = [s["id"] for s in pipeline()["stages"]]
    first = min((stage for stage, _ in problems), key=order.index)
    print("\n%d problem(s); the contract breaks at %s" % (len(problems), first))
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
