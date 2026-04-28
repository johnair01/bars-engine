# 6-Face GM Strategic Analysis: Teal-Hardened DAOE Prototype
**Intercepted prompt:** Senior PM "Spec Kit" proposal for a "Deterministic Agentic Onboarding Environment"
**Date:** 2026-04-25
**Source:** bars-engine codebase ground truth + GM_GAP_ANALYSIS_RPG_ZINE_BAR_MATURITY.md
**Decision context:** R&D team gap analysis presented — project survival requires prototype alignment with bars-engine

---

## CAST

| Face | Frame |
|------|-------|
| 🧠 Architect | Structural coherence: where does the proposal align, conflict, or require architecture we don't have? |
| 🏛 Regent | Lifecycle stewardship: what can be kept, what must be composted, what needs new soil? |
| ⚔️ Challenger | Critical transpersonal: what will break if we build what they're asking for? |
| 🎭 Diplomat | Relational patterns: how do we bridge the PM's language to our architecture without losing meaning? |
| 🌊 Shaman | Felt-reality ground: what is this proposal really asking us to feel? |
| 📖 Sage | Principled synthesis: what is the integral design thesis that makes this worth doing or not? |

---

## THE PROPOSAL IN ONE PARA

The PM wants a headless RPG logic server (stateless, sub-10ms), a Brand Ego Profile → NPC personality pipeline (RAG against LinkedIn/CEO docs), an OpenAPI 3.1 render-stream endpoint (thin-client optimized), and a JWT-gated subscription kill-switch. All spec-first, no code until approved.

**Three things the proposal gets right:**
1. Stateless server architecture is the correct call for $10/game cost targets
2. Naming the resolution registers (Fortune/Drama/Karma) is exactly what bars-engine is missing (GAP A-1, A-3)
3. Spec-first is the only way to survive an R&D review with a PM who treats AI as an "Ego-GPT"

**What the proposal misses:**
It ignores that bars-engine already has two Fortune registers (I Ching casting, prompt deck), a Drama register (Twine), and an emotional alchemy Karma register — they just aren't named. The proposal builds from scratch what already exists. The real work is integration, not construction.

---

## 🧠 ARCHITECT: Structural Coherence

### What Already Exists vs. What Needs Building

| Proposal Component | bars-engine Reality | Gap |
|---|---|---|
| Stateless RPG logic server | `alchemy-engine/`, `cast-iching.ts` — stateful per-session | Needs stateless delta-update contract |
| Flat memory map (Game Boy style) | No flat entity map. Campaign state is in Prisma | Needs design |
| Fortune register | I Ching casting + prompt deck — present but unnamed | Name it, document it |
| Drama register | Twine engine (`twine.ts`, `micro-twine.ts`) — present but unnamed | Name it, document it |
| Brand Ego → NPC pipeline | NPC personality templates (`npc-move-selection.ts`) | RAG pipeline does not exist |
| `/render-stream` OpenAPI 3.1 | No render-stream endpoint | Needs design |
| JWT subscription kill-switch | Auth layer exists (`auth-utils.ts`) | Kill-switch not architecturally isolated |

### The Three Architectural Bottlenecks

**Bottleneck 1: Zo's Cloud Execution vs. Sub-10ms Rendering**

The PM wants sub-10ms response times. Zo's cloud execution has cold-start overhead and network latency that makes this physically impossible for any LLM-bound call. The I Ching cast (`cast-iching.ts`) can hit sub-10ms because it's pure computation. But any call that reaches an LLM spins up a session that will never clear in 10ms.

**Client-side prediction is the only answer.** The server handles:
- Fortune resolution (I Ching cast — pure computation, sub-ms)
- Karma tracking (Prisma state delta — under 10ms with proper indexing)
- Drama branching (Twine state machine — sub-ms lookups)

The client predicts the next frame from the last known state delta. The server confirms or corrects on the next tick. This is exactly how Game Boy games worked — the CPU was too slow to wait for the frame, so it predicted and corrected.

**Bottleneck 2: JWT Revocation vs. Stateful Game Sessions**

If a subscription is revoked, the PM wants the game to stop immediately. But JWT revocation requires either:
- A revocation list (stateful — defeats the stateless architecture)
- Short-lived JWTs with a grace period (functional but not instant)

bars-engine's auth layer (`auth-utils.ts`) has JWT issuance. It does not have a revocation check on every request. The kill-switch cannot be truly instantaneous without either a Redis-backed token blacklist or a side-channel notification to all active sessions.

**Risk:** If JWT revocation takes 60 seconds to propagate, a user with an active Twine session can continue playing for 60 seconds after revocation. For a $10/game cost model, this is acceptable. For a subscription SaaS with entitlement enforcement, this is a billing loophole.

**Bottleneck 3: RAG Pipeline vs. Real-Time NPC Generation**

The Brand Ego Profile → NPC personality pipeline requires RAG over LinkedIn URLs and company vision statements. This means:
1. Scraping/processing LinkedIn (rate-limited, may violate ToS)
2. Embedding chunking and vector storage (additional infrastructure)
3. Retrieval latency on every NPC invocation (conflicts with sub-10ms requirement)

**The proposal的矛盾:** You cannot have real-time RAG-powered NPC dialogue at sub-10ms without pre-computing the embeddings. The RAG lookup itself (even with an in-memory vector store) adds 20-50ms per query. 

**Client-side prediction strategy for RAG:** Pre-compute the CEO's tone profile at onboarding time (not at game time). Store the personality weights as a static JSON artifact. At game time, the NPC dialogue system reads from the static artifact — no retrieval, no latency. The RAG runs async at brand setup, not sync at game time.

### Proposed Client-Side Prediction Architecture

```
Thin Client (MacBook Air)
  ├── Predicts: next Twine node, sprite position, UI overlay
  ├── Confirms: every 500ms via lightweight /state-delta endpoint
  └── Rollback: if server delta disagrees with prediction, snap to server state

Zo Server (stateful core)
  ├── Fortune: I Ching cast (pure computation, sub-ms)
  ├── Karma: Prisma delta write + read (indexed, <5ms)
  ├── Drama: Twine state machine (lookup, <1ms)
  └── NOT: LLM calls in the hot path (always async, never blocking render)

RAG Pipeline (off critical path)
  ├── Runs async at brand onboarding time
  ├── Output: static NPC personality weight JSON
  └── No retrieval at game time
```

---

## 🏛 REGENT: Lifecycle Stewardship

### What to Keep, Compost, Redesign

**Keep (already bars-engine):**
- I Ching casting system (`cast-iching.ts`) — Fortune register, production-grade
- Emotional alchemy engine (`alchemy-engine/`) — Karma register, proven
- Twine engine (`twine.ts`) — Drama register, working
- BAR seed metabolization pipeline — lifecycle model exists, needs iteration narrowing (GAP R-2)
- BSM maturity phases — solid foundation

**Redesign (proposal conflicts with existing architecture):**
- The "stateless server" framing ignores that bars-engine's power is stateful session context. The I Ching ritual gains meaning from accumulated history (previous casts, campaign context). A purely stateless model loses this. **Fix:** Design a "mostly stateless" architecture — the campaign state is the only stateful artifact; individual game frames are stateless deltas.
- The Brand Ego → NPC pipeline assumes B2B SaaS context. bars-engine is RPG/cultural development, not enterprise onboarding. The NPC personality work should serve the 6 GM faces framework, not a CEO's LinkedIn tone.

**Compost (proposal dead-ends):**
- The OpenAPI 3.1 `/render-stream` contract for a "thin-client renderer" — this is building a custom game client from scratch when PixiJS-based rendering already exists in the codebase. The render bridge is over-engineered for the prototype.
- Real-time RAG at game time — replace with pre-computed personality artifacts (see Architect bottleneck 3)

**New Soil (what the proposal names that we need):**
- Resolution register naming (Fortune/Drama/Karma) — this is the most valuable thing in the proposal. Add to `BarAsset` type immediately.
- Authority naming in BAR invocation (who calls, who narrates, who tracks) — GAP A-2 fix
- Subscription kill-switch as explicit architectural concern — not yet designed

---

## ⚔️ CHALLENGER: Critical Transpersonal

### What Will Break If We Build This naively

**Break 1: The PM's "Ego-GPT" framing will poison the design**

The PM's pitch is: "We'll make the AI sound like the CEO so the $100/mo subscription feels like a steal." This is manipulation architecture — the NPC "listens" to the CEO's genius as a sales feature. 

If bars-engine builds this, it inherits the brand ego as the source of NPC authority. The 6 GM faces become NPC personas who reflect whoever is paying. The game stops being about the player's development and starts being about the brand's self-congratulation.

**This is the opposite of what the zine gap analysis says is needed.** The zine says: "No single person's ideas, desires, or goals should take precedence over anyone (or everyone) else's." A Brand Ego Sync makes the paying client's voice dominate the entire NPC ecology.

**Fix:** Reframe the "BrandingEngine" as a *player* personality intake — not a CEO tone profile. The NPC mentors reflect the *player's* developmental stage, not the subscription holder's brand. This makes the system about the player, not the client.

**Break 2: Sub-10ms is a lie that will haunt the roadmap**

The PM knows sub-10ms is impossible for LLM-bound calls. They're using it as a spec constraint to make the proposal look technically serious. If we accept this constraint without challenging it, we will spend 3 sprints failing to meet it and then be forced to explain why the "deterministic" server isn't deterministic at all.

**Fix:** Accept sub-10ms for *non-LLM* paths (Fortune, Karma, Drama). Reject it for any path that touches an LLM. Name the latency budget explicitly: "Fortune/Karma/Drama paths: <10ms. LLM paths (NPC dialogue generation): 200-800ms async." This is honest and still impressive.

**Break 3: The subscription kill-switch creates entitlement anxiety**

If the kill-switch is real, players know the game can be turned off. This activates D8 (Loss & Avoidance) in the worst possible way — the loss is the game itself, controlled by a third party. For emotional development work, this is catastrophic. The psychological safety of the magic circle depends on the space being sovereign.

**Fix:** Design the kill-switch as a *campaign suspension* (the world pauses, you can return) not a *campaign deletion* (everything is gone). The loss you avoid is temporary absence, not permanent erasure.

---

## 🎭 DIPLOMAT: Relational Patterns

### Bridging the PM's Language to Our Architecture

| PM Term | bars-engine Equivalent | Translation Note |
|---|---|---|
| Headless RPG Logic Server | BAR engine + Twine + alchemy | "Headless" means no renderer = pure state machine |
| Deterministic Agentic Onboarding | BAR seed → integrated via I Ching + alchemy | "Deterministic" is wrong — it's Fortune, not deterministic |
| Ego-Sync / Brand Profile | Player personality intake (not CEO profile) | Reframe as player-sovereign |
| NPC Personality Templates | 6 GM faces as NPC archetypes | Align to our framework, not brand voice |
| Thin-Client Renderer | Existing PixiJS components | No new client needed for prototype |
| Subscription Kill-Switch | JWT revocation + graceful campaign suspension | Not instant deletion |
| Client-Side Prediction | Server delta → client interpolation | Already works in Twine — just needs formal contract |
| Flat Memory Map | Prisma campaign state with entity IDs | No Game Boy map needed — Prisma is already fast with indexes |

**The Diplomat's concern:** The PM wants to build something that looks like bars-engine but serves a different master (the brand, not the player). The integration work is real — the proposal's components have value. But the *framing* must change or the prototype will become a product that contradicts the MTGOA thesis.

---

## 🌊 SHAMAN: Felt-Reality Ground

### What This Proposal Is Really Asking Us to Feel

**Beneath the spec language, the PM is afraid of three things:**

1. **They are afraid the game won't feel real.** The "Deterministic" in DAOE is a cover for "I need to trust that the system won't hallucinate embarrassing content." The Fortune register (I Ching) solves this — real randomization produces outcomes that can't be gamed or faked.

2. **They are afraid the player won't feel seen.** The "Ego-Sync" is a repackaged desire for personalization — the NPC should know who I am. But the proposal gets the direction wrong: the NPC should reflect the *player's* developmental trajectory, not the CEO's brand voice.

3. **They are afraid the subscription model will collapse.** The kill-switch reveals the anxiety: if we can't turn it off, we can't control it. But control architecture that centers the brand's ability to revoke is the opposite of a magic circle — it makes the game sovereign to the corporation, not the player.

**The shadow in the proposal:** The PM calls it "Teal-Hardened" but the architecture is actually Amber — hierarchical control, brand sovereignty, instant revocation. True Teal would be player-sovereign: the game belongs to the player, not the subscription holder.

---

## 📖 SAGE: Principled Synthesis

### The Integral Design Thesis

**The proposal is worth doing — but only if we eat the PM's lunch before it eats ours.**

The DAOE concept is correct in its bones: a headless, stateless, spec-driven RPG logic engine that separates state computation from rendering is exactly the architecture that can scale to $10/game. The three-register naming (Fortune/Drama/Karma) is the most important architectural insight available — it gives us a vocabulary for what the system already does.

**What we must not do:** Build the Brand Ego Sync as proposed. It inverts the system's purpose. The 6 GM faces become the NPC ecology. The I Ching becomes the Fortune register. The Twine engine becomes the Drama register. The emotional alchemy becomes the Karma register. The player is always the subject, never the object.

**The prototype we should build:**

```
DAOE-0 (Prototype — survives R&D review)
├── Statify: Formalize Fortune/Drama/Karma register contract in BarAsset type
├── Name: Add resolutionRegister + authority fields to BarDef (GAP A-1, A-2 fix)
├── Client-predict: Document the latency budget (LLM paths async, all others <10ms)
├── Kill-switch: JWT revocation → graceful campaign suspension (not deletion)
├── Ego-sync: Replace Brand Profile with Player Personality Intake
│   └── Maps player developmental stage → NPC tone weighting
│   └── Pre-computed at intake, not real-time RAG
└── Render bridge: Use existing Twine/PixiJS, no new thin-client

DAOE-1 (If R&D approves continuation)
├── Brand Ego Sync: Only for white-label deployments, opt-in
├── Subscription kill-switch: Redis-backed token blacklist with 5s propagation
└── NPC RAG pipeline: Async embedding at brand onboarding, static artifact at game time
```

---

## STRATEGIC PLAN

### Phase 0: Survive the R&D Review (Week 1)

**The PM's prompt wins if we respond with specs that look like their specs.** We need to produce a spec that looks like a Strategic Business Framework that happens to be machine-executable — while actually being an architecture that serves the bars-engine thesis.

**Deliverable:** `/specs/DAOE/SPEC.md` — "Deterministic Agentic Onboarding Environment: bars-engine Integration Spec"

**Sections:**
1. **System Intent** — Stateless RPG logic server with Fortune/Drama/Karma registers
2. **Resolution Register Contract** — Add `resolutionRegister` to `BarAsset` and `BarDef`
3. **Latency Budget** — Fortune/Karma/Drama <10ms; LLM paths async (200-800ms)
4. **Client-Side Prediction Protocol** — Server delta → client interpolation contract
5. **Subscription Kill-Switch** — JWT revocation → campaign suspension (not deletion)
6. **Player Personality Intake** — Replaces Brand Ego Sync; player-sovereign
7. **NPC Ecology** — 6 GM faces as archetypes; tone weighted by player intake
8. **RAG Pipeline** — Pre-computed at onboarding, static artifact at game time

### Phase 1: Integrate Before Building (Week 2-3)

**Do not write new code. Integrate existing systems.**

1. Add `resolutionRegister: 'fortune' | 'drama' | 'karma'` to `BarDef` in `bars.ts`
2. Add `authority: { invoker, narrator, tracker }` to `BarDef` (GAP A-2 fix)
3. Document the three registers in `bar-asset/PROTOCOL.md`
4. Name the Fortune paths: I Ching casting (`cast-iching.ts`) + prompt deck
5. Name the Drama path: Twine engine (`twine.ts`)
6. Validate: Run `npm run check` — no regressions

**Risk:** The spec-kit translator skill handles spec creation. Read `.agents/skills/spec-kit-translator/SKILL.md` before authoring.

### Phase 2: Prototype the Kill-Switch (Week 3-4)

1. Add `campaignSuspension` state to campaign model (not deletion)
2. On JWT revocation: set `suspendedAt = now()`, allow read-only access
3. On re-subscription: clear `suspendedAt`, full access restored
4. Document the behavior in `AUTH.md` update

**What this risks breaking:** If suspension is not truly isolated, a suspended user with an active WebSocket could receive state updates. Mitigation: Twine sessions require active auth token; token check on every delta delivery.

### Phase 3: Player Personality Intake (Week 4-6)

1. Design intake form: player describes their current developmental itch
2. Map intake to 6 GM face tone weights
3. Store as static JSON artifact (no vector DB needed for MVP)
4. NPC dialogue system reads from artifact at generation time

**What this risks breaking:** If intake is too complex, players don't complete it. Mitigation: 3-question intake max for prototype. Full RAG pipeline deferred to DAOE-1.

---

## THE ONE THING THAT DETERMINES SUCCESS

The PM's proposal will produce a system that serves the brand. bars-engine's thesis requires a system that serves the player.

The DAOE prototype will succeed if and only if the **Player Personality Intake** replaces the **Brand Ego Profile** as the input to the NPC ecology. Everything else — the registers, the kill-switch, the latency budget — is engineering. The framing is the strategy.

**Build the prototype that proves the player, not the brand, is the sovereign.**

---

*Analysis produced: 2026-04-25*
*Source: bars-engine codebase (bars.ts, bar-asset/types.ts, cast-iching.ts, twine.ts, alchemy-engine/)*
*Companion: GM_GAP_ANALYSIS_RPG_ZINE_BAR_MATURITY.md*
