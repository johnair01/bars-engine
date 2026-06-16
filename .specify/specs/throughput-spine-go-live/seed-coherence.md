# Seed Coherence — the Show Up move (TSG Phase 1)

> Phase 1 deliverable for [spec.md](./spec.md) FR1. Locks the MVP seed set and
> records the deferred Show-Up artifact roadmap so go-live isn't blocked on it.

## The move

The **seed** step in the spine *is* the BARs Engine **Show Up** move: it turns a
metabolized charge (a BAR) into something that exists in the world. The
`GrowFromBar` affordance (on `/bars/[id]`) is reframed as **one gesture — "Seed
this BAR" — under the Show Up banner**, not three unrelated buttons.

## MVP seed set (v1 — ships for go-live)

| Form | What it is | Action | Lands at |
|------|-----------|--------|----------|
| **Quest** | A doable step, for you or anyone you offer it to | `growQuestFromBar` | `/hand?quest=:id` |
| **Daemon** | A recurring background pull | `growDaemonFromBar` | `/daemons` |
| **Artifact** | A made thing — **generic GrowthScene** for v1 | `growArtifactFromBar` | `/growth-scene/:id` |

Routing is owned by `src/lib/navigation-contract.ts` (`grow_quest` /
`grow_daemon` / `grow_artifact`) — post-seed lands the player in the right place
(the quest in the Hand, the daemon room, the artifact scene), no guessing.

## Deferred Show-Up artifact types (roadmap — DO NOT block go-live)

The Show Up move can eventually take richer artifact forms. These are explicitly
**out of scope for v1** and tracked here so the MVP set stays small:

- **Story** — a narrative artifact (Twine passage / prose beat).
- **Ritual** — a repeatable ceremony/practice artifact.
- **Plan** — a structured multi-step plan artifact.
- **Gift** — an artifact authored *for* a specific other player.
- **Deck Card** — an Allyship Deck move card seeded from lived experience.
- **Contact** — a relationship/outreach artifact (who to reach, why).

When built, each becomes another option under the same "Seed this BAR" gesture
with its own `NAV` routing entry — the framing established in Phase 1 already
accommodates them.

## Acceptance

- `GrowFromBar` reads as one Show Up move with three labeled forms + clear copy.
- Each form routes correctly post-seed (existing `NAV` entries; unchanged).
- No new schema; `npm run check` green.
