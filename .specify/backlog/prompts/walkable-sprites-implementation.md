# Spec Kit Prompt: Walkable Sprites Implementation

## Role

You are a Spec Kit agent responsible for implementing walkable sprites end-to-end: Pixi rendering, agent data flow, Replicate asset generation, and validation.

## Objective

Implement per [.specify/specs/walkable-sprites-implementation/spec.md](../specs/walkable-sprites-implementation/spec.md). **API-first**: define server action and data shapes before UI. Spec: `.specify/specs/walkable-sprites-implementation/`.

## Prompt (API-First)

> Implement walkable sprites per [.specify/specs/walkable-sprites-implementation/spec.md](../specs/walkable-sprites-implementation/spec.md). **API-first**: define `generateWalkableSprite(input): Promise<{ url?, error? }>` and RoomRenderer setters before UI. Follow tasks.md in order. Spec: [.specify/specs/walkable-sprites-implementation/](../specs/walkable-sprites-implementation/).

## Requirements

- **Surfaces**: LobbyCanvas, RoomCanvas, RoomRenderer; optional admin "Generate sprites"
- **Mechanics**: Pixi Sprite from walkableSpriteUrl; WASD direction; Replicate rd-animation for generation
- **Persistence**: None (sprites in public/); REPLICATE_API_TOKEN env
- **API**: `generateWalkableSprite`, `setPlayerSpriteUrl`, `setPlayerDirection`; getIntentAgentsForRoom returns walkableSpriteUrl
- **Verification**: cert-walkable-sprites-v1 quest; npm run build, build:type-check

## Checklist (API-First Order)

- [ ] API contract (generateWalkableSprite input/output) defined in spec
- [ ] RoomRenderer setters implemented
- [ ] Server Action generateWalkableSprite implemented
- [ ] LobbyCanvas/RoomCanvas wired to RoomRenderer
- [ ] getIntentAgentsForRoom includes avatarConfig → walkableSpriteUrl
- [ ] Run `npm run build` and `npm run build:type-check` — fail-fix

## Deliverables

- [ ] Phase 1: RoomRenderer player sprites
- [ ] Phase 2: Agent sprites
- [ ] Phase 3: Replicate generation (optional admin UI)
- [ ] Phase 4: Validation script (optional)
- [ ] Verification quest cert-walkable-sprites-v1
