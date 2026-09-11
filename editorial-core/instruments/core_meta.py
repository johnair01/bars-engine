# -*- coding: utf-8 -*-
"""
core_meta.py — what version of the editorial core this copy is, and how to find the core it came from.

## Why this exists

The core travels by copy. A copy with no version is a copy that drifts silently, which is the exact
failure this pipeline exists to prevent one level down (`scorer:` for reference bands, the zero
targets for prose). The six faces ruled on 2026-09-09 — see
`.specify/specs/editorial-core-distribution/six-faces-update-timing.md` — that the core becomes its
own object *before* any sync ergonomics are built. This module is the object's identity card.

**`CORE_VERSION` travels with the code.** It is baked into every copy, so a project always knows
which core it is running, whether or not it can reach the core it was installed from.

**`core_home` is declared in the project's `editorial.yaml`.** When it is reachable, coherence.py
reads the core's `VERSION` file and compares; when it is absent (a clone without the core tree),
the check reports what it can and declines to guess. Same shape as `reference.sources` for bands.

## Bumping the version

Raise `CORE_VERSION` here and in `<core>/VERSION` together, in the same change that alters a core
instrument. The two are compared, so letting them disagree is the one thing that breaks the check.

**Release severity (ruled 2026-09-09, not yet implemented).** A release that changes what a
measurement *means* is a validity release and is intended to fail a stale project's board, exactly
as a `scorer:` mismatch does. A release that adds capability reports and waits for the project.
The severity field ships with `sync_core.py`; until then every release reports.
"""
import os

CORE_VERSION = 32


def home_version(core_home):
    """The version the core at `core_home` currently publishes, or None when it is unreachable.

    Reads `<core_home>/VERSION` — a single integer on the first line. Absent, unreadable or
    unparseable all return None, so a missing core tree is a quiet no-op rather than a crash.
    """
    if not core_home:
        return None
    path = os.path.join(core_home, "VERSION")
    try:
        with open(path, encoding="utf-8") as fh:
            return int(fh.readline().strip())
    except Exception:
        return None
