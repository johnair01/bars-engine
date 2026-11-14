# Legacy Nation-Homeroom Lobby — Deprecation Notice

**Status:** Deprecated for new product work as of 2026-10-27.

## Decision

The nation-homeroom Pixi lobby is no longer the canonical player-home/world-entry model. Do not add new rooms, portals, mechanics, content, or visual work to it.

The current world direction is the Blender/Three.js Between room system:

- **Nook** — the player's private homeroom and current home spawn.
- **Hope Mirror** — an earned, placeable Nook item used for the player's Look.
- **Doorway beside the mirror** — the threshold to shared rooms, including the Between.
- **Between** — a two-person shared hollow, with its own persisted room state.

Relevant implementation lineage:

- `54540aa1` — Between rooms part 1: homeroom and room model.
- `c8523b72` — homeroom page, room sheets, and next card.
- `7e92e52a` — homeroom spawn and doorway flow.
- `4a8c89e0` — mirror and walked check-in.
- `cd8987a8` — Nook shell, spots, satchel, and earned items.

## Legacy Surface (maintenance only)

The deprecated lobby includes:

- `scripts/seed-bar-lobby-world.ts`
- `src/app/lobby/`
- `src/lib/spatial-world/pixi-room.ts`
- the `bar-lobby-world-v1` spatial map and its nation-room anchors

It remains in place temporarily for compatibility with existing routes/data. Treat it as **maintenance-only**: repair breakage if necessary, but do not route new experiences through it.

## Consequence for New Spaces

New private-world thresholds—including the Mastering Alchemy Triangle Workshop—must be designed as a physical Nook exit or Nook object in the Between-room system, not as a `SpatialMapAnchor` in the legacy nation lobby.

Before removal, make a separate migration/decommissioning plan that inventories active routes, players, seeded records, and redirects. Do not delete the legacy map opportunistically; retired systems have a talent for hiding a last occupied chair.
