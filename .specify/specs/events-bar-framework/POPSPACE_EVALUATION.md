# PopSpace evaluation (Phase 4)

**Purpose:** Decide whether [PopSpace](https://pop.space) (or similar) should replace or augment the in-app **SpatialMap** / `/world/...` experience for Events BAR Phase 4.

**Status:** Evaluation notes for product; no vendor commitment.

## Current stack (MVP shipped in Phase 4)

- **`Instance.spatialMapId`** → Prisma `SpatialMap` + `MapRoom` tilemaps, anchors, presence hooks.
- **Entry:** Event page **“Enter the space”** deep-links to `/world/[instanceSlug]/[roomSlug]` (see `getWorldVenueEntryForInstance`).
- **Runtime:** `RoomCanvas` + `enterSpatialMap` / lobby patterns — first-class in-repo, no third-party venue iframe.

## Evaluation criteria

| Criterion | In-app SpatialMap | PopSpace / Gather-like SaaS |
|----------|-------------------|------------------------------|
| Data ownership / PII | High — stays in BARs DB | Depends on vendor DPA / export |
| OSS / forkability | Full | Low — API or embed only |
| Mobile + phone-first | Build ourselves | Often stronger out of the box |
| Live video / screensharing | Not core yet; `channelId` reserved | Often core |
| Consent / community allergy (Portland context) | Aligned — no extra tracker by default | Vet embed scripts and privacy policy |
| Build cost | Ongoing | Lower time-to-first-venue |
| Brand / ritual fit | Fully themable | Constrained by product chrome |

## Recommendation

1. **Near term:** Ship and iterate on **in-app venue** (Phase 4 link + existing world). Use **optional** external links (Partiful, calendar, etc.) from event copy where useful — already aligned with phone-first notes in `PHONE_FIRST_IMPLEMENTATION_PLAN.md`.
2. **Revisit PopSpace** when requirements explicitly need: **embedded video-first venue**, **minimal engineering**, or **non-dev event ops** owning layout without admin map editor.
3. **If evaluating PopSpace:** Request data flow diagram, SSO options, embed vs pop-out, retention of attendee identities, and **export / delete** paths before pilot.

## References

- Strand consult: `STRAND_CONSULT.md`
- Phone-first / Partiful research: `PHONE_FIRST_IMPLEMENTATION_PLAN.md`
- Code: `src/actions/spatial-maps.ts` (`getWorldVenueEntryForInstance`), `src/app/event/page.tsx`, `src/app/world/[instanceSlug]/[roomSlug]/page.tsx`
