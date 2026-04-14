# Spec: Pixel identity system v0 (VIE spine)

## Purpose

Introduce a **Visual Identity Engine (VIE)** path: **CharacterIdentity** resolves to **visual tokens**, optional **layered composition**, and **sprite output**—including hooks for **BAR / emotional overlays**—without breaking existing **precomposed walkable** and **portrait** flows.

**Practice**: Contract-first; align walkable dimensions with [humanoid-v1-walkable-contract](../humanoid-v1-walkable-contract/spec.md); deterministic fallbacks when AI or dynamic layers are off.

## Problem

[docs/conclave/construc-conclave-9/bars_pixel_identity_system_v0.md](../../../docs/conclave/construc-conclave-9/bars_pixel_identity_system_v0.md) describes identity → tokens → layers → export, but the repo today uses **fixed nation×archetype** walkable sheets ([`getWalkableSpriteUrl`](../../../src/lib/avatar-utils.ts)) and separate **paper-doll** portrait work. There is no shared **identity resolver** or **equipment-driven walkable** pipeline.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Normative walkable layout | **humanoid v1** ([humanoid-v1-walkable-contract](../humanoid-v1-walkable-contract/spec.md)); repo assets and Pixi consumers must not diverge on frame size/order/anchor. |
| Phase 0 | **Types + resolver stub** that maps `CharacterIdentity` → current precomposed URL (no new compositor required to ship v0). |
| Phase 1+ | Optional layer composition and emotional variants; gated by performance and art pipeline. |
| Portraits | [avatar-paper-doll-coherence](../avatar-paper-doll-coherence/spec.md) remains the authority for Register 3 portrait coherence; VIE walkable must not silently fork portrait tokens without explicit mapping. |
| AI assets | Quantization and steward approval follow Regent/steward patterns; public surfaces show human-approved canon when policy requires (see [SIX_FACES bundle](../../../docs/conclave/construc-conclave-9/SIX_FACES_CONCLAVE_BUNDLE.md)). |

## Conceptual Model

```
CharacterIdentity → VisualTokenSet → [LayerStack] → SpriteSheetRef → Runtime (Pixi / DOM)
                           ↑
                    BAR / emotional modifier (optional)
```

## User Stories

### P1: Identity type + resolver

**As an engineer**, I want a single `CharacterIdentity` shape and resolver entry point, so walkable URL selection is not scattered string logic.

**Acceptance**: Typed module; existing demo and nation×archetype paths use resolver; tests for mapping.

### P2: Contract alignment

**As an artist/engineer**, I want new walkable art validated against humanoid v1, so we do not ship wrong dimensions or anchor.

**Acceptance**: Checklist or script documented in humanoid spec tasks; at least one CI or npm script that validates pilot assets (optional in v0 if manual checklist only—state in tasks).

### P3: BAR overlay hook (deferred if needed)

**As a designer**, I want emotional state to modulate visual tokens, so BAR outcomes can surface in sprite choice or overlay.

**Acceptance**: Documented extension point; no requirement to ship generative art in v0.

## Functional Requirements

### Phase 0

- **FR1**: Define `CharacterIdentity` (and related visual token types) in `src/lib/`; document fields vs Conclave doc.
- **FR2**: Implement `resolveWalkableSprite(identity): string` (or async if needed) delegating to current precomposed strategy.
- **FR3**: Reference humanoid v1 in [docs/WALKABLE_SPRITES.md](../../../docs/WALKABLE_SPRITES.md) and/or walkable specs as single source for frame math.

### Phase 1 (optional follow-on)

- **FR4**: Layer registry layout under `public/` or remote blob strategy per scaling checklist.
- **FR5**: Equipment slots → compositor or server-side bake (decision record in `plan.md`).

## Non-Functional Requirements

- No regression to walkable demo FPS; prefer precomposed sheets until compositor is proven.
- Community-facing copy avoids over-claiming AI-generated canon.

## Dependencies

- [humanoid-v1-walkable-contract](../humanoid-v1-walkable-contract/spec.md)
- [walkable-sprite-pipeline-demo](../walkable-sprite-pipeline-demo/spec.md), [walkable-sprites-implementation](../walkable-sprites-implementation/spec.md)
- [avatar-paper-doll-coherence](../avatar-paper-doll-coherence/spec.md) (portrait alignment)

## References

- [bars_pixel_identity_system_v0.md](../../../docs/conclave/construc-conclave-9/bars_pixel_identity_system_v0.md)
- [GAP_ANALYSIS.md](../../../docs/conclave/construc-conclave-9/GAP_ANALYSIS.md)

## Verification Quest

- **ID**: `cert-pixel-identity-v0`
- **Steps**: Pick two identities → resolver returns expected URLs → walkable room renders → document BAR hook as no-op or flag in v0.
