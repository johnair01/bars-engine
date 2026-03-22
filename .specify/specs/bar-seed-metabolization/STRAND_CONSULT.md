# Strand consult: BAR seed metabolization & backlog composting

**Purpose:** Think through a **human + system** problem: many BARs (digital and physical) that need **context (“soil”)**, **maturity**, and **composting** so the holder is not stuck in anxiety-driven backlog hygiene. Align with BARS language (seeds, charge, clean up, curiosity).

**Suggested strand order:** Shaman → Architect → Challenger → Regent → Diplomat → **Sage** (synthesis last).

**When running with agents:** Paste **Shared context** below into the strand subject; ask each face for **observations, risks, recommendations** (≤15 bullets each). Sage produces **integration brief + candidate backlog/spec tasks**.

**Optional script (future):** `npm run strand:consult:bar-metabolization` — mirror `scripts/strand-consult-bar-share-porosity.ts` with `OPENAI_API_KEY` + backend.

---

## Shared context (paste into strand)

### Player / designer situation

- Many **BARs** in-account and **physical BARs** at home — hard to **organize** into something the **system** and the **psyche** can digest.
- Metaphor: **Scannerz / Monster Rancher** — a **medium** (CD) **surfaces** a creature with **game context**; want BARs to act as **seeds** that **know their soil** (campaign, nation, era, relationship to other arcs).
- Need to **compost** what no longer serves — not hoard; **reduce** anxiety backlog, not add another “productivity” pile.
- Emotional goal: shift default from **anxiety + frustration** as the engine of cleanup toward **curiosity, excitement, triumph, poignance** — i.e. **emergent energy** from the **whole garden** (many seeds together), not shame for being behind.

### Codebase gap (today)

- No canonical **in-game** loop to **metabolize** a BAR (seed) or **mature** it (make it more metabolizable): tagging context, linking to campaign/thread, “planting” vs “composting,” ritual completion.
- **Charge → suggestion → quest** exists in places; **inventory / archive / soil** for BARs is thin compared to creation velocity.
- **Clean Up** exists in transformation grammar (registry + narrative) but not as a **player-facing “BAR garden”** mechanic.
- **Compost** pattern exists for **specs/backlog** (`ARCHIVE.md`, `compost:backlog`); analogous **player compost** is not first-class.

### North-star questions

1. What is **minimum viable “soil”** for a BAR (structured context the system can read)?
2. What is **maturity** — states from “raw capture” → “planted” → “fruiting” → “composted”?
3. How do we **reward** composting and contexting without **moralizing** hoarding?
4. How does **one** ritual use the **energy of the whole backlog** (Monster Rancher: the disc *collection* matters) without overwhelming UX?

---

## 1. Shaman — threshold, charge, what’s under the names

**Observations**

- Backlog pain is often **undischarged significance** — each BAR still whispers “someday I’ll honor you”; the heap becomes **numb fog**.
- Anxiety-as-driver **freezes** the hands; curiosity **opens** the next smallest touch (one BAR, one breath).
- Physical BARs add **embodied shame** (visible pile); digital BARs add **invisible weight** — both need a **threshold ritual** (“I’m choosing one vessel today”).

**Risks**

- A “clean your BARs” feature can land as **inner critic** with XP — recreating the punishing productivity stack.

**Recommendations**

- Name the loop as **witness → choose → metabolize or compost** — never “clear inbox.”
- Offer **one-at-a-time spotlight** (Scannerz: **one disc** → **one creature**) as default; bulk stays **advanced**.
- Copy: **charge** the seed by **naming soil** (“this belongs to …”) not by “fixing” the person.

**Output tag:** `shaman: { observations[], risks[], recommendations[] }`

---

## 2. Architect — system shapes: states, fields, transitions

**Observations**

- **Soil** = structured links + tags: `campaignId?`, `threadId?`, `nationLibraryId?`, `archetypeKey?`, `era` (Kotter/instance), `plantedAt`, **`maturity`** enum, **`compostedAt`** / archive flag.
- **Maturity** could mirror quest grammar: **Wake** (captured) → **Clean** (context named) → **Grow** (linked / elaborated) → **Show** (shared or acted) → **Integrate** (BAR closed loop or ritual complete).
- Physical BARs might be **represented** as one digital twin or **QR/stub** linking to the same `customBar` lineage.

**Risks**

- Over-modeling before playtest — **5 states** beats **15 fields**.

**Recommendations**

- **MVP data:** `context_note` + **single “soil” pick** (campaign OR thread OR “holding pen”) + **maturity** + **composted** boolean + timestamp.
- **API:** `POST /api/bars/:id/metabolize-step` or server action: `{ action: 'name_soil' | 'compost' | 'graduate_to_quest', payload }`.
- Reuse **`nationLibraryId`** / archetype from **quest-seed-composer** patterns for consistency.

**Output tag:** `architect: { observations[], risks[], recommendations[], schema_sketch? }`

---

## 3. Challenger — falsify, edges, bad incentives

**Observations**

- **Gamification** of compost can become **performative** — composting to get points while **avoiding** real grief.
- **“Mature everything”** blocks people who live in **Wake** (rapid capture) legitimately.

**Risks**

- Forced soil on every BAR **raises** friction for high-volume capturers.
- **Shame metrics** (“you have 200 unplanted”) **weaponize** the dashboard.

**Recommendations**

- **Opt-in** garden view; default dashboard stays **gentle**.
- **Compost** requires **one sentence** optional (“what this taught me” / “releasing because…”) — skippable but **slows** impulsive delete.
- **Tests:** power user with 500 BARs; grief-heavy user; child account — must not break.

**Output tag:** `challenger: { observations[], risks[], anti_patterns[], recommendations[] }`

---

## 4. Regent — phasing, gates, what ships first 

**Observations**

- **Phase 0:** Design doc + copy deck + **wireframe** (no schema migration) — validate emotions.
- **Phase 1:** **Inventory** + filter + **single BAR “name soil”** + **compost** with optional note.
- **Phase 2:** **Bulk “holding pen”** + suggested soil from heuristics (nation, last campaign).
- **Phase 3:** **Ritual** using **whole backlog** (weekly “choose 3 to touch” / “one random BAR” Monster Rancher draw).

**Risks**

- Building Phase 3 before Phase 1 → empty **spectacle**.

**Recommendations**

- Ship **Phase 1** behind feature flag or **admin-only** first.
- **Definition of done:** user can **reduce anxiety** (self-report prompt) OR **attach soil** to N BARs without **timeout errors** — qualitative + basic metrics.

**Output tag:** `regent: { observations[], risks[], recommendations[], phases[] }`

---

## 5. Diplomat — trust, community allergy, language

**Observations**

- Portland/community **allergy to AI** (per project ethos): **non-AI path** must feel **first-class** — ritual can be **manual** tags, printed cards, no LLM.
- **Triumph** and **poignance** need **language** that isn’t corporate (“streak,” “optimize”).

**Risks**

- Shared “compost pile” metaphors might read **gross** or **flippant** to someone mid-grief.

**Recommendations**

- Offer **two skins** for copy: **Playful** (Rancher energy) / **Solemn** (releasing ritual).
- **Diplomat bridge:** if BAR becomes **shared**, soil includes **consent** visibility — what co-players see.

**Output tag:** `diplomat: { observations[], risks[], recommendations[] }`

---

## 6. Sage — integration brief

### Synthesis

The personal problem **is** the product problem: **BARs lack a bounded loop** for **(a) context**, **(b) closure**, and **(c) emotional reframing** of the backlog. The fix is not “better sorting” alone — it’s a **Clean Up**-flavored **game move** that turns **aggregate backlog** from **threat** into **terrain** (curiosity about the whole field) while **honoring** one seed at a time (Scannerz). **Compost** is **integral** to the loop — permission to **release** with trace (“what it taught”) links to **roadblock metabolism** and **spec compost** already in the culture of the repo.

### Concrete directions

1. **Product:** BAR **Garden** / **Nursery** view — maturity, soil, **Compost** with optional **release note**; optional **random BAR** draw (Monster Rancher **disc** moment).
2. **Data:** Minimally extend `CustomBar` or metadata JSON: **`soilRef`**, **`maturity`**, **`compostedAt`**, **`releaseNote`** (nullable).
3. **Emotion design:** Default framing = **curiosity** (“what’s one seed willing to be known today?”); **triumph** on **compost** + **plant**; avoid shame counters.
4. **Codebase alignment:** Tie **nation/archetype** hints to soil when moving toward quest (`nationLibraryId`); reuse **transformation** **Clean Up** prompts for **copy** in the ritual, not as therapy replacement.
5. **Spec next step:** Spawn spec kit **`bar-seed-metabolization`** (this folder): `spec.md` / `plan.md` / `tasks.md`; link from **GL** / **GD** / **GF** if game-loop scoped; backlog id e.g. **BSM** when ready.

### Candidate backlog row (draft)

| ID | Name | One-liner |
|----|------|------------|
| BSM | BAR Seed Metabolization | Garden view: soil + maturity + compost; emotional frame Clean Up / curiosity; optional Monster-Rancher draw; non-AI first-class path |

---

## Sage task deltas (for `tasks.md` when spec Kit exists)

- [ ] User research: 3 sessions — high-volume capture, grief-heavy, casual.
- [ ] Copy deck: Playful vs Solemn; compost ritual strings.
- [ ] Schema sketch: `soil`, `maturity`, `compostedAt` (Prisma or JSON on `CustomBar`).
- [ ] Phase 1 UI: list + detail actions — Name soil, Compost, Graduate to quest (link existing flows).
- [ ] Optional: weekly “terrain” ritual (whole backlog energy) — feature-flagged.

---

*Strand consult captured: BAR seeds, soil, compost, emotional alchemy framing. Re-run with `bars-agents` / strand script when backend + key available for live synthesis.*
