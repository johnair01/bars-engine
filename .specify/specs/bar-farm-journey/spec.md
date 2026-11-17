# Feature Specification: One BAR, one farm journey

**Feature Branch**: `codex/bar-farm-loop`  
**Created**: 2026-11-17  
**Status**: Draft integration spec  
**Input**: Wendell's request to own getting BAR sending, farm parcels, planting, and crops working together.

## User Scenarios & Testing

### User Story 1 — My BAR reaches a plot (Priority: P1)

After sharing a BAR, its owner sends it to the farm. The farm shows one parcel for that BAR. The owner takes it into the satchel, prepares soil, and plants that same seed. They can return to the BAR and see where it went.

**Independent Test**: In a local account, send one BAR and complete the parcel-to-plot path. The BAR ID must remain traceable at every step.

**Acceptance Scenarios**:

1. Given a shared BAR not previously sent, when its owner sends it, then exactly one farm parcel appears without occupying a plot.
2. Given that parcel, when its owner takes it, then exactly one satchel seed appears and the parcel cannot be taken again.
3. Given tilled soil, when its owner plants the seed, then the satchel loses it and the plot identifies the source BAR.
4. Given untilled soil or a different owner's parcel, when planting or taking is attempted, then neither seed nor plot changes.

### User Story 2 — The five moves are legible in the farm (Priority: P2)

The seed's pickup, opening, clearing, planting, tending, and harvest follow the already ruled [farm-seed-item](../farm-seed-item/spec.md) mapping. A player can tell what they have done and what they can do next without reading a development status panel.

**Independent Test**: A player completes the five-move journey with one seed, including the optional block/stone case, and can describe the next farm action at each step.

**Acceptance Scenarios**:

1. Given a seed at each stage, the farm offers the next valid action and refuses an out-of-order action without consuming the seed.
2. Given a harvested seed, the player can follow its BAR, spec, and PR links where those links exist.

### User Story 3 — A crop has a consequence (Priority: P3)

Where a seed has a crop family and form, the live farm preserves them through planting and harvest. The harvest makes visible the real act or relationship it represents; it does not claim the act was done merely because a crop ripened.

**Independent Test**: Plant a crop-bearing seed and a plain seed. Each grows correctly; only the crop-bearing seed renders its family, and neither creates a false act record.

## Edge Cases

- Retry, double click, or two tabs taking the same parcel must leave one satchel seed.
- Composting must not be mistaken for planting or harvesting; its reversibility and BAR status need an explicit rule before implementation.
- Existing non-BAR parcels and plain seeds continue to work.
- A crop-less BAR remains plantable. A BAR with no spec or PR link must not show a dead link.
- A seed sent before the integration must be reconciled or clearly marked; no silent duplicate inventory.

## Requirements

### Functional Requirements

- **FR-001**: One stable source BAR identity MUST connect send, parcel, satchel, plot, crop, and harvest records.
- **FR-002**: Sending a BAR MUST be idempotent and create at most one actionable farm seed for that owner.
- **FR-003**: The Seeds panel and parcel/satchel MUST show consistent states of the same seed, not independent inventories.
- **FR-004**: Parcel take and planting MUST preserve ownership and be atomic under retries and concurrent requests.
- **FR-005**: The farm MUST enforce the ruled five-move order from `farm-seed-item`; any change to that order requires a new Board steer.
- **FR-006**: Crop family/form, when present, MUST survive the live farm planting and harvest path. Missing crop metadata MUST remain valid.
- **FR-007**: The farm MUST distinguish an in-game tend/harvest from a verified real-world act; it MUST NOT record the latter without its own event.
- **FR-008**: A repeatable local walkthrough MUST exercise the entire path and capture the persisted IDs, player-visible states, and refusals.
- **FR-009**: A phone-width look MUST show the parcel, satchel, plot, and next action before the integrated journey is marked ready.

### Key Entities

- **BAR**: The originating player-owned object; its ID remains the provenance key.
- **Farm seed**: One logical item with a source BAR, owner, farm path, optional crop, and optional spec/PR links.
- **Parcel / satchel entry / plot plant**: Successive locations of that item, not separate grants.
- **Act record**: A separately evidenced real-world action; never inferred from tending or harvest.

## Success Criteria

### Measurable Outcomes

- **SC-001**: One local player can complete BAR → parcel → satchel → plot → harvest and follow the same BAR ID throughout.
- **SC-002**: Repeating each write and racing two parcel takes produces one seed, one plant, and no lost item.
- **SC-003**: A player looking at each phone-width state can identify the next action without developer guidance.
- **SC-004**: Plain and crop-bearing seeds both complete the loop; no unverified real-world act is written.

## Existing work and boundary

- [#732](https://github.com/johnair01/bars-engine/pull/732) supplies send-to-farm and a Seeds panel; its seed list is in `BetweenPrivate` key `seeds`.
- [#823](https://github.com/johnair01/bars-engine/pull/823), stacked on #763, supplies parcel, server-owned satchel, and planting from it. Its look and hosted/real-phone verification remain open.
- [#802](https://github.com/johnair01/bars-engine/pull/802), stacked on #793, supplies crop families and forms but explicitly leaves the live farm crop handoff and act recording unbuilt.
- [farm-seed-item](../farm-seed-item/spec.md) already rules the five-move mapping. This spec joins the pieces; it does not replace that rule or decide the mana-watering dissent.
- All three PRs were open on 2026-11-17. Their code has not yet been proved together. The inventory join and exact order of stacking are implementation research, not settled facts.

## The ask

> “yes this makes sense let's create a spec for this and own getting all of these working together” — Wendell, chat, 2026-11-17.

**Who it is for:** A player who made a BAR and wants to work with it in the farm; also the agents building BAR, farm, and crop lanes.
**What they feel now, and what should change:** A seed appears in several promising but disconnected places. The player should feel that one thing they made has entered a world they can tend and change.

## Ontology

- `design_intent`: Carry one player-authored BAR into an embodied, understandable farm journey without multiplying it.
- `intrinsic_pleasure`: Notice the arrival, open a parcel, choose a plot, see growth, and recognize a trace of one's own work.
- `ontology_objects`: BAR, logical seed, parcel, satchel entry, plot plant, optional crop, harvest, separately evidenced act.
- `mechanical_claims`: One BAR grants at most one actionable seed; location changes are atomic; farm verbs follow the existing five-move order.
- `aqal_attention`: Interior meaning comes from the player's BAR; visible actions happen on the farm; shared meaning is not implied by a private harvest.
- `agency_and_consent`: Owner chooses when to send, take, plant, or compost; no real-world action is asserted on their behalf.
- `evidence_and_unknowns`: PR descriptions establish separate features, not compatibility. The cross-PR data contract, old seed migration, and exact crop handoff require source and local verification.
- `provenance_effects`: Keep source BAR ID and optional spec/PR links on the item through harvest; do not turn development links into player obligations.
- `risks_and_tests`: Duplicate grants, divergent inventories, out-of-order moves, and false act records; test retries, races, legacy seeds, and plain/crop-bearing paths.
- `implementation_translation`: Define one canonical seed identity and transition contract, adapt the existing writes/views to it, then run a local end-to-end walkthrough and phone look.
- `decision_or_open_authority`: Existing five-move ruling stands. Compost reversibility and any change to mana watering or real-act verification go to the Board with a concrete example if the implementation cannot retain current behavior.

## How we will know it failed

- **The cheap test, run before building:** Fetch the three PR heads, trace one source BAR ID through their read/write shapes, and attempt the local send → take → plant path; record the first broken seam.
- **The result that stops the work:** If joining requires silently creating a second seed, treating a game action as a verified real act, or changing the ruled five-move order, stop that change and take the specific choice to the Board.

## Signed

No Council stage is represented as signed yet. This integration draft records Wendell's ask and awaits the face pass and contract check.
