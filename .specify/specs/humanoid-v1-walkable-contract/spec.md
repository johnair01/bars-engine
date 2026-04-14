# Spec: Humanoid v1 walkable sprite contract

## Purpose

Freeze a **normative contract** for **humanoid walkable** sprites used in-engine: **canvas**, **frame grid**, **walk cycle order**, **anchor point**, **layer categories**, **palette rules**, and **export metadata**—so art, tooling, and Pixi (or other renderers) stay compatible.

**Practice**: Falsifiable checks (dimensions, JSON sidecar); no silent drift between docs and `public/sprites/walkable`.

## Problem

Without a single contract, new sheets can break `RoomCanvas` math, foot sliding, and hitboxes. The Conclave doc [humanoid_v1_spec.md](../../../docs/conclave/construc-conclave-9/humanoid_v1_spec.md) is the **authoritative prose**; this spec kit tracks **acceptance criteria** and **verification** in-repo.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Source copy | [docs/conclave/construc-conclave-9/humanoid_v1_spec.md](../../../docs/conclave/construc-conclave-9/humanoid_v1_spec.md) — do not fork numeric constants in multiple places; if code duplicates, comment points to spec. |
| Sheet layout | **512×64** horizontal strip, **8** frames of **64×64**, order **0–7** as defined in source doc (idle + walk cycle). |
| Anchor | Feet contact **(32, 56)** in frame space unless spec doc amended. |
| Metadata | JSON sidecar per asset (fields per source doc: `version`, `frameSize`, `frames`, `anchor`, `layers`, etc.). |
| Validation | Prefer automated check (image size + JSON) in `npm run` script; minimal v1 may be checklist + one golden asset. |

## Functional Requirements

- **FR1**: Document in [docs/WALKABLE_SPRITES.md](../../../docs/WALKABLE_SPRITES.md) that humanoid v1 is the **default contract** for new walkable humanoid sheets.
- **FR2**: Existing demo asset(s) either **conform** or are explicitly labeled **legacy** with mapping notes (no ambiguous third state).
- **FR3**: Add validation artifact: script or documented manual steps in `tasks.md` that fails on wrong dimensions or missing metadata for new submissions.
- **FR4**: Pixi / renderer uses the same frame index → facing mapping as [walkable-sprite-pipeline-demo](../walkable-sprite-pipeline-demo/spec.md); if mismatch found, fix code or spec once, not both diverging.

## Non-Functional Requirements

- Validation runnable in CI or pre-commit optional; must be documented for artists.
- Non-humanoid creatures may use a different contract **only** with explicit suffix/folder convention (document in WALKABLE_SPRITES or here).

## Dependencies

- [walkable-sprite-pipeline-demo](../walkable-sprite-pipeline-demo/spec.md)
- [pixel-identity-system-v0](../pixel-identity-system-v0/spec.md) (resolver consumes URLs that honor this contract)

## Verification Quest

- **ID**: `cert-humanoid-v1-contract-v1`
- **Steps**: Run validator on `public/sprites/walkable/*`; open world room; verify feet stick to ground at anchor; frame order matches intended facing cycle.

## References

- [humanoid_v1_spec.md](../../../docs/conclave/construc-conclave-9/humanoid_v1_spec.md)
- [sprite_issue.md](../../../docs/conclave/construc-conclave-9/sprite_issue.md), [cursor_spec.md](../../../docs/conclave/construc-conclave-9/cursor_spec.md) — demo goals (largely shipped)
- [GAP_ANALYSIS.md](../../../docs/conclave/construc-conclave-9/GAP_ANALYSIS.md)
