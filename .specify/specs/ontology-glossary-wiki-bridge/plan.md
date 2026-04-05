# Plan: Ontology glossary wiki bridge (OGW)

## What you’re trying to do (Sage read)

You’re building **shared grammar** so that:

- **Specs, wiki, UI, and GPT** use the **same words** for org vs initiative vs story-skin.  
- **Work composts**: glossary entries become **wiki stubs**, OpenAPI `description` bullets, and **agent context** without rewriting.  
- **Conclave** stays **named as legacy / narrative rail**, not confused with **Instance** (ops container) or **campaign** (bounded initiative).  
- **Narrative Bridge** (extraction ritual → lore-tifact) can **attach** to the same ontology when implemented — no parallel vocabulary.

That is **integration over novelty**: one bridge, many crossings.

---

## Gap summary (engine vs ontology doc)

| Ontology doc concept | Today in `bars-engine` | Gap |
|----------------------|-------------------------|-----|
| Organization = Instance | **`Instance`** row | No dedicated `owner_ids`; stewardship via **`InstanceMembership.roleKey`** + admin. |
| Campaign = bounded initiative | **No `Campaign` model** | **`campaignRef` string** + **`Instance`** + **`AppConfig.activeInstanceId`** — split mental model. |
| Sub-campaign | **`Instance.parentInstanceId`**, **`QuestThread.instanceId`** | No unified “campaign tree” API; admin UI list-first. |
| Narrative overlay | **Metadata** on `Instance` / `CustomBar` JSON | OK for v1; glossary names it; optional future table. |
| BAR lineage | **`campaignRef`**, **`collapsedFromInstanceId`**, etc. | Scattered; glossary + future “lineage” field on key APIs. |

**Full audit:** see prior gap analysis; this plan **does not duplicate** — it **indexes** it for wiki + backlog.

---

## Step-by-step implementation

### Phase A — Land artifacts (this spec kit)

1. Add **`GLOSSARY.md`** with stable term IDs and optional `wiki_slug`.  
2. Add **`COPY_VIOLATIONS_INVENTORY.md`** with methodology + seed findings.  
3. Add **`NARRATIVE_BRIDGE_SIX_FACE.md`** (six-face analysis of narrative bridge ingest).  
4. Register **OGW** in [BACKLOG.md](../../backlog/BACKLOG.md).

### Phase B — Compost hooks (optional, small)

5. Add one **wiki stub** under `docs/wiki/` **or** link from existing handbook doc — **only if** repo already has wiki layout; else glossary `wiki_slug` stays **future path**.  
6. Cross-link **CSC** (campaign subcampaigns), **CHS** (hub/spoke), **bar-quest-link-campaign-drafts** from glossary “see also” lines.

### Phase C — Copy remediation (separate PRs)

7. Triage **`COPY_VIOLATIONS_INVENTORY.md`** by severity; fix **P0** (wrong permissions / money paths) first.  
8. Batch **P1** player-facing strings using glossary canonical phrases.  
9. Leave **`/conclave/*`** route structure as-is unless **CHS** migration plan says otherwise.

### Phase D — When schema work exists

10. Reconcile glossary with **`Campaign` table** if introduced (CSC / ontology spec follow-up).  
11. Add **`GET` glossary JSON** or **OpenAPI tag descriptions** — optional export for Custom GPT.

---

## Risks

- **Over-editing** “Conclave” in brand-forward marketing before product defines **public name** for the narrative rail.  
- **Glossary drift** if not updated when Prisma field names change — **tasks.md** includes “bump glossary on schema change” as checklist item for ontology-touching PRs.
