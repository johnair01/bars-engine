# Strand output: CYOA Modular Charge Authoring

**Consult run:** 2026-03-20 (Cursor agent — six-face pass per [STRAND_CONSULT_SIX_FACES.md](./STRAND_CONSULT_SIX_FACES.md))  
**Subject:** Lego-robotics UX for modular CYOA; charge → typed blocks → Twee; grammar-owned topology vs AI prose.

---

## 1. Shaman (liminal / charge / terrain)

**Observations**

- Fear of **being boxed in**: “Blocks” can feel like the system knows the user’s story better than they do — unnamed resistance unless **optional depth** is obvious (expert lane = current CYOA / AI dump still exists).
- Desire for **dignity of the charge**: users want the UI to feel like **witnessing**, not **intake**; labels must sound like **moves** (Wake / Hold / Turn) not clinic or ticket fields.
- **Charge leaks** when: (a) palette appears before any **embodied** input from BAR/charge, (b) every block requires prose before “run”, (c) errors shame (“invalid graph”) instead of inviting **one-block fix**.
- Unnamed fear: **Lego = childish** for serious campaign owners — ritual language must elevate to **craft** / **forging** / **path**.

**Risks**

- Clinical block names (“regulation,” “intervention”) **flatten** affect; allyship domains can **instrumentalize** emotion if copy is careless.
- Over-typing **Who** early can freeze people who need to **circle** the fire first.

**Recommendations**

- Palette tooltips use **game language**: WHO / WHAT / WHERE / **Energy** / **Personal throughput** (tie to existing quest grammar unpacking).
- First touch: **one block** = “What moved you?” (free) → then suggested types, not empty palette.
- Reserve the word **“charge”** or **“felt sense”** in UI where “input” would go in a generic tool.

---

## 2. Architect (structure / system / compile)

**Observations**

- **Node archetypes v0 (7):** `Scene` (exposition/beats), `Choice` (2+ labeled edges), `Metabolize` (reflect / name tension), `Commit` (irreversible story beat), `BranchGuard` (domain/lens/tag predicate), `Merge` (convergence from branches), `End` (completion / handoff). *Map `Merge` + `BranchGuard` to MVP-optional if linear v0 ships first.*
- `<<include>>` ↔ **IR `fragmentRef`**: named subgraph inlined at compile. `<<widget>>` ↔ **`macro`** node: parameters → expanded Twee / passage stubs at export.
- **Validation pipeline (order):** ingest blocks → **build directed graph** → typecheck (out arity, End reachability) → **slot fill** (optional AI for text) → **lint** (orphan, dead choice) → **serialize Twee** → optional **simulate** one path.

**Risks**

- **Ink-like modules** in internal model tempt a **second compiler**; defer until v0 export path is **one IR → Twee** with tests.
- Flat Twine namespacing: collision if fragments lack **campaign-scoped prefixes**.

**Recommendations**

- Store **canonical IR JSON** alongside Twee in dev seeds; round-trip test: IR → Twee → parse → structural equality modulo ids.
- **Cap v0 depth:** max branch width 3, max depth N (config) to match Challenger limits.

**ir_sketch (v0)**  
`Story { nodes: Node[], edges: Edge[], fragments: Fragment[], startId, endIds[] }` where `Node.kind ∈ Scene|Choice|Metabolize|Commit|BranchGuard|Merge|End`.

---

## 3. Challenger (rupture / falsify / edge cases)

**Observations**

- **One-shot AI** defeats modular UX if “Generate with AI” stays the **primary** CTA above palette — users never learn snaps; **default path** must be **structure first** (DJ aligned), AI as **fill** or **suggest**.
- MVP ignores **state divergence** (variables) at peril if BranchGuard promises domain without runtime state — v0 either **no guard** or **compile-time** tags only.

**Risks**

- Orphan **Choice** arms; **dead ends** without `End`; **loops** without progress marker → player traps.
- Lazy stacking: empty Metabolize nodes, **diamond** without merge → ambiguous reader.

**Anti-patterns**

- “Generate whole adventure” without graph review.
- Palette without validator (Twine export succeeds but story unwinnable).

**Recommendations — falsification tests (fail fast, helpful)**

1. **Unreachable End:** compile → error on first unreachable node id; UI highlights **one** offending edge.
2. **Choice with one arm:** reject or auto-flatten to linear with warning (“Add a second path or we’ll treat this as linear”).
3. **Publish with zero End:** block publish; message “Stories need a landing — add an **End** block.”

---

## 4. Regent (order / phasing / gates)

**Observations**

- **Gate:** No **player-facing** palette until **admin** skeleton + validator + export path green in CI (or manual checklist).
- **Gate:** No **Ink knot** exploration until Twee round-trip stable for **5 golden** graphs.
- **Linear dependencies:** **DJ** (skeleton-first, feedback) → **CMA IR** (types + validation) → **twine-authoring-IR** (fragment/include) → **flow-simulator** or minimal `validateQuestGraph()` in repo.

**Risks**

- Lego metaphor → **full Blockly** (drag graph editor) — **out of scope** for Phase 2 MVP.

**Phase gates**

| Forbidden until | Allowed |
|-----------------|---------|
| Validator + tests | “Palette” label in prod |
| Admin-only MVP signed off | Player library |
| Export round-trip | Campaign-scoped fragment library |

**Definition of done — Phase 2 MVP**

- Admin can assemble **≥5 node** story from palette only (no free Twee paste required for happy path).
- Compile produces Twee that **loads** in existing reader; **validate** passes; **one** falsification test automated in CI.
- Copy deck: 2-minute path doc + Shaman-aligned tooltip pass.

---

## 5. Diplomat (relational / onboarding / culture)

**Observations**

- Frame AI as **“opt-in acceleration”** / **“forge assistant”** — never “the author”; dual-track copy: **“Structure without AI”** visible first.
- **2-minute path:** (1) Open quest grammar / block mode → (2) Place Scene + Choice + End → (3) Preview run one path → (4) “Optional: fill with AI.”
- **Exclusion:** high cognitive load palettes; **motor** drag-heavy only — offer **linear list** mode same IR; **ESL** — short sentences, icons + words.

**Risks**

- **AI-first** marketing triggers community allergy; **cert** quests should say “verify structure,” not “verify genius.”

**Copy principles**

- Errors: **“This piece doesn’t connect yet”** not “Invalid DAG.”
- Tooltips: **what the player experiences**, not the implementation (e.g. “Two doors the reader can open”).
- Align **Report Issue** with cert pattern: FEEDBACK passage, no shame stack traces in player-facing copy.

**Recommendations**

- **Public doc** line: “BARS works fully without LLMs; AI shortens iteration for those who choose it.”

---

## 6. Sage (integration / synthesis)

### Conflicts and synthesis

- **Shaman** wants warmth and circling; **Architect** wants cold types — synthesis: **types are costumes for moves**, not labels for people; first block is always **felt**, then type.
- **Challenger** demands rigor; **Diplomat** demands softness — synthesis: **fail fast with gentle copy** + localized highlight.
- **Lego vs Twine** — synthesis: **Lego at author time**, **Twine at export**; never ask Campaign Owner to read Twee for MVP.

### Integration brief (one page)

**Smallest coherent whole:** Admin-only **linear + one Choice + End** palette, IR JSON, validator (3 falsification rules), compile to Twee, preview in existing adventure reader. AI = **fill Scene/Metabolize text** only after graph valid. Charge bridge = **suggestions** only, Phase 3.

### Task deltas (apply to [tasks.md](./tasks.md))

- Add Phase 1: document **7 archetypes** + IR sketch + validation order in `ARCHITECTURE` or `ADR-cma-v0.md`.
- Add Phase 2: implement **validateQuestGraph** (or extend existing) + 1 CI test.
- Add copy pass item: **Diplomat** error/tooltip strings before external pilot.

### Deferred explicitly

- **Ink knot compilation**, **player-facing palette**, **visual graph editor** (full Blockly) — post–MVP review after admin round-trip proven.

### Open questions

- Does **I Ching / lens** from DJ become a **BranchGuard** archetype or stay **separate wizard step** before palette?
- **Campaign ref** scoped fragments vs global template library — ownership model for NSPE / multi-tenant?

---

## Sage (MCP synthesis) — second pass

**Invoked:** HTTP `POST /api/agents/sage/consult` — same contract as MCP `sage_consult`. Script: `npx tsx scripts/run-sage-consult-cma.ts`. **Run:** 2026-03-21 (`deterministic: false`, Shaman + Architect consulted per response metadata).

### Synthesis (from Sage `output.synthesis`)

1. **Emotional Journey:** Embrace initial emotional grounding for authors with a prompt like "What moved you?" before presenting an empty authoring palette. Create labels in the game language to resonate emotionally and intuitively.
2. **Node Variety:** Ensure diverse node types (scene, choice, metabolize, commit, branch_guard, merge, end) to foster narrative flexibility. Validation precedes AI augmentation to maintain creator's intent.
3. **AI Utilization:** Treat AI as an ancillary tool—engage it post-validation for flavor and richness, not as a primary content generator.
4. **Linear Foundation:** Establish a learning scaffold combining linearity with choice (smallest complete form) to teach fundamental storytelling constructs.
5. **Validation First:** Implement a robust validateQuestGraph step prioritizing logical consistency (NO_END, UNREACHABLE_END, CHOICE_SINGLE_ARM).
6. **Admin Prioritization:** Focus on admin tooling for end-to-end authoring/testing cycle. Player palettes follow successful admin feature rollout.
7. **Feedback Integration:** Embed feedback loops through early test readers to refine narrative experiences and gather user insights.
8. **Gentle Error Handling:** Enable error notifications that guide rather than frustrate, ensuring a supportive environment for authors.

**Open questions (Sage recommendations framed):**

- **A — BranchGuard vs wizard:** Use I Ching / flow clarity to choose whether BranchGuard is autonomous or a pre-palette wizard step; trade complexity reduction vs explicit lens in the graph.
- **B — Fragment scope:** Campaign-specific vs global template library; ownership and multi-tenant access.

**Next 3 tasks (Sage):**

1. Complete ADR-cma-v0 alignment + **validateQuestGraph** in repo (Phase 1 — largely done; wire CI if not already).
2. **Node type specification** — document each archetype’s role and interaction rules.
3. **Twee export** after validation is stable and tested.

**One defer:** Player palette until admin authoring cycle is proven.

### Raw API response (abbreviated)

`agent: sage`, `discerned_move: wake_up`, `consulted_agents: ["Shaman","Architect"]`. Full JSON available in terminal log or re-run `npx tsx scripts/run-sage-consult-cma.ts`.

---

## Coordinator checklist

- [x] STRAND_OUTPUT filled (this file)
- [x] Spec **Design Decisions** updated (strand consult row — see spec.md)
- [x] **plan.md** Changelog updated
- [x] **tasks.md** Phase 0 consult + Phase 1 concrete tasks
- [x] **`npm run verify:bars-agents-mcp`** / backend Sage path verified for this run
- [x] **`sage_consult`** (HTTP) run; synthesis pasted above
