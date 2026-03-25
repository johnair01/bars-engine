# Spatial world (Pixi maps)

## Map mount (anti-fragile note)

The Pixi session is created in **`useLayoutEffect`** in `useSpatialRoomSession.ts`, not a plain `useEffect`. A normal effect can run before the container ref is attached; the hook would bail on `!containerRef.current` and **never retry** (same `spatialBindKey` / `spriteReady`), which showed up as a **black `/world` map until a full refresh**.

`mountSpatialRoomSession` is async; failures are **logged** (`[useSpatialRoomSession] Pixi mount failed`) so silent init errors are easier to see in the console.

**Related:** world route shells live under `src/app/world/`; lobby map data is seeded (e.g. `scripts/seed-bar-lobby-world.ts`). If the DB has no map, `/world` shows “No world configured yet” — that’s a data preflight, not this mount path.
