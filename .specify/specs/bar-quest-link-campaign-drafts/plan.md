# Plan: BAR ↔ quest links and campaign drafts

## Outcome

An implementable sequence that respects **D1–D4** in [spec.md](./spec.md): canonical quest catalog + provenance, **BarQuestLink**, tiered review, **campaign drafts** with braided arcs, **Octalysis-light** schema, **in-app loop before bulk API**.

---

## Phases

### Phase 0 — Contracts & schema design

- Freeze **match result DTO** (primary + secondaries + score factors) — align with `matchBarToQuests` output; document deltas.  
- Design **BarQuestLink** (or reuse/extend existing tables if any) + migration strategy; **backward compatibility** for existing BAR registry payloads.  
- Design **CampaignDraft** (+ `CampaignArc` / join rows per spec depth — MVP may collapse some fields into JSON with a migration path).  
- Add **quest catalog** model or confirm **CustomBar / Quest / library** table as anchor — per **D1** (single logical catalog + provenance).  
- Document **review policy** matrix: private vs shared → `proposed` vs auto-accept flags.

### Phase 1 — In-app “Chapter 1” slice

- Minimal **player-facing** flow: create or select BAR → **see suggested quests** with **reasons** → accept path to **take quest** or **save link** (exact UX in tasks).  
- **Steward** path (if applicable): list `proposed` links, accept/reject.  
- **No** requirement yet for GPT bulk or clustering.

### Phase 2 — Campaign draft MVP

- **Create/edit** campaign draft from selected BAR ids + campaign context payload.  
- Persist **playerArc** + **campaignContext** + ordered arcs (per ingested v2).  
- Status workflow: `draft` → `review` → `approved` (optional `archived`).

### Phase 3 — GPT / OpenAPI / bulk

- **Bulk** BAR registry create + **bulk** match (ingested endpoints).  
- **Clustering** endpoint — start **simple** (steward-assisted or heuristic) unless product demands ML.  
- Wire **Custom GPT** / OpenAPI to same matcher + link + draft APIs.

### Phase 4 — Motivation & loops (post–MVP)

- **LoopTemplate** entity + `GET/POST /api/loop-templates` (if still desired).  
- **`infer-motivation`** API **only** with evaluation harness + review UI (**D3**).  
- **Campaign arc** extensions: `coreDrives[]`, `loopTemplates[]`, `engagementNotes` (`bars_game_loop_architecture_spec.md`).

---

## Dependencies

| Dependency | Role |
|------------|------|
| `match-bar-to-quests` | Baseline scoring; extend, don’t fork silently |
| `bar-registry` API | BAR persistence + analysis |
| Auth / roles | Steward review for **D2** |
| Prisma / migrations | New tables per Phase 0 |

---

## Risks

| Risk | Mitigation |
|------|------------|
| Quest catalog drift | Single table + provenance; import pipelines write same shape |
| Review fatigue | Tiered defaults; batch UI for stewards |
| Scope creep (Octalysis) | **D3** — schema only in v1 |
| GPT before trust | **D4** — Phase order enforced |
