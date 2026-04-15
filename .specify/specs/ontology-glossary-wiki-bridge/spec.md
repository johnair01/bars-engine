# Spec: Ontology gap analysis, glossary index, and wiki-ready compost

**Status:** Spec kit — documentation + inventory; drives wiki pages and future schema work without blocking shipping.  
**Backlog ID:** OGW ([BACKLOG.md](../../backlog/BACKLOG.md)).  
**Related:** Bruised Banana instance/campaign ontology (external ingest), [campaign-hub-spoke-landing-architecture § Conclave](../campaign-hub-spoke-landing-architecture/spec.md#conclave-as-legacy-campaign-entry), [bar-quest-link-campaign-drafts](../bar-quest-link-campaign-drafts/spec.md).

---

## Purpose

1. **Freeze vocabulary** for Instance / Campaign / sub-campaign / overlay so engineering, GPT, and wiki stay aligned.  
2. **Publish a compostable glossary** — one term index that can **spawn wiki articles**, OpenAPI descriptions, and onboarding copy without rewriting from scratch.  
3. **Inventory Conclave / instance / campaign copy violations** with a repeatable audit method (grep + human triage).  
4. **Bridge** ontology work to **Narrative Bridge** and **hub/spoke** specs without duplicating prose (Sage-level deftness: **write once, reference many**).

**Canonical Game Master faces** (when tagging narrative or API copy): **Shaman, Challenger, Regent, Architect, Diplomat, Sage** only — `.cursorrules`, `src/lib/quest-grammar/types.ts`.

---

## Product decisions (locked)

### D1 — Narrative overlay v1

- **Decision:** Overlays remain **metadata** on `Instance` / quest-shaped `CustomBar` / JSON blobs — **no** `NarrativeOverlay` table until a spec explicitly requires query-by-overlay.  
- **Rationale:** Matches current schema; glossary still names “overlay” as a **concept** for wiki and GPT.

### D2 — Glossary as source of truth for wiki stubs

- **Decision:** **`GLOSSARY.md`** is the **index**; each entry includes optional **`wiki_slug`** (target path under project wiki conventions). Wiki pages **link back** to spec kit + Prisma field references.  
- **Rationale:** Compostability — same definitions feed docs generators, Cursor context, and player handbook excerpts.

### D3 — Copy violations are inventory-first

- **Decision:** **Do not** mass-edit UI in this spec’s v1; **ship** `COPY_VIOLATIONS_INVENTORY.md` with **severity**, **file**, **recommended phrase**, and link to **canonical glossary term**. Bulk copy fix is a **follow-up task** or separate spec.  
- **Rationale:** Avoid drive-by string changes that break tests or locale; Regent-style controlled rollout.

---

## Deliverables

| Artifact | Path |
|----------|------|
| Term index (wiki-ready) | [GLOSSARY.md](./GLOSSARY.md) |
| Story world vs DB Instance — **implementation contract** | [STORY_WORLD_LAYER.md](./STORY_WORLD_LAYER.md) |
| Code: `ContentLayer` + story-engine subsystems | [`src/lib/ontology/content-layer.ts`](../../../src/lib/ontology/content-layer.ts) |
| Copy audit methodology + findings | [COPY_VIOLATIONS_INVENTORY.md](./COPY_VIOLATIONS_INVENTORY.md) |
| Narrative Bridge — six-face read | [NARRATIVE_BRIDGE_SIX_FACE.md](./NARRATIVE_BRIDGE_SIX_FACE.md) |
| Gap analysis (engine vs ontology doc) | [plan.md](./plan.md) § Gap summary |
| Tasks | [tasks.md](./tasks.md) |

---

## Non-goals (v1)

- New Prisma models for Campaign or Overlay.  
- Automatic migration of legacy rows.  
- Replacing all `/conclave/*` routes in one pass.

---

## Success criteria

- [ ] Glossary covers **Instance**, **Campaign (product sense)**, **`campaignRef`**, **Conclave (legacy rail)**, **quest-shaped CustomBar**, **Quest (grammar model)**, **Narrative overlay**, **hub / spoke**, **steward / membership**.  
- [ ] Copy inventory lists **≥15** candidate violations or documents “clean below threshold” with grep evidence.  
- [ ] Backlog row **OGW** points here; tasks.md has owners/next step for wiki stub generation (optional script or manual).

---

## References

- Instance/campaign audit (conversation): nested `Instance`, `campaignRef`, `InstanceMembership`.  
- [Narrative bridge spec (ingest)](./NARRATIVE_BRIDGE_SIX_FACE.md) — source concept doc analyzed in six-face file.
