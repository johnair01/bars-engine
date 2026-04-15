# Six Game Master faces: Narrative Bridge spec (ingest analysis)

**Source:** Narrative Bridge System — extraction ritual + lore-tifact pipeline (user-provided ingest).  
**Canonical faces:** Shaman, Challenger, Regent, Architect, Diplomat, Sage — `.cursorrules`.

---

## 1. Shaman — threshold & vessel

**Read:** The spec names **two instances** — “Bruised Banana (Real World)” vs “Conclave (Narrative UI).” In **this** codebase, **Conclave is not a second `Instance` row** — it is primarily a **route rail** (`/conclave/*`) and **overlay psychology**. The **vessel** is still **`Instance` + membership**; Conclave is **how you step through the door**.

**Implication:** Bridge copy should say **“narrative entry”** or **“story rail”**, not **“Conclave instance”** unless you add a **real** second Instance with explicit ops boundaries.

---

## 2. Challenger — prove the split

**Read:** “One-way causal leakage” and “NPCs unaware of real world” are **strong rules**. They fail if **permissions** or **donation URLs** are inferred from **story** metadata.

**Implication:** **EXTRACTION_RITUAL** outputs must **tag** operational vs narrative fields in DTOs; **Challenger** demands tests: no money path keyed only on `narrativeKernel`.

---

## 3. Regent — governance & blessed state

**Read:** Lore-tifacts = **blessed** after validation; **Reliquary** is curated myth-layer.

**Implication:** Align with existing **admin / steward** gates (book quests, agent proposals). **Blessing** = explicit state transition + **actor id** — same family as **BarQuestLink** `proposed → accepted`.

---

## 4. Architect — schema & pipelines

**Read:** Pipeline **ArtifactDraft → validation → LoreTifact → Reliquary**; MTGOA as **protocol** layer.

**Implication:** Map to **concrete models** before coding: e.g. `Artifact` / `BlessedObjectEarned` / `EventArtifact` — **do not** fork “artifact” three ways without a **unifying provenance JSON** (see glossary `provenance`). **DeckAuthoringIntake**-style JSON is precedent for **ritual intake**.

---

## 5. Diplomat — participant language

**Read:** Players experience **ritual** and **prizes**, not “ontology.”

**Implication:** UI: **“Your extraction”**, **“A keepsake from your quest”**; hide **LoreTifact** schema names until inspect/debug surfaces.

---

## 6. Sage — integration & compost

**Read:** MTGOA → Bars Engine → **two worlds** ↔ **shared economy** → BARs / vibeulons / lore-tifacts.

**Implication:** **One glossary** (`GLOSSARY.md`) must absorb **lore-tifact** and **extraction ritual** so **OGW**, **Narrative Bridge**, and **CHS** don’t invent three vocabularies. **Compost:** narrative bridge tasks **link** to Instance/campaign ref, not a parallel org chart.

---

## Cross-links

- [GLOSSARY.md](./GLOSSARY.md) — add `lore_tifact`, `extraction_ritual` rows (done).  
- [plan.md](./plan.md) — Sage “what you’re trying to do.”  
- Future implementation spec when **EXTRACTION_RITUAL** ships: reference **Bar forge**, **321**, **vault compost** for shared ritual language.
