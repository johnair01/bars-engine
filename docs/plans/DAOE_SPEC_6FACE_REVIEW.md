# 6-Face GM Review: DAOE Integration Spec
**Reviewer:** Council of Game Faces
**Date:** 2026-04-25
**Spec reviewed:** `.specify/specs/daoe-integration/spec.md` (v0.1.0-draft) + `plan.md`
**Session context:** Proposal approved — prototype implementation begins next

---

## CAST

| Face | Frame |
|------|-------|
| 🧠 Architect | Structural coherence: does the spec hold together as a technical document? |
| 🏛 Regent | Lifecycle stewardship: does the spec govern its own state over time? |
| ⚔️ Challenger | Critical transpersonal: what will break if we build what the spec says? |
| 🎭 Diplomat | Relational patterns: does the spec bridge the PM's language to implementation without losing meaning? |
| 🌊 Shaman | Felt-reality ground: what does the spec ask players to feel — and what does it leave un feeling? |
| 📖 Sage | Principled synthesis: what is the one thing that, if unfixed, makes the spec fail its thesis? |

---

## 🧠 ARCHITECT: Structural Coherence

### What's solid

- **Dependency graph ordering is correct.** Phase 5 (NPC) correctly depends on Phase 3 output. Phase 1 (types) correctly precedes Phase 2 (API). Phase 4 (suspension) is correctly terminal.
- **Backward compatibility decision is sound.** Making `resolutionRegister` and `authority` nullable on `BarDef` is the right call — existing BARs don't break, new BARs must declare.
- **Latency budget is honest.** Naming that LLM paths are 200-800ms async is a credibility move with R&D. Most proposals hide this.
- **DeltaUpdate typed discriminated union is well-structured.** The `register` field as discriminator is the right pattern for client-side prediction.

### Three structural gaps

**Gap A-1: Phase 4 retroactively modifies Phase 2 routes without flagging it**

FR2.4 says "All endpoints validate JWT on every request." Phase 2 implements JWT validation. But Phase 4 is where "suspended campaign check" gets added to routes. The spec lists these as separate phases but FR4.4 says "suspended campaigns: read-only access to state" — which means Phase 2 routes must change behavior after Phase 4 ships.

**Fix:** Phase 2 routes must document that their suspended-campaign behavior is defined in FR4.4. Either (a) add suspended check to Phase 2 routes with explicit "grace period" note, or (b) Phase 2 routes explicitly state "suspended check not yet implemented — see FR4.4." Hiding this as a Phase 4 change creates a backwards-compatibility gap.

**Gap A-2: Phase 5 GM face sentence generation has no implementation path**

FR5.2 says "GM face sentence generation uses tone weights to flavor NPC voice." But the spec never describes where GM face sentences live. Is there an existing `gm-face-sentences.ts`? Does Phase 5 create it? Does it call an LLM? Is it a lookup table?

**The gap:** Phase 5 describes an outcome ("dialogue reflects tone weights") without a mechanism. If the mechanism is an LLM call, Phase 5 reintroduces the latency budget problem the spec worked to exclude from the hot path. If it's a lookup table, no such table exists. The spec needs to name the mechanism before Phase 5 ships.

**Fix:** Define the GM face sentence generation mechanism in the spec. Options: (1) template-based lookup (fast, stateless, no LLM), (2) cached LLM generation at intake time (pre-computed like personality profile), (3) async LLM at game time (violates latency budget). The spec should choose one and own the tradeoff.

**Gap A-3: Two migrations for closely related changes**

Phase 3 adds `personalityProfile Json?` to Campaign. Phase 4 adds `suspendedAt DateTime?` to Campaign. These are two separate migrations. For a prototype, this is wasteful. For production, it creates a window where one field exists without the other.

**Fix:** Combine into single migration `add_daoe_campaign_fields` that includes both fields. One migration file, one deploy step, atomic addition.

---

## 🏛 REGENT: Lifecycle Stewardship

### What's solid

- **Migration file commitment is explicitly required.** FR4.5 and the Prisma section both require the SQL migration file to be committed with the schema change. This is the correct discipline.
- **Additive-only changes in Phase 1.** No breaking changes to existing BarDef consumers. The spec correctly identifies that Phase 1 is pure type extension.
- **Phase 5 explicitly preserves upgrade path.** "MVP doesn't need RAG complexity; upgrade path preserved" in plan.md — this is the right framing for a prototype.

### Three lifecycle gaps

**Gap R-1: Phase 1 doesn't enforce register self-declaration**

The spec correctly identifies that existing BARs must be tagged with `resolutionRegister`. But the tasks don't include a validation step that enforces new BARs must declare a register. Without enforcement, the taxonomy gap the spec exists to fix will recur.

**Fix:** Add a task to `tasks.md`: "BarDef creation site: add resolutionRegister to required fields (or explicitly nullable with a comment explaining why)." Or add a runtime assertion in the BAR creation path.

**Gap R-2: No data upgrade path for existing campaigns**

Phase 3 adds `personalityProfile` to Campaign as nullable. Existing campaigns will have `null` for this field. Phase 5 says NPCs read from the static artifact — but doesn't say what happens when it's `null`.

**Fix:** Phase 3 tasks should include a one-time backfill script that runs player personality intake for existing campaigns (or assigns default weights based on their current GM face preference, if that exists). The null case must be handled explicitly in Phase 5 NPC integration code.

**Gap R-3: Suspended campaign persistence is underspecified**

The spec says "no data loss" on suspension restore. But:
1. I Ching cast history is associated with the campaign. Is that preserved? Yes — it's in the campaign record.
2. Twine narrative state — is current node preserved? Yes, via DeltaUpdate.
3. BSM maturity phase — is that preserved? Yes.
4. But what about **active WebSocket connections**? The spec says "drop invalid sessions" but WebSocket teardown is not in the Phase 4 file list. If the server holds open WebSocket connections to suspended campaigns, the suspension is not enforced at the transport layer.

**Fix:** Phase 4 must include a WebSocket/session cleanup mechanism. The simplest version: active sessions check `campaign.suspendedAt` on every delta delivery and close if it's non-null. This needs to be in the plan, not assumed.

---

## ⚔️ CHALLENGER: Critical Transpersonal

### The one claim the spec makes that it cannot yet back up

**"The NPC ecology reflects the player's preferred GM face in tone/style" (FR5.2)**

This is the spec's most important claim — it proves the PM's Brand Ego Sync has been replaced by player-sovereign NPC generation. But the spec never demonstrates how a GM face's "tone" maps to actual generated text. The I Ching has 64 hexagrams with named meanings. The 6 GM faces have altitude/color/role descriptions. What does it mean to "flavor NPC voice" using those dimensions?

**The risk:** Without a defined text generation mechanism, FR5.2 will be implemented as a prompt engineering addition: "Use a {gmFace} tone in your response." This is not a mechanical system — it's a prompt instruction that produces inconsistent results and is indistinguishable from the "hallucination spiral" the spec-kit process is supposed to prevent.

**Fix:** Phase 5 needs a GM Face Sentence Generation spec before implementation begins. Minimum: (1) is it template-based? (2) is it LLM-generated at intake time (pre-cached)? (3) what is the fallback if the player has no personality profile? Each answer has different implications for the latency budget, storage, and consistency of the result.

---

### Two other challenger-level risks

**Risk C-1: Phase 2's predictionMismatch assumes client-side prediction infrastructure exists**

The spec includes `predictionMismatch?: boolean` in DeltaUpdate (FR2.3). This implies a client-side prediction system is already running and computing predictions. The spec does not describe how the client generates a prediction, how it compares to the server delta, or what "mismatch" means in practice.

**The gap:** If client-side prediction is not yet implemented, `predictionMismatch` will always be `false` or `undefined` — it's not testing anything. The feature will ship as a boolean field with no function.

**Fix:** Either (a) add client-side prediction to Phase 2 as a prerequisite, or (b) make `predictionMismatch` an explicit "not yet implemented" flag that Phase 5 or later phases wire up. Don't ship a field with no mechanism.

**Risk C-2: The "mostly stateless" architecture leaves the most important state undefined**

The spec explains "mostly stateless" as preserving accumulated I Ching history. But:
- **I Ching cast history** — preserved where? Campaign record? Separate table? If the campaign is suspended and the player starts a new campaign, does history transfer?
- **Alchemy transformation streak** — is this per-campaign or per-player? The spec says per-campaign in `karmaState.alchemyStreak` but a player's growth might span multiple campaigns.
- **BSM maturity phase** — per-campaign or per-player? A player who has reached "integrated" in one campaign might start as "captured" in a new one. Is that the intended behavior?

**Fix:** The spec needs a "State Ownership Model" section: which state is per-campaign, which is per-player, and what carries across campaigns. This is not a Phase 1 concern — it's the foundation the Phase 2 delta computation depends on.

---

## 🎭 DIPLOMAT: Relational Patterns

### What's solid

- **The PM → bars-engine translation table is present in the strategic analysis** (in docs/DAOE_STRATEGIC_ANALYSIS.md). The spec itself doesn't repeat it verbatim, which is correct — the spec is for implementation, not advocacy.
- **Client-side prediction protocol is clearly described.** The split between what the client predicts, what the server confirms, and what triggers a rollback is the right level of detail.
- **Intake questions are the right minimal set.** Four questions (stage, domain, itch, preferred face) is defensible for a prototype. Three would be too few to generate meaningful NPC tone weights. Five would reduce completion rates.

### Two bridging gaps

**Gap D-1: Phase 2 and Phase 3 don't document their API relationship**

Phase 2 creates `/api/daoe/state-delta` and `/api/daoe/cast-fortune`. Phase 3 creates `/api/daoe/player-personality-intake`. But the spec never says: "After a player completes personality intake, their `NpcToneWeights` are available to the NPC ecology, which is consulted by the `/cast-fortune` endpoint when generating NPC dialogue about the cast."

This sounds minor. It isn't. The PM's proposal had "Brand Ego Profile → NPC personality" as a pipeline. Our spec has "Personality Intake → tone weights → NPC dialogue" as a pipeline. But the spec's API section lists the endpoints without describing how data flows between them. An engineer reading only the spec would not understand the data pipeline.

**Fix:** Add a "Data Flow" section to the spec showing: Player Intake → `NpcToneWeights` stored in Campaign → read by NPC ecology at dialogue generation time → affects `cast-fortune` NPC narration. This is the PM's "pipeline" — we need to show it exists, just with player-sovereign direction.

**Gap D-2: The verification quest is referenced but not defined**

The spec says: "Twine story ID `cert-dao e-integration-v1`, CustomBar with `isSystem: true`, deterministic seed script." But:
1. The ID has a space (`dao e`) — should be `cert-dao e-integration-v1` but that means the seed script and Twine passages are not defined in the spec
2. The "deterministic seed script" is mentioned but not described

**The bridging problem:** Verification quests are how we prove the spec worked. Without the passages defined, Phase 5 cannot be verified. This is not a Phase 5 gap — it's a Phase 1 gap. The verification quest must be spec'd at the same time as the feature.

**Fix:** Either (a) define the Twine verification passages in the spec now (one passage per acceptance criterion), or (b) add a task in Phase 1: "Define cert-dao e-integration-v1 Twine verification quest passages." The spec cannot close without a defined verification artifact.

---

## 🌊 SHAMAN: Felt-Reality Ground

### What's solid

- **The kill-switch as suspension (not deletion) is the right felt-reality choice.** D8 is activated but contained — the loss is time, not the campaign. This is correct for emotional development work.
- **The I Ching is correctly identified as Fortune.** The spec grounds the Fortune register in felt-reality: real randomization produces outcomes that can't be gamed or faked. This is what makes the cast feel real.

### Three felt-reality gaps

**Gap S-1: The "stateless" framing conceals a felt-reality loss**

The spec explains "mostly stateless" as preserving accumulated I Ching history. But it doesn't name the felt-reality cost: when history doesn't transfer, growth feels ephemeral. A player who has cast 30 hexagrams across 3 campaigns doesn't see their developmental arc — they see three separate campaigns with no connection.

**The gap:** "Mostly stateless" is presented as a technical optimization. It is also a felt-reality choice. The spec should name it as both.

**Fix:** Add a "State Model" note: "I Ching history is per-campaign. A player's growth across campaigns is not yet connected. Future work may introduce a player-level history artifact."

**Gap S-2: Player personality intake has no "arrival" moment**

The PM's proposal had "Brand Ego Sync" as a visible ritual — the system "listens" to the CEO's genius. The replacement (player intake) is a form. Forms don't create felt-reality arrival. The 4-question intake will feel like paperwork, not like a magic circle entry.

**The gap:** How does the player know they've been "recognized"? The spec names the intake mechanism but not the experience of completing it. The PM's proposal won on felt-reality — it promised the NPC would "sound like the CEO." Ours promises nothing about how the player will feel recognized.

**Fix:** Phase 3 tasks should include a "completion experience" — what does the player see when intake is done? A confirmation? An NPC greeting that references their stated itch? A first Fortune cast that feels "shaped by" their intake? The spec needs an experience moment, not just a data field.

**Gap S-3: The Fortune register names I Ching but not its felt-reality purpose**

The I Ching is correctly named as Fortune. But the spec doesn't explain why Fortune is in this system. Fortune exists because players need real randomness to produce outcomes that can't be gamed. The felt-reality of the I Ching cast is: "I cannot control this outcome — I can only respond to it."

**The gap:** A new engineer reading this spec will understand the I Ching as a "random oracle" but not understand that it's a mechanism for surrendering control. This matters because the next engineer who touches `cast-iching.ts` might "optimize" it by caching results or routing around the randomness when the outcome is inconvenient — which would destroy the Fortune register's felt-reality purpose.

**Fix:** Add a comment in the spec and in the code: "I Ching casting is the system's Fortune register. The randomness is the feature, not a bug. Do not route around it."

---

## 📖 SAGE: Principled Synthesis

### The one thing that, if unfixed, makes the spec fail

**The spec cannot claim "player sovereignty" without defining what the player owns.**

The MTGOA thesis requires player sovereignty. The spec replaces Brand Ego Profile with Player Personality Intake. But the spec never defines what the player *owns* in this system. They own:
- Their personality intake data (yes — it's in their campaign record)
- Their I Ching history (per-campaign — not portable)
- Their BSM maturity phase (per-campaign — resets on new campaign)
- Their NPC tone weights (stored, used in dialogue)

The player does not own:
- Their developmental trajectory across campaigns
- Their alchemy streak (per-campaign)
- The meaning of their I Ching casts (no meta-narrative linking hexagrams to growth)

**The failure mode:** A player completes intake, casts the I Ching, and receives an NPC that "reflects their preferred GM face." But the reflection is shallow — it's a tone parameter, not a developmental mirror. The player asked to be seen; they were seen in a data field. The PM's "Brand Ego Sync" would have at least produced a more elaborate NPC voice. Our "player sovereignty" produces a form and a tone weight.

**The fix isn't to make the NPC more elaborate.** The fix is to name the limits. The spec should state: "Phase 5 NPC ecology is a tone-weighting system, not a developmental mirror. The player's developmental trajectory is tracked via BSM maturity phases within a campaign. Cross-campaign developmental continuity is out of scope for DAOE-0." This is honest. It preserves the thesis by not claiming more than the system delivers.

### The one structural fix that enables everything else

**Verification quest passages must be defined in Phase 1, not deferred.**

The spec's verification quest is the proof that the system works. Without it, Phase 5 closes without anyone being able to verify the most important claim: "NPC ecology reflects player's preferred GM face." This is not a Phase 5 problem. It's a Phase 1 problem.

**Fix:** Add task in Phase 1: "Define the 5 verification steps for cert-dao e-integration-v1 as Twine passages." The spec cannot declare Phase 5 complete without these passages running.

---

## PRIORITY ORDER FOR FIXES

### Tier 1 — Must fix before Phase 1 closes

1. **Define GM face sentence generation mechanism** (Architect Gap A-2) — without this, Phase 5 cannot be implemented
2. **Define verification quest passages** (Diplomat Gap D-2) — without this, the spec cannot be verified
3. **State ownership model** (Challenger Risk C-2) — per-campaign vs. per-player must be named before Phase 2 delta computation

### Tier 2 — Fix before Phase 3 closes

4. **Combine migrations** (Architect Gap A-3) — one migration for both Campaign fields
5. **Add data upgrade path** (Regent Gap R-2) — existing campaigns need default personality profile
6. **Document API data flow** (Diplomat Gap D-1) — show how intake → tone weights → NPC dialogue pipeline
7. **Phase 2 routes: explicit suspended-check status** (Architect Gap A-1) — Phase 2 routes must note "suspended check not yet implemented" or add it now

### Tier 3 — Fix before Phase 5 closes

8. **Phase 1: enforce register self-declaration** (Regent Gap R-1) — new BARs must declare register
9. **Phase 4: WebSocket/session cleanup** (Regent Gap R-3) — suspension must be enforced at transport layer
10. **player personality intake "arrival" moment** (Shaman Gap S-2) — what does the player see when intake completes?
11. **Add Fortune register felt-reality purpose** (Shaman Gap S-3) — comment in code: "the randomness is the feature"

---

*Review produced: 2026-04-25*
*Files reviewed: `.specify/specs/daoe-integration/spec.md`, `.specify/specs/daoe-integration/plan.md`, `docs/DAOE_STRATEGIC_ANALYSIS.md`*
