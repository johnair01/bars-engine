# Sage Consult: CBB & CSHE Synthesis

*A synthesis of [CYOA blueprint → BAR metabolism (CBB)](../../.specify/specs/cyoa-blueprint-bar-metabolism/spec.md) and [Clothing swap hybrid fundraiser event (CSHE)](../../.specify/specs/clothing-swap-fundraiser-hybrid-event/spec.md).*

## The Integration Opportunity

CBB establishes the engine for turning interactive choices (CYOA) into tangible artifacts (BARs), complete with auth-awareness and a stable prompt library. CSHE requires an engaging, low-friction entry point that produces real listings (BARs) without forcing a massive onboarding wall.

**CSHE is the ideal forcing function for CBB.** By building CBB *for* the CSHE orientation and item-intake flow, we validate CBB's mechanics on a high-value, real-world event.

## How CSHE Tests CBB Implementation

### 1. Auth-Aware CTAs (CBB P1) ↔ RSVP & Full Game Join (CSHE P4)
CSHE explicitly supports an "RSVP-only" path that defers full onboarding. CBB's requirement to suppress account creation for authenticated users perfectly maps to CSHE's dual-track entry. 
* **Test:** An anonymous user clicking a CSHE invite BAR sees the RSVP/Signup CTA. An authenticated user clicking the same link skips the CTA and lands directly in the event orientation.

### 2. Decision to Artifact Metabolism (CBB P4) ↔ Swap Listing Creation (CSHE P5)
CSHE requires players to generate "Swap Listings" (which are fundamentally BARs with photo attachments and metadata). CBB's core feature is metabolizing choices into BAR drafts.
* **Test:** The CSHE orientation CYOA includes a branch asking: *"What kind of energy are you bringing to the swap?"* (e.g., Outerwear, Accessories, Service/Time). The choice resolves to a CBB **blueprint key** that drafts the initial Swap Listing BAR. The player only needs to attach a photo to complete it.

### 3. The "What Opened" Ledger (CBB P5, P6) ↔ Event Warm-Up (CSHE P9)
As players navigate the CSHE orientation or pre-production quests, they generate event-scoped Subquests and BARs. CBB's bottom modal and Transcendence recap provide the exact UX needed to show the player what they've created.
* **Test:** At the end of the CSHE entry flow, the CBB Transcendence screen lists: "Here is your RSVP confirmation, your drafted Swap Listing, and an event subquest you unlocked."

### 4. Cardinality & In-Voice Labels (CBB P2, P3) ↔ Host Tone (CSHE Shaman Face)
CSHE emphasizes an embodied, welcoming tone to overcome the "social risk" of a clothing swap. CBB's requirement that button labels carry the "voice" of the Game Master/Host ensures the event doesn't feel clinical.
* **Test:** Ensure a single-choice CSHE passage (e.g., an implicit "Continue") doesn't render an awkward five-face generalized intro, and that branching choices sound like the Event Host (Regent) or the Vibe Curator (Shaman) rather than sterile system prompts.

## Recommended Implementation Path

1. **Fix Backend Dependencies:** (Optional but recommended) Run `cd backend && uv sync` to repair the Python environment so `bars-agents` can be utilized for generating the actual prompt library texts.
2. **Build CBB Core:** Implement `render(nodeId, cyoaState, authContext)` and the `artifactLedger` first.
3. **Wire CSHE Intake as the First Blueprint:** Author the CSHE "Returning Player" orientation track as a CYOA graph where the final node triggers a CBB blueprint key for `createSwapListingDraft`.
4. **Deploy the CBB Modal:** Expose the drafted Swap Listing BAR at the end of the CSHE flow.
