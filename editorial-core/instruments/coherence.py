# -*- coding: utf-8 -*-
"""
coherence.py — the linter for the linters. Checks the editorial pipeline against itself.

    python3 instruments/coherence.py            # the board: one row per check
    python3 instruments/coherence.py -v          # every finding, in full

## Why this exists

Wendell, 2026-09-03: *"how do we check that the editorial pipeline is coherent and consistent.
I'm wanting to use this on multiple projects. Basically anything that I'm writing must follow
these rules."*

**The pass checks the prose. Nothing checked the pass.** It was coherent by luck: every step in
`review.py` happened to resolve to a real file, every baseline constant happened to match what
its instrument measured, every instrument a spec named happened to exist. None of that was
enforced, so any of it could rot on the next edit — a renamed instrument, a book that drifted
past its own baseline, a spec citing a step number that moved.

**This is the call site for the pipeline's own standing rule.** `EDITORIAL_AUTHORITIES` says *"a
rule with no call site is a rule nobody keeps."* The same is true one level up: a pipeline with
no self-check is a pipeline that silently diverges. This runs the check.

## The checks

The profile lives in `editorial.yaml` (see `profile.py`), and these checks validate it against
reality — the manifest is the source of truth, not any hardcoded constant.

- **manifest** — `editorial.yaml` exists, parses, and every instrument it names (`pass`,
  `project_only`, and each target) is a real file. A profile that points at nothing fails here.
- **wiring** — every instrument named in `review.py` (draft loop and book steps) exists on disk.
  A renamed or deleted instrument fails here instead of at 2 a.m. mid-review.
- **pass-wire** — every scanner the manifest's `pass` declares is actually wired into `review.py`.
  A declared-but-unrun scanner is the manifest and the orchestration disagreeing.
- **zero** — every targeted instrument is at or under its target of UN-accepted hits on the current
  corpus. The house target is zero: a telling/trailing_and/light_verb counts until it is resolved in
  the prose or accepted in `editorial_exceptions.yaml`. This is the check that used to be `drift`.
- **ledger** — accepted exceptions that match no current hit. A kept sentence that was rewritten
  leaves a stale entry; reported, not failed, so the ledger does not silently rot.
- **gates** — a targeted gate whose analyzer dependency is not installed here (fragment needs
  NLTK). Reported, never failed: the portable core runs on PyYAML alone and is never blocked by a
  missing optional tagger — the gate turns on where its dependency is present.
- **register** — every ``instrument.py`` named in `EDITORIAL_AUTHORITIES` exists. The register
  claims each authority has a call site; this proves the claim.
- **orphan** — every instrument with a manifest target is wired into `review.py`. An instrument
  nobody runs is the exact failure the register warns of: `fragment.py`, `antecedent.py` and
  `notstack.py` each existed for days before anything called them.
- **doc-figure** — a named book-wide count in an instrument's docstring (e.g. "302 ... across the
  book") that no longer matches what the instrument measures. Reported, not failed: a docstring
  figure is prose, and a drifted one is a note to update, not a broken build.

## Portability

The checks are generic — no title of this book appears in them. What varies per project is the
*content*, and it now lives in one declared file: `editorial.yaml`. Copy `instruments/` to a new
project, write its `editorial.yaml`, and this same checker validates that project's profile
against that project's reality. See `specs/EDITORIAL_PIPELINE_COHERENCE_2026-09-03.md` for the
universal/profile split.
"""
import os, re, sys, subprocess, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, os.pardir))
REVIEW = os.path.join(HERE, "review.py")


def _load_profile():
    spec = importlib.util.spec_from_file_location("profile", os.path.join(HERE, "profile.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


prof = _load_profile()

# The authorities register is a per-project artifact, so its path is declared in the manifest
# (`register:`), not hardcoded here. A fresh project has none yet — REGISTER stays None and the
# register check skips rather than failing on a file that was never meant to exist. MTGOA keeps
# its register by naming it in editorial.yaml.
_reg = prof.register(None)
REGISTER = os.path.join(ROOT, _reg) if _reg else None

# The orchestration (review.py) may not be ported on day one: a project can have a manifest and
# the universal scanners before it has wired its own book-level sequence. The checks that read
# review.py skip in that case instead of crashing, so coherence still validates what *is* here —
# the manifest against reality — which is the portability-proving core.
REVIEW_EXISTS = os.path.exists(REVIEW)

def _load_exceptions():
    spec = importlib.util.spec_from_file_location("exceptions", os.path.join(HERE, "exceptions.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


exc = _load_exceptions()

# The house target is zero, so coherence no longer scrapes a rate and compares it to a constant.
# Each targeted scanner ends its book-wide run with one machine line the zero and ledger checks
# read:  EDITORIAL <name> unresolved=<K> accepted=<M> total=<N> target=<T>
EDITORIAL = re.compile(r"EDITORIAL\s+(\w+)\s+unresolved=(\d+)\s+accepted=(\d+)\s+total=(\d+)")


MANIFEST_WIRED = re.compile(r"COHERENCE:\s*wiring-source\s*=\s*manifest")


def wired_instruments():
    """Every instrument the orchestration actually runs.

    A hand-authored `review.py` (MTGOA's) names its instruments as string literals, so the wiring
    can be read by scanning the source. The generic manifest-driven runner names none — it reads
    `pass:` at runtime — and says so by carrying `COHERENCE: wiring-source = manifest`. Scanning
    that file would find an empty set and report every declared scanner as unwired, so for it the
    manifest IS the wiring.

    The consequence is worth stating: `pass-wire` becomes true by construction under the generic
    runner, which is a stronger guarantee than a passing check. `orphan` stays live either way — a
    manifest that targets `fragment` while leaving it out of `pass:` still names an instrument that
    nothing runs.
    """
    src = open(REVIEW, encoding="utf-8").read()
    if MANIFEST_WIRED.search(src):
        return {n + ".py" for n in prof.pass_list()}
    names = set()
    # book steps: ["instruments/gate.py", ...], ["marginalia/review.py"], ["prose_diet.py"]
    for m in re.finditer(r'"((?:instruments/|marginalia/)?[a-z_0-9]+\.py)"', src):
        names.add(os.path.basename(m.group(1)))
    return names


_book_cache = {}


def run_book(fn):
    """Run an instrument book-wide, cached. The zero check and the ledger check both read the
    same run, so each instrument is executed at most once per coherence pass."""
    if fn not in _book_cache:
        p = subprocess.run([sys.executable, os.path.join(HERE, fn)],
                           capture_output=True, text=True, cwd=ROOT, timeout=180)
        _book_cache[fn] = p.stdout + p.stderr
    return _book_cache[fn]


def _editorial(name):
    """(unresolved, accepted, total) from an instrument's EDITORIAL line, or None if absent."""
    for m in EDITORIAL.finditer(run_book(name + ".py")):
        if m.group(1) == name:
            return int(m.group(2)), int(m.group(3)), int(m.group(4))
    return None


def _instrument_exists(name):
    """`telling` or `telling.py` -> True if instruments/telling.py is on disk."""
    fn = name if name.endswith(".py") else name + ".py"
    return os.path.exists(os.path.join(HERE, fn))


def check_manifest():
    """editorial.yaml exists, parses, and every instrument it names is real."""
    if not prof.exists():
        return ["no editorial.yaml — the pipeline is running on instrument defaults, and "
                "coherence cannot validate a profile that is not declared"]
    findings = []
    for name in prof.pass_list() + prof.project_only():
        if not _instrument_exists(name):
            findings.append("manifest names instrument '%s' but instruments/%s.py is missing"
                            % (name, name))
    for name in prof.targets():
        if not _instrument_exists(name):
            findings.append("manifest declares a target for '%s' but instruments/%s.py is "
                            "missing" % (name, name))
    return findings


def check_wiring():
    if not REVIEW_EXISTS:
        return None  # no orchestration ported yet — nothing to check against
    findings = []
    for name in sorted(wired_instruments()):
        for base in (HERE, os.path.join(ROOT, "marginalia")):
            if os.path.exists(os.path.join(base, name)):
                break
        else:
            findings.append("wired in review.py but missing on disk: %s" % name)
    return findings


def check_pass_wiring():
    """Every instrument the manifest's `pass` declares is actually wired into review.py.
    A declared scanner that nothing runs is the manifest and the orchestration disagreeing."""
    if not REVIEW_EXISTS:
        return None  # no orchestration to disagree with yet
    wired = wired_instruments()
    findings = []
    for name in prof.pass_list():
        if (name + ".py") not in wired:
            findings.append("manifest `pass` lists '%s' but review.py does not wire it" % name)
    return findings


def check_zero():
    """Every targeted instrument is at or under its target of UN-accepted hits on the current
    corpus. The house target is zero: every telling/trailing_and/light_verb is a defect until it
    is resolved in the prose or accepted in editorial_exceptions.yaml. This is the check that was
    'drift' — the pipeline no longer defends a measured rate, it drives the count to zero."""
    findings = []
    for name, target in sorted(prof.targets().items()):
        if not _instrument_exists(name):
            continue  # check_manifest already reports the missing instrument
        if re.search(r"EDITORIAL\s+%s\s+status=unavailable" % re.escape(name), run_book(name + ".py")):
            continue  # analyzer dependency absent — the soft `gates` check reports it; a missing
                      # optional tagger never fails the portable core (telling/trailing_and/light_verb)
        got = _editorial(name)
        if got is None:
            findings.append("%s: no EDITORIAL summary line in its output — the zero check cannot "
                            "read its unresolved count" % name)
            continue
        unresolved, accepted, total = got
        if unresolved > target:
            findings.append("%s: %d unresolved (target %d) — resolve in the prose or accept in the "
                            "ledger  [%d accepted, %d total]" % (name, unresolved, target, accepted, total))
    return findings


def check_ledger_parses():
    """The ledger file itself is readable. Everything else about the ledger assumes this.

    Added 2026-09-09, the hour a malformed ledger reported `ledger  ok  clean` while silently
    disabling twenty-three acceptances across two instruments. A check that cannot tell "no
    exceptions" from "the exceptions file is broken" is worse than no check.
    """
    err = exc.error() if hasattr(exc, "error") else None
    return [err] if err else []


def check_ledger():
    """Exceptions that match no current hit. A ledger entry keys on the offending sentence, so a
    sentence that was rewritten leaves its exception matching nothing — the entry is stale and
    should be pruned. Reported, not failed: a stale exception is a note to tidy, not a broken build."""
    findings = []
    for name in sorted(prof.targets()):
        if not _instrument_exists(name):
            continue
        # v30: read the instrument's own `stale=` count — entries that matched no hit. The old
        # test compared ENTRIES with accepted HITS, and one entry can accept several hits, so a
        # surplus of hits hid dead entries. Fallback only for an instrument that predates v30.
        m = re.search(r"EDITORIAL\s+%s\s+.*?\bstale=(\d+)" % re.escape(name), run_book(name + ".py"))
        if m:
            dead = int(m.group(1))
        else:
            got = _editorial(name)
            dead = exc.count(name) - (got[1] if got else 0)
        if dead > 0:
            findings.append("%s: %d ledger exception(s) match no current hit — a kept sentence was "
                            "rewritten or removed; prune editorial_exceptions.yaml" % (name, dead))
    return findings


def check_gates():
    """Targeted gates whose analyzer dependency is not installed in this environment. Reported,
    never failed: the portable core (telling/trailing_and/light_verb) needs only PyYAML and runs
    anywhere; a gate like fragment that needs NLTK turns ON where its dependency is present and is
    simply OFF here, not broken. So a missing optional tagger is a note to install, not a red board."""
    findings = []
    for name in sorted(prof.targets()):
        if not _instrument_exists(name):
            continue
        if re.search(r"EDITORIAL\s+%s\s+status=unavailable" % re.escape(name), run_book(name + ".py")):
            findings.append("%s gate is OFF — its analyzer (NLTK) is not installed here; "
                            "`pip install -r instruments/requirements.txt` and download the tagger "
                            "data (see that file) to turn it on" % name)
    return findings


def _load_mod(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, name + ".py"))
    mod = importlib.util.module_from_spec(spec)
    argv, sys.argv = sys.argv, [name]
    try:
        spec.loader.exec_module(mod)
    finally:
        sys.argv = argv
    return mod


_REF_KEYS = ["be", "copula", "waste", "zombie", "expletive", "passive", "empty", "inchoative"]


def check_reference():
    """Every declared reference band is comparable to the current scorer, and — when its comps are
    reachable — still measures what it stored. The bands had NO call site until this check (the
    integrity gap the 2026-09-09 hostile review named: the pipeline preaches 'a rule with no call
    site rots' and had left its own bands unchecked). A mistyped band, a stale band, or a band
    measured with an outdated scorer now fails here instead of silently skewing prose_diet."""
    ref = prof.reference()
    if not ref:
        return None  # no bands declared (MTGOA) — nothing to validate; portable.
    findings = []
    pd = _load_mod("prose_diet")
    cc = _load_mod("corpus_clean")
    import statistics as st
    for name, spec in ref.items():
        band = (spec or {}).get("band") or {}
        missing = [k for k in _REF_KEYS if k not in band]
        if missing:
            findings.append("reference.%s.band is missing %s" % (name, ", ".join(missing)))
        if spec.get("scorer") != pd.SCORE_VERSION:
            findings.append("reference.%s was measured with scorer v%s but prose_diet is v%s — "
                            "re-run build_bands.py; the stored band no longer compares to live scores"
                            % (name, spec.get("scorer"), pd.SCORE_VERSION))
        srcs, comps = spec.get("sources"), spec.get("comps") or []
        paths = [os.path.join(srcs, c, "CORPUS.txt") for c in comps] if srcs else []
        if paths and all(os.path.exists(p) for p in paths):
            scored = [pd.score(cc.clean(open(p, encoding="utf-8", errors="ignore").read()))
                      for p in paths]
            for k in _REF_KEYS:
                stored = band.get(k, [None])[0]
                fresh = round(st.median(s[k] for s in scored), 1)
                if stored is not None and abs(fresh - stored) > 0.3:
                    findings.append("reference.%s.%s: manifest median %.1f but comps now measure "
                                    "%.1f — the band drifted from its own texts" % (name, k, stored, fresh))
        # comps unreachable (a fresh clone without the sources tree) is not a defect: the scorer
        # stamp and structure are still checked, and the re-measure runs wherever the texts live.
    return findings


def _pending_severity(core_home, frm, to):
    """("validity"|"capability", [versions]) for the releases between an installed core and the
    published one.

    **The exception handling here is narrow on purpose.** The first version caught bare
    `Exception` and returned "capability" — and since this module does not import `io`, every
    call raised `NameError` and every stale project was told its counts were safe. Written the
    same hour as POSTMORTEM_2026-09-09_LEDGER.md, whose whole finding is that a swallowed
    exception turns a broken read into a confident wrong answer.

    A core with no `releases.yaml` is a legitimate state and reports "capability". Anything
    else raises, because a crash the reader can see beats a verdict they cannot check.
    """
    try:
        import yaml
    except ImportError:
        return "capability", []
    path = os.path.join(core_home, "releases.yaml")
    if not os.path.exists(path):
        return "capability", []
    with open(path, encoding="utf-8") as fh:
        rel = yaml.safe_load(fh) or {}
    bad = [v for v in sorted(rel)
           if frm < v <= to and (rel[v] or {}).get("severity") == "validity"]
    return ("validity" if bad else "capability"), bad


def check_core():
    """This project's core copy, against the core it was installed from.

    Three numbers have to agree: `CORE_VERSION` baked into the installed code, `core_version:` in
    the manifest, and the VERSION the core home publishes. The first two travel with the project and
    are always checkable; the third is read when `core_home` is reachable and skipped when it is not.

    **Severity, implemented 2026-09-09.** A stale project is not always in trouble. `releases.yaml`
    in the core home says whether each intervening version was a `validity` release — one where the
    same prose now yields a different number — or a `capability` release, where nothing already
    counted moved. A pending validity release means this project's counts no longer mean what its
    targets and ledger assume, so the finding is marked HARD and the board fails. A capability gap
    reports and waits. When `releases.yaml` cannot be read, every gap reports, which is where this
    check stood all along."""
    declared, home = prof.core_version(None), prof.core_home(None)
    if declared is None and not home:
        return None  # the project declares no core (MTGOA today) — nothing to check
    findings = []
    cm = _load_mod("core_meta")
    installed = cm.CORE_VERSION
    if declared is not None and declared != installed:
        findings.append("manifest records core_version %s but the installed instruments carry v%s — "
                        "the manifest and the code disagree about which core is here"
                        % (declared, installed))
    if home:
        path = home if os.path.isabs(home) else os.path.normpath(os.path.join(ROOT, home))
        current = cm.home_version(path)
        if current is not None:
            if installed < current:
                sev, versions = _pending_severity(path, installed, current)
                if sev == "validity":
                    findings.append("HARD: core v%d is published at %s and this project runs v%d. "
                                    "Release(s) %s changed what a measurement MEANS, so every count "
                                    "on this board is stale — run sync_core.py before trusting it"
                                    % (current, home, installed,
                                       ", ".join("v%d" % v for v in versions)))
                else:
                    findings.append("core v%d is published at %s and this project runs v%d — run "
                                    "sync_core.py to take it (capability only; counts unchanged)"
                                    % (current, home, installed))
            elif installed > current:
                findings.append("this project runs core v%d but %s publishes v%d — the project is "
                                "ahead of its own core, so one of them was edited in place"
                                % (installed, home, current))
    return findings


def check_register():
    if REGISTER is None:
        return None  # no register declared in the manifest — nothing to validate
    if not os.path.exists(REGISTER):
        return ["register declared in editorial.yaml but not found: %s"
                % os.path.relpath(REGISTER, ROOT)]
    src = open(REGISTER, encoding="utf-8").read()
    findings = []
    for name in sorted(set(re.findall(r"`([a-z_0-9]+\.py)`", src))):
        if not os.path.exists(os.path.join(HERE, name)):
            findings.append("named in EDITORIAL_AUTHORITIES but missing: %s" % name)
    return findings


def check_orphan():
    """An instrument that declares a target in the manifest but is not run by review.py."""
    if not REVIEW_EXISTS:
        return None  # can't judge orphanhood without an orchestration to be wired into
    wired = wired_instruments()
    findings = []
    for name in sorted(prof.targets()):
        if (name + ".py") not in wired:
            findings.append("has a manifest target but is not wired into review.py: %s" % name)
    return findings


def check_doc_figures():
    """A docstring count 'N ... across the book' that no longer matches the measured count."""
    findings = []
    for fn, meas in (("telling.py", None),):
        src = open(os.path.join(HERE, fn), encoding="utf-8").read()
        for m in re.finditer(r"(\d{3,})\s+(?:times|absolutes)?[^.\n]*?across the book", src):
            claimed = int(m.group(1))
            out = run_book(fn)
            # telling's ABSOLUTE count is the third integer on the book row
            row = next((l for l in out.splitlines()
                        if l.strip().lower().startswith("the book")), "")
            nums = re.findall(r"\b(\d+)\b", row)
            measured = int(nums[2]) if len(nums) >= 3 else None
            if measured is not None and measured != claimed:
                findings.append("%s docstring says %d 'across the book' but it measures %d"
                                % (fn, claimed, measured))
    return findings


CHECKS = [
    ("manifest ", check_manifest, True),
    ("wiring   ", check_wiring, True),
    ("pass-wire", check_pass_wiring, True),
    ("zero     ", check_zero, True),
    ("readable ", check_ledger_parses, True),   # HARD: a ledger that will not parse silences
                                                #       every acceptance in the book at once
    ("ledger   ", check_ledger, False),         # reports stale exceptions, does not fail the board
    ("gates    ", check_gates, False),          # reports gates that are OFF for a missing dependency
    ("reference", check_reference, True),        # bands: scorer-version + drift-from-comps (n/a if none)
    ("core     ", check_core, "auto"),           # reports a capability gap; FAILS on a pending
                                                 # validity release (finding prefixed "HARD:")
    ("register ", check_register, True),
    ("orphan   ", check_orphan, True),
    ("doc-figure", check_doc_figures, False),   # reports, does not fail the board
]


def main():
    verbose = "-v" in sys.argv
    print("coherence — the pipeline checked against itself")
    print("-" * 60)
    failed = 0
    skipped = 0
    allfindings = []
    for tag, fn, hard in CHECKS:
        findings = fn()
        if findings is None:  # check not applicable to this project (yet)
            skipped += 1
            print("  %s  n/a   not present in this project" % tag)
            continue
        # `hard` is True, False, or "auto" — a soft check whose individual findings decide, by
        # prefixing the ones that must fail the board with "HARD:". `core` uses it: a capability
        # gap is advisory and a pending validity release is not.
        is_hard = (any(f.startswith("HARD:") for f in findings) if hard == "auto" else bool(hard))
        findings = [f[5:].lstrip() if f.startswith("HARD:") else f for f in findings]
        status = "ok  " if not findings else ("FAIL" if is_hard else "LOOK")
        if findings and is_hard:
            failed += 1
        print("  %s  %s  %s" % (tag, status,
                                "clean" if not findings else "%d finding(s)" % len(findings)))
        allfindings += [(tag.strip(), f) for f in findings]
    print("-" * 60)
    if allfindings and (verbose or True):
        print("")
        for tag, f in allfindings:
            print("  [%s] %s" % (tag, f))
    print("")
    tail = "" if not skipped else " (%d check(s) n/a — orchestration not ported yet)" % skipped
    print("COHERENCE %s%s" % ("PASS — the pipeline is internally consistent" if not failed
                              else "FAIL — %d hard check(s) failing" % failed, tail))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
