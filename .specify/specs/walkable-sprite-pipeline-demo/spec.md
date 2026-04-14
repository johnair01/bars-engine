# Spec: Walkable Sprite Pipeline Demo (Conclave / vertical slice)

## Purpose

Prove **Avatar config → walkable sheet URL → Pixi `RoomRenderer`** with **directional frames** and **load failure fallback**—without building a full character creator or dynamic compositing.

**Practice**: Deftness Development — spike bounded; aligns with [.specify/specs/walkable-sprites-implementation/spec.md](../walkable-sprites-implementation/spec.md).

## Problem

Pipeline pieces existed (`getWalkableSpriteUrl`, `setPlayerSpriteUrl`, `setPlayerDirection`) but needed a **repeatable demo**: non-default asset, keyboard direction updates, and documented opt-in for forced demo config.

## Design Decisions

| Topic | Decision |
|-------|----------|
| URL contract | `getWalkableSpriteUrl(parseAvatarConfig(...))` → `/sprites/walkable/{nationKey}-{archetypeKey}.png` |
| Renderer | [`src/lib/spatial-world/pixi-room.ts`](../../../src/lib/spatial-world/pixi-room.ts) — `RoomRenderer` |
| Mount | [`src/lib/spatial-world/spatial-room-session.ts`](../../../src/lib/spatial-world/spatial-room-session.ts) + [`useSpatialRoomSession`](../../../src/lib/spatial-world/useSpatialRoomSession.ts) |
| Demo config | Opt-in: `NEXT_PUBLIC_WALKABLE_SPRITE_DEMO=true` forces `{ nationKey: 'argyra', archetypeKey: 'bold-heart' }` for world walkable URL only (production default unchanged). |
| Fallback | Pixi loads sheet; on failure, falls through to `default.png` then colored rect (existing `RoomRenderer` behavior). |
| Non-goals | Full character creator; per-frame compositing in this spike |

## Functional Requirements

- **FR1**: `RoomRenderer` receives `playerSpriteUrl` from server-derived walkable URL.
- **FR2**: **WASD** (with arrows) updates facing and sprite frame on `/world/...` canvas.
- **FR3**: `public/sprites/walkable/argyra-bold-heart.png` committed (demo sheet; may duplicate `default.png` until custom art).
- **FR4**: `NEXT_PUBLIC_WALKABLE_SPRITE_DEMO` documented for local demo.

## Verification

- Load `/world/:instance/:room` with avatar gate satisfied; with demo env on, sprite path is `argyra-bold-heart`; move with WASD — frame changes.
- Turn demo env off — player uses real `avatarConfig` URL.

## Dependencies

- [.specify/specs/walkable-sprites-implementation/spec.md](../walkable-sprites-implementation/spec.md)
- [docs/WALKABLE_SPRITES.md](../../../docs/WALKABLE_SPRITES.md)

## References

- Conclave `cursor_spec.md` / `sprite_issue.md` entry points.
