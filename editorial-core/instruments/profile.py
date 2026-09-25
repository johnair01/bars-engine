# -*- coding: utf-8 -*-
"""
profile.py — the loader for editorial.yaml, the per-project profile.

One small accessor used by gate.py, telling.py, trailing_and.py, light_verb.py and
coherence.py. Every getter takes the caller's current hardcoded value as `default`, so a
missing manifest, a missing key, or a missing PyYAML changes nothing: the instrument keeps its
built-in value and the pipeline runs exactly as before. The manifest is authoritative when
present and invisible when absent, which is what makes the refactor non-breaking.

See specs/EDITORIAL_PIPELINE_COHERENCE_2026-09-03.md for the universal/profile split.
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, os.pardir))
MANIFEST = os.path.join(ROOT, "editorial.yaml")

_cache = None


def _load():
    global _cache
    if _cache is not None:
        return _cache
    try:
        import yaml
        with open(MANIFEST, encoding="utf-8") as fh:
            _cache = yaml.safe_load(fh) or {}
    except Exception:
        _cache = {}
    return _cache


def exists():
    return os.path.exists(MANIFEST)


def path():
    return MANIFEST


def baseline(name, default):
    try:
        return float(_load().get("baselines", {}).get(name, default))
    except Exception:
        return default


def baselines(default=None):
    v = _load().get("baselines")
    return dict(v) if v else dict(default or {})


def banned(default):
    v = _load().get("banned")
    return list(v) if v else list(default)


# light_verb, v32 (2026-09-11). DL-97's detection mechanism (the TRADE tier, the min-word floor)
# is universal and lives in light_verb.py. Its VOCABULARY is the book's own: the abstractions
# MTGOA hands a physical verb to, and the one domain-borrowed verb (metabolize) it rules IN. Those
# are project facts, so they live here. Each is a list of regex fragments, wrapped by the
# instrument, exactly like `banned`. A project that declares none runs the generic detector.
def abstractions(default):
    """Extra abstraction nouns for light_verb's DEAD/TRADE tiers, as regex fragments."""
    v = _load().get("abstractions")
    return list(v) if v else list(default or [])


def light_verb_borrowed(default):
    """Regex fragments for the BORROWED tier — verbs lifted from another domain onto a feeling."""
    v = _load().get("light_verb_borrowed")
    return list(v) if v else list(default or [])


def light_verb_borrowed_ruled_in(default):
    """BORROWED verbs the author has ruled back in, so the tier does not fire on them."""
    v = _load().get("light_verb_borrowed_ruled_in")
    return list(v) if v else list(default or [])


# gate and prose_diet are shared mechanism; a project's exemptions and named registers are its own
# data. Added v32 (2026-09-11): core carried MTGOA's `thing`/`rooms` exemptions and its ch5 charter
# register as hardcoded lists, which every other book then ran inertly. They move here. A project
# that declares neither runs the bare gate and the BASE register.
def gate_exceptions(default):
    """Sentence/name exemptions for gate counters: [{counter, phrase, reason}, ...]."""
    v = _load().get("gate_exceptions")
    return list(v) if v else list(default or [])


def registers(default):
    """Named prose_diet registers: {file-or-name: {counter: ceiling, ... , why, blocks}}."""
    v = _load().get("registers")
    return dict(v) if v else dict(default or {})


def corpus(default):
    v = _load().get("corpus")
    return list(v) if v else list(default)


def pass_list(default=None):
    v = _load().get("pass")
    return list(v) if v else list(default or [])


def project_only(default=None):
    v = _load().get("project_only")
    return list(v) if v else list(default or [])


def exclude(default=None):
    """Globs for components to keep OUT of the corpus, matched against the project-relative path
    and against the basename. A writing guide or a spec that lives beside the prose is not prose,
    and narrowing the `corpus:` glob by hand to dodge it breaks as soon as a file is added."""
    v = _load().get("exclude")
    return list(v) if v else list(default or [])


def scored_frames(default=None):
    """Frame blocks whose contents are SCORED as prose, e.g. ["HANDBOOK"].

    Every frame block (`<!-- NAME --> ... <!-- /NAME -->`) is the margin surface by default and
    no scanner reads it. RULED for MTGOA by Wendell 2026-09-10: "Boxed records should be scored,
    but those should be ledger notes because they have to be edited separately." A listed
    frame's lines are read as body prose with the `> ` box prefix removed and tagged `boxed`,
    so a hit in one is found and then ledgered as a note, never rewritten by a pass."""
    v = _load().get("scored_frames")
    return [str(x) for x in v] if v else list(default or [])


def prose_section(default=None):
    """Where the prose sits inside a component file, as {'begin': ..., 'end': ...}.

    Chapter files often carry apparatus in the same document as the prose — an outline
    above, editorial notes below. Front matter is stripped by find_line unconditionally
    because it is universal; these markers are the project's, because the heading text
    is. A project that declares nothing has its components scanned whole, which is the
    behaviour every project had before 2026-09-09.
    """
    v = _load().get("prose_section")
    return dict(v) if v else default


def register(default=None):
    """Path (relative to project root) of the authorities register coherence.py checks,
    or `default` when the project has not declared one. A fresh project has no register
    yet, so this stays None and coherence.py skips that check rather than inventing one."""
    v = _load().get("register")
    return v if v else default


def target(name, default=0):
    """The maximum allowed UN-accepted hits for an instrument. The house policy is zero —
    every telling/trailing_and/light_verb is a defect until accepted in the ledger. Read from
    the manifest's `targets:` block; defaults to zero when unset, which is the policy anyway."""
    try:
        return int(_load().get("targets", {}).get(name, default))
    except Exception:
        return default


def targets(default=None):
    """The whole `targets:` block — which instruments are held to a zero (or capped) target.
    coherence.py's zero check iterates this. Falls back to the keys of `baselines:` at zero, so
    a project that declared baselines but not targets is still held to zero on those instruments."""
    v = _load().get("targets")
    if v:
        return {k: int(n) for k, n in v.items()}
    base = _load().get("baselines")
    return {k: 0 for k in base} if base else dict(default or {})


def core_version(default=None):
    """The core version this project was installed at, from `core_version:` in the manifest.
    Compared by coherence.py against the version baked into the installed code and against the
    core home's published VERSION."""
    v = _load().get("core_version")
    try:
        return int(v)
    except Exception:
        return default


def core_home(default=None):
    """Path to the shared core this project was installed from (`core_home:`), absolute or relative
    to the project root. When it is reachable, coherence.py reads its VERSION and reports a core
    the project has yet to take."""
    v = _load().get("core_home")
    return v if v else default


def established(default=None):
    """Head nouns this project treats as defined vocabulary, so `presupposed.py` stops asking them
    to be introduced. Corpus frequency already licenses the terms a book leans on; this is the hand
    list for terms frequency has yet to catch up with."""
    v = _load().get("established")
    return list(v) if v else list(default or [])


def reporting(default=None):
    """Steps declared as boards: they surface candidates and exit non-zero as a matter of course,
    so review.py shows them as `note` and never fails on them. Everything outside this list and
    outside `targets:` fails the board on a non-zero exit — the strict default that stops a hard
    gate being demoted by inference."""
    v = _load().get("reporting")
    return list(v) if v else list(default or [])


def reference(default=None):
    """The `reference:` block — the EXTERNAL bands (reader/ICA and genre) the distribution-shaped
    measures are read against, in place of a self-baseline. Each band is a dict of feature ->
    [median, low, high], measured once on a comp corpus. Empty when a project declares none, in
    which case an instrument keeps its own hardcoded baseline (see prose_diet.BASE)."""
    v = _load().get("reference")
    return dict(v) if v else dict(default or {})
