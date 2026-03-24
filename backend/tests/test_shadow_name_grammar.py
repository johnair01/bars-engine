"""Unit tests for deterministic shadow name grammar (TS parity)."""

from __future__ import annotations

from app.shadow_name_grammar import derive_shadow_name, shadow_name_hash_payload


def test_shadow_name_hash_payload():
    assert shadow_name_hash_payload("hello world", 0) == "hello world"
    assert shadow_name_hash_payload("hello world", 1) == "hello world\0" + "1"


def test_derive_known_snapshots_match_ts():
    c, m = "heavy guilt about work", "a wall that presses"
    assert derive_shadow_name(c, m, 0) == "The Mediator of Open"
    assert derive_shadow_name(c, m, 1) == "Exacting Planner"
    assert derive_shadow_name(c, m, 2) == "Sacred Witness"
    assert derive_shadow_name(c, m, 3) == "Reckless Hunter"


def test_stable_per_triple():
    assert derive_shadow_name("x", "y", 5) == derive_shadow_name("x", "y", 5)


def test_empty_input():
    assert derive_shadow_name("", "", 0) == "The Unnamed Presence"
    assert derive_shadow_name("", "", 9) == "The Unnamed Presence"


def test_attempt_non_negative():
    assert derive_shadow_name("a", "b", -3) == derive_shadow_name("a", "b", 0)


def test_many_attempts_yield_variety():
    charge, mask = "charge text for variety", "mask shape here"
    names = {derive_shadow_name(charge, mask, a) for a in range(24)}
    assert len(names) >= 4
