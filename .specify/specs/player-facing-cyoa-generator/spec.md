# Spec: Player-facing CYOA generator

## Purpose

Let **players** (not only admins) generate **personal or campaign-shaped CYOA** experiences from **BARs, charge, and campaign context**, with a **vibey, sovereignty-respecting UI** and a **quality bar** that prevents spammy or incoherent graphs from polluting shared campaigns. Tie generation to **earned dominion** (campaign stance, roles, instance policy) so “campaign-from-dominion” proposals are **reviewable** before they land in shared spaces.

**Problem:** Research for modular CYOA and BAR→quest pipelines exists in chat and admin specs, but there is no **player-facing, spec-backed** product surface that composes BAR → quest grammar → CYOA while respecting **sovereignty** (opt-in publish, clear provenance) and **shared campaign hygiene** (queue, review, dominion gates).

**Practice:** Deftness Development — spec kit first, API-first (contracts before UI), deterministic validation over raw LLM topology; degrade gracefully without model calls.

---

## Premises

| Premise | Implication |
|---------|-------------|
| **Sovereignty** | Player owns drafts; publish to shared campaign is explicit and revocable where policy allows. |
| **BAR → quest → CYOA** | Pipeline aligns with [bar-quest-generation-engine](../bar-quest-generation-engine/spec.md); CYOA output is an **Adventure** or **proposal** artifact, not silent overwrite. |
| **Vibey UI** | Encoding matches cultivation-card / event-invite readability; Tailwind layout only per `UI_COVENANT.md` when UI ships. |
| **Quality bar** | Graph validation (grammar, depth, dead ends) before save/share; optional AI only **fills** valid nodes (see [cyoa-modular-charge-authoring](../cyoa-modular-charge-authoring/spec.md)). |
| **Earned dominion** | Proposal to **shared** campaign/instance requires policy match ([dominion-style-bar-decks](../dominion-style-bar-decks/spec.md), instance roles, campaign hub state). |
| **Campaign-from-dominion** | High-trust outputs can suggest **campaign palette** extensions (spokes, deck hooks) as **proposals**, not live mutations. |

---

## Use cases

1. **Friend mode** — Player generates a **private** or **unlisted** CYOA from a BAR + short interview; share link optional.
2. **Campaign suggest** — Player with dominion signals proposes a CYOA **attached to instance/campaign**; lands in **moderation queue** for steward/host.
3. **Improve / expand** — Player opens existing Adventure (where permitted) and requests **branch expansion** with diff/review.
4. **Teach-from-experience** — Player turns a **completed quest path** into a **teaching CYOA** (exportable, credited).

**See also:** [campaign-branch-seeds](../campaign-branch-seeds/spec.md) — a **narrow slice** for **live** campaign passages: players **plant** seeds at a `nodeId` (prominent on broken paths, quiet “suggest a branch” otherwise), **water** with role-weighted visibility, stewards **metabolize** into `Passage` rows under [UGA](../unified-cyoa-graph-authoring/spec.md) validation. Complements **Improve / expand** before the full generator M1–M4 ships.

---

## Conceptual model (WHO / WHAT / WHERE / Energy / Moves)

| Dimension | Mapping |
|-----------|---------|
| **WHO** | Player-author; campaign stewards; optional Sage/architect agents as **suggesters**, not owners |
| **WHAT** | `CyoaGeneratorDraft` / `QuestProposal`-like queue objects; validated graph IR → Twee export |
| **WHERE** | Private vault, instance-scoped lab, campaign proposal queue |
| **Energy** | Charge/BAR as intake; vibeulon **hold** or **cost** on publish (Phase 2+ — contract only in v0) |
| **Moves** | Wake Up (pick seed), Clean Up (prune graph), Grow Up (learn blocks), Show Up (submit/publish) |

---



---

## Coach Identity Anchor (ITD Q3/Q4)

**Source:** Integral Teal Design Research — Rectification of Names + Three Hats at Levels
**Hexagram:** 14 (Great Possession) — Architect + Challenger active

### Why this section exists

Before M1 ships, this spec must name who is building and who benefits. The "player-author" framing is correct but incomplete. The first meaningful player-author is the coach themselves — specifically Wendell — whose identity is shifting from service provider to game designer + business person + service provider.

### The rectified names for this spec

| Old name | Rectified | What it enables |
|---------|-----------|----------------|
| "Build a CYOA tool" | Coach builds their own practice as a CYOA | The tool is downstream of the coach's identity work |
| "Players generate CYOAs" | Coaches generate CYOAs from their own BARs first | Revenue path for the coach, not just infrastructure |
| "Quality bar" | Coach-quality bar first, player-quality bar second | The coach's standard is the standard |
| "Sovereignty" | Sovereignty for the coach-as-designer, then for players | Two distinct sovereignty contracts |

### The three hats in this spec

| Hat | How it shows up in PFCG |
|-----|------------------------|
| **Service provider** | The coach's BAR is the source; their practice is the content |
| **Business person** | Generating a CYOA from their practice is how the coach earns dominion toward payment |
| **Game designer** | The coach designs the structure that players can then use |

### Sequencing rule

The coach must generate their own practice CYOA (using M1-M2) before the player-facing generator ships to general players. This is not a marketing step — it is a structural requirement. The coach's CYOA is the proof of quality.

---

## Revenue Path Phase 0 — Coach Dominion (not Phase 3)

**Source:** Integral Teal Design Research — Shadow Prediction
**Hexagram:** 14 (Great Possession) — Challenger + Regent active

### The problem with Phase 3 monetization

The current spec treats monetization as Phase 3+. This is correct for player-generated CYOAs in a shared campaign. It is wrong for the coach earning from their own practice.

### FR0 Coach Dominion Matrix

| Action | Who | Dominion required | Revenue connected |
|--------|-----|-----------------|-----------------|
| Coach generates their own CYOA from their BAR | Coach | None (self-source) | Yes — coach's own offer |
| Coach offers CYOA as paid product | Coach | None (self-owned) | Yes — direct |
| Player generates CYOA from own BAR | Player | None (self-source) | No — infrastructure only |
| Player submits CYOA to shared campaign | Player | Dominion earned in campaign | Revenue share or gate |
| Steward approves player CYOA to campaign | Steward | Instance owner/steward role | Governance only |

### The coach revenue path is not the platform revenue path

These must be tracked separately in the dominion matrix. The coach earning from coaching is not the same as the platform taking a cut of player-generated CYOAs.

---

## Designer Shadow Checkpoint (ITD Q6)

**Source:** Integral Teal Design Research — Designer Shadow Management
**Hexagram:** 14 (Great Possession) — Architect + Challenger active

### The unique shadow burden

The coach builds a system to help people manage shadow — while using that system themselves. When the generator works, what does the coach's shadow look like?

### Predictable shadow from success

| Solution that works | Shadow that emerges |
|--------------------|--------------------|
| Coach generates a CYOA that converts | "My system is the answer" — subtle condescension toward non-converters |
| Quality bar catches bad player CYOAs | "Players can't be trusted to generate quality" — projection of quality doubt |
| Dominion gates create earned access | "People who haven't earned dominion don't deserve this" — moral superiority |
| Generator is faster than manual authoring | "Why are coaches still doing this manually?" — subtle contempt for existing practice |

### Pre-build checkpoint

Before M1 ships, the coach must answer:

1. **Am I attached to this working?** If yes — that's the shadow. Proceed anyway, but know what you're carrying.
2. **Who benefits first?** Coach before players = business tool. Players before coach = service tool. Both valid — name which.
3. **Somatic checkpoint:** Does the generator's current state feel open or closed? If closed, investigate before proceeding.

### Council requirement

This spec requires at least 2 people who give direct feedback on the generator's design without being invested in the coach's approval. Their role: challenge when quality bars become exclusionary, flag when dominion gates become gatekeeping, name when the generator feels like replacement for relationship.

---

## API contracts (v0 sketch — refine before build)

### `createCyoaGeneratorDraft`

**Input:** `{ sourceBarId?: string, instanceId?: string, chargePayload?: Json, visibility: 'private' | 'unlisted' }`  
**Output:** `{ draftId, error? }`  
**Surface:** Server Action (authenticated).

### `validateCyoaGeneratorGraph`

**Input:** `{ draftId, graph: CyoaGraphV0 }`  
**Output:** `{ ok: boolean, issues: ValidationIssue[] }`  
**Surface:** Server Action; deterministic rules only in MVP.

### `submitCyoaProposalToCampaign`

**Input:** `{ draftId, instanceId, rationale?: string }`  
**Output:** `{ proposalId, error? }` — rejected if dominion/policy fails.  
**Surface:** Server Action.

### `listCyoaProposalsForSteward`

**Input:** `{ instanceId }`  
**Output:** `{ proposals: ProposalSummary[] }`  
**Surface:** Server Action or RSC loader (steward role only).

---

## Phased MVP (aligns with research M1–M4)

| Phase | Scope |
|-------|--------|
| **M1** | Private draft only; BAR pick + template graph; validate + preview (no shared publish). |
| **M2** | Unlisted share link; read-only play; no campaign attachment. |
| **M3** | Instance proposal queue + steward approve → promote to `Adventure` or attach to campaign ref. |
| **M4** | Optional AI fill-in inside validated nodes; modular blocks from cyoa-modular-charge-authoring. |

---

## Functional requirements

### Phase 0 — Spec & dominion clarity

- **FR0.1:** Document **dominion enum / policy matrix** for who may submit proposals per instance (reference dominion-style-bar-decks + InstanceMembership patterns).
- **FR0.2:** Choose **artifact type** for v1 output: new `Adventure` row vs `QuestProposal` extension — decision recorded in `plan.md`.

### Phase 1 — Draft + validate

- **FR1.1:** Authenticated player can create **draft** from optional `sourceBarId`.
- **FR1.2:** Server-side graph validation (acyclic where required, reachable end, max depth).
- **FR1.3:** Preview render reuses existing CYOA reader patterns (event-invite JSON or Twine shell — decision in plan).

### Phase 2 — Share & queue

- **FR2.1:** Unlisted token URL for playtest (rate limits, abuse NFRs).
- **FR2.2:** Submit to campaign creates **proposal** visible to stewards; no live campaign mutation until approve.

### Phase 3 — Quality + AI (optional)

- **FR3.1:** AI fills **node copy** only inside validated schema; logs provenance on nodes.

---

## Non-functional requirements

- **Abuse:** Rate limits on draft create, proposal submit, and share link hits.
- **Privacy:** Private drafts not visible to other players; leakage tests in verification quest.
- **Audit:** Proposal records retain author, source BAR id, timestamps.

---

## Verification Quest (stub — expand when UI ships)

- **ID:** `cert-player-facing-cyoa-generator-v1` (proposed)
- **Steps:** (1) Create draft from BAR, (2) Fail validation on bad graph, (3) Pass validation and preview, (4) Submit proposal as eligible player, (5) Steward reject, (6) Steward approve and confirm Adventure/proposal visible, (7) Confirm private draft not visible to other test account.
- **Narrative frame:** Preparing teachable moments for the residency; engine quality for player-authored CYOA.

---

## Dependencies

- [cyoa-modular-charge-authoring](../cyoa-modular-charge-authoring/spec.md) — modular blocks, IR, AI fill discipline
- [bar-quest-generation-engine](../bar-quest-generation-engine/spec.md) — BAR → quest proposal pipeline
- [dominion-style-bar-decks](../dominion-style-bar-decks/spec.md) — dominion / deck stance for gating
- [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/) — CMA / hub context (palette extensions)
- CSHE / event-invite patterns — lightweight JSON CYOA reader prior art (`EventInviteStoryReader`)

---

## References

- `src/components/event-invite/EventInviteStoryReader.tsx`
- `src/lib/event-invite-story/schema.ts`
- `docs/CYOA_MODULAR_AUTHORING_RESEARCH.md` (if present)
