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
