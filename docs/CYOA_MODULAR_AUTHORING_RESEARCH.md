# CYOA / Twine Modular Authoring — Research Note (Game Master)

**Purpose:** Inform maturity work on **grammatical, generated CYOA** so adventures feel less clunky and more **modular**: players/authors assemble story from their own **charge metabolization**, with UX closer to **learning Lego robotics** (progressive, block-based, test-as-you-go) than to “one-shot AI prose dumps.”

**Audience:** Design + implementation.

**Canonical spec kit (implements + strand consult):** [CYOA Modular Charge Authoring](../.specify/specs/cyoa-modular-charge-authoring/spec.md) — includes **six Game Master faces** brief for `strand: consult`: [STRAND_CONSULT_SIX_FACES.md](../.specify/specs/cyoa-modular-charge-authoring/STRAND_CONSULT_SIX_FACES.md).

Related: [quest-grammar-compiler](../.specify/specs/quest-grammar-compiler/spec.md), [onboarding-quest-generation-unblock](../.specify/specs/onboarding-quest-generation-unblock/spec.md), [quest-bar-flow-grammar](architecture/quest-bar-flow-grammar.md).

---

## 1. What “good” looks like in open-source Twine

### 1.1 Core tooling (where the medium is defined)

| Resource | Why it matters |
|----------|----------------|
| [tweecode / Twine (GitHub org)](https://github.com/tweecode) | Official Twine ecosystem; story formats, Twee source tooling — **canonical** representation of passage graph + metadata. |
| [Twine 2 — story formats](https://twinery.org/2storyformats) | Harlowe, Snowman, SugarCube, Chapbook — **different “runtimes”** for the same graph; modularity and macros differ by format. |
| [Twine Cookbook — story formats](https://twinery.org/cookbook/introduction/story_formats.html) | Picking a format = picking a **programming model** for your CYOA. |

**GM read:** Treat “Twine” as **data + engine**. Your app already consumes **Twee / parsed JSON**; maturity means owning a **small, documented subset** (grammar) and **composable blocks**, not every macro in SugarCube.

### 1.2 Modularity in Twine (OSS patterns, not vibes)

| Pattern | Source | Takeaway |
|---------|--------|----------|
| `<<include>>` | [Twine Cookbook — SugarCube modularity](https://twinery.org/cookbook/modularity/sugarcube/sugarcube_modularity.html) | **Reuse passages** as components; same idea as “snippet” or “subgraph.” |
| `<<widget>>` (+ `widget`-tagged passages) | Same cookbook | **Parameterized reusable units** — closest Twine analogy to functions / Lego sub-assemblies. |
| Passage tags + `StoryInit` discipline | Community Q&A (widgets vs StoryInit) | **Load order and reload** matter; maps to our need for **deterministic init** and **save/rehydrate** in generated adventures. |

**GM read:** “Grammatical quest” in product terms ≈ **typed nodes + valid edges + reusable include/widget-like units**. AI should generate **slots and bindings**, not only free text.

### 1.3 Example open-source Twine games/repos (illustrative)

These are **not** endorsements — use as **structural references** (how authors lay out `src/`, `.tw`, Twee export, SugarCube vs Harlowe):

- [matildepark/forgotten](https://github.com/matildepark/forgotten) — Twine source in-repo ( inspect passage naming / file organization).
- [danielbarnes175/SonsOfOrdson](https://github.com/danielbarnes175/SonsOfOrdson) — SugarCube 2 example (macros, structure).
- [apepers/SweeterKindOfFire](https://github.com/apepers/SweeterKindOfFire) — book → Twine conversion pattern.
- [lazerwalker/twine-app-builder](https://github.com/lazerwalker/twine-app-builder) — **packaging** Twine output for distribution (think: “compile quest → artifact”).

**GM read:** OSS Twine games that age well **separate content from engine** and **name passages intentionally** (graph navigability). Clunky generated CYOA often fails here.

### 1.4 Ink (contrast) — when “story feels like code”

| Resource | Why it matters |
|----------|----------------|
| [inkle/ink](https://github.com/inkle/ink) | **Text-first DSL** with knots, stitches, variables — strong for **procedural** and **state-heavy** branching; compiles to JSON for ink-js. |
| [Inkle — Ink documentation](https://www.inklestudios.com/ink/) | Model for **hierarchical** narrative modules (not flat passage grid). |

**GM read:** If Lego-robotics UX is the north star, Ink’s **knot/stitch** mental model is closer to **subroutines** than a flat Twine canvas — worth stealing **concepts** even if shipping format stays Twee/Twine-compatible.

---

## 2. CYOA + AI (landscape, not hype)

| Approach | Example | Relevant lesson |
|----------|---------|-----------------|
| **Human-in-the-loop workflows** | [LlamaIndex — CYOA workflow](https://developers.llamaindex.ai/python/examples/workflow/human_in_the_loop_story_crafting/) | **Structured steps** + human approval beats one-shot generation for playable graphs. |
| **Structured “control panel” generation** | [GroqTales (overview)](https://dev.to/drago03/groqtales-building-an-ai-native-storytelling-engine-on-monad-and-why-i-need-your-help-2kcb) | Many **typed parameters** (structure, characters, tone) → less clunk than a single chat prompt. |
| **Voice / multimodal CYOA** | [WhisperQuest (GitHub)](https://github.com/maxcurrent420/whisperquest) | Open-source pattern: **pluggable LLM**, scene loop, custom stories — aligns with **dual-track** (AI on/off). |
| **Branching from seed text** | Academic / meta-prompting line (e.g. “WHAT-IF” style branching) | **Preserve theme** across branches — useful for **charge-consistent** metabolization. |

**GM read:** Industry is converging on **(1) schema-constrained generation**, **(2) visible graph/skeleton before flavor**, **(3) regenerate with feedback** — which matches your DJ unblock phases. The gap is **end-user composability** (Lego), not more prose.

---

## 3. Lego robotics as UX metaphor (pedagogy → product primitives)

Lego robotics education usually combines:

1. **Blocks with visible affordances** — shape implies where it snaps (typing).
2. **Short feedback loop** — run, see robot move, fix one block.
3. **Progressive complexity** — motors before PID; no “here’s C++ on day one.”
4. **Debugging that’s localized** — wrong block lights up, not whole program voids.

| Lego idea | CYOA / BARS analogue |
|-----------|---------------------|
| Motor / sensor block | **Passage archetypes**: choice, reveal, metabolize, commit, branch-on-state |
| “My blocks” library | **User- or campaign-scoped modules** from past BARs / accepted quests |
| Wiring | **Edges** with guards (`domain`, `lens`, `charge tag`) |
| Test run | **Simulate / preview** one path; grammar validator |
| Tutorial gates | **Unlock** complexity only after prior block “clicks” (deftness stages) |

**Charge metabolization module:** A player’s **charge** becomes **typed input** to a **small palette of block templates** (e.g. “name the tension,” “choose lens,” “one wake / cleanup / grow / show beat”). The compiler **grounds** blocks in Twine/Twee, but the **authoring surface** stays visual and limited — like EduMindstorms block palette, not raw Twee.

---

## 4. Recommendations for BARS (maturity backlog)

1. **Treat “grammar” as the product** — Expose **node types + legal transitions** in UI; AI fills **content inside** types, rarely invents topology ad hoc.
2. **Library of verified subgraphs** — OSS Twine’s `<<include>>` / `<<widget>>` pattern → first-class **template passages** in your IR (see [twine-authoring-ir](../.specify/specs/twine-authoring-ir/spec.md)).
3. **Skeleton-first as default player path** — Already in DJ; extend to **non-admin** “my story from my BAR” with **locked topology**, editable copy.
4. **Simulation harness** — “Run golden path” on generated graph (you have flow-simulator direction in backlog); treat failures as **Roadblock Quests** for the generator.
5. **Format stance** — Stay Twine-compatible **export**, but internal model can be **Ink-like modules** if it improves composition; map to Twee on publish.
6. **Spec kit** — Use [.specify/specs/cyoa-modular-charge-authoring/](../.specify/specs/cyoa-modular-charge-authoring/) (`spec.md`, `plan.md`, `tasks.md`, [STRAND_CONSULT_SIX_FACES.md](../.specify/specs/cyoa-modular-charge-authoring/STRAND_CONSULT_SIX_FACES.md)) before major build work.

---

## 5. Quick bibliography (URLs)

- Twine org / formats: <https://github.com/tweecode>, <https://twinery.org/2storyformats>  
- SugarCube modularity: <https://twinery.org/cookbook/modularity/sugarcube/sugarcube_modularity.html>  
- Ink: <https://github.com/inkle/ink>, <https://www.inklestudios.com/ink/>  
- LlamaIndex HITL CYOA workflow: <https://developers.llamaindex.ai/python/examples/workflow/human_in_the_loop_story_crafting/>  

---

*Last updated: 2026-03-20 — Game Master / Sage strand: external scan + BARS framing; not a commitment spec.*

---

## 6. Strand consult (research execution)

**First pass (six faces, in-repo):** [.specify/specs/cyoa-modular-charge-authoring/STRAND_OUTPUT.md](../.specify/specs/cyoa-modular-charge-authoring/STRAND_OUTPUT.md) — Shaman through Sage; v0 node archetypes; validation pipeline; phase gates; copy principles; deferred scope (Ink, full Blockly, player palette until admin MVP proven). **Optional:** re-run `sage_consult` via bars-agents when API key available.
