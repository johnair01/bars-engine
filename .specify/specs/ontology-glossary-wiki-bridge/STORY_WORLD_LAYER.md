# Story world vs DB Instance — implementation contract

**Goal:** Encode the distinction (ops container vs narrative flavor) **without** a second `Instance` for Conclave.

## Rules (Regent + Architect)

1. **Exactly one `Instance` row** per real-world org (or agreed campaign container) — **no** `instances` row for “Conclave” as org.
2. **Story world** = **layer on top**: `Instance` text/JSON fields (`narrativeKernel`, `storyBridgeCopy`, `wakeUpContent`, …) + **Conclave routes** as **entry rail**, not alternate membership.
3. **Story-only information** (NPC ignorance, mythic framing) must not be the **sole** source for money, legal, or permission checks — use **`InstanceMembership`** + admin for ops.

## Code

| Artifact | Purpose |
|----------|---------|
| `src/lib/ontology/content-layer.ts` | `ContentLayer` (`ops` \| `story`), `StoryEngineSubsystem` enum for docs/feature boundaries |
| `src/lib/ontology/index.ts` | Barrel export |
| `CampaignDraft.contentLayer` | Persisted on **`campaign_drafts`**; **POST/PATCH `/api/campaign-drafts`** accept `contentLayer` (default **`story`**) |

**Usage (incremental):**

- New JSON payloads (GPT, wizard, lore) may include `"contentLayer": "story"` at root for triage.
- Emotional alchemy / CYOA / Conclave flows: import `STORY_ENGINE_SUBSYSTEMS` in feature flags or logging — **do not** require for `matchBarToQuests` core path.

## Future (optional migration)

- `Instance.storyOverlayConfig` **Json?** — only if you need **structured** story config beyond existing fields; keep **ops** in core columns.

## Glossary

See [GLOSSARY.md](./GLOSSARY.md) rows: `db_instance_ops`, `story_world_layer`, `story_engine`.
