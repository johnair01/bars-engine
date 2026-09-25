# Spec: Goodbye Yellow Brick Road — Oracle party one-shot

## Purpose

Ship a **one-night, mobile-first party game** for Wendell's Portland going-away party on **Saturday, August 15, 2026**, starting at **8:00 PM PDT**.

The one-shot is a **spiritual fork of the existing Valkyrie Party implementation**, not a new party platform. Reuse Valkyrie's guest identity, Oracle cards, art, Easy/Medium/Hard interaction patterns, party metadata, admin/editing patterns, discovery infrastructure, and mobile UI wherever possible.

The game should help people cross from **"I wish..." to "we're doing..."**. It scaffolds desire, connection, boldness, meaning, and future possibility without becoming another activity competing with the party.

**Canonical implementation goal:** one deft implementation pass with minimum new architecture before the live event.

---

## Non-negotiable design principles

- **Players are protagonists.** Wendell is both player and Game Master; guests are players who also make local Game Master moves through what they initiate, host, invite, and facilitate.
- **Invitations > instructions.** Cards create possibilities, not obligations.
- **Behavior > interface.** The room is the game; the phone lowers activation energy.
- **Momentum > completion.** A played card may remain active forever; no task-manager pressure.
- **Optionality > obligation.** Discard is a first-class move, not failure.
- **Oracle grammar stays canonical.** Suit, rank/title, art, and Easy/Medium/Hard depth remain meaningful. Party content is an interpretation layer, not a replacement ontology.
- **No authority over another player's consent.** Achievements may grant permission, legitimacy, access, resources, or facilitation rights to initiate play; they never manufacture another person's yes.
- **The GM tools must reduce host labor enough that Wendell can remain a player.**
- **Live editing is part of the Game Master control surface.** Generated content may be repaired during play.

---

## Experience topology

### Before 8:00 PM PDT

- Party route is accessible.
- Full Oracle corpus is browsable.
- Both **Goodbye Yellow Brick Road** and **Spicy** readings may be inspected.
- Browsing does **not** alter a player's draw/discard cycle.
- No three-card hand exists yet.

### At and after 8:00 PM PDT

- Each joined player gets a personal hand of **3 unique Oracle cards**.
- Each Oracle card has two interpretation lenses:
  - **Goodbye Yellow Brick Road**
  - **Spicy**
- Each lens has **Easy / Medium / Hard** readings.
- Players freely toggle lens and depth after draw.
- Players may **Play**, **Discard**, or keep each card.
- Play or Discard resolves that Oracle card for the player's current cycle and immediately replenishes the hand back to 3.
- A resolved card cannot return to that player's hand until the player has cycled through the full Oracle corpus.
- Different players may play the same Oracle card; play identity is per-player/per-event, not globally unique.

### Midnight transition

At **12:00 AM PDT on Sunday, August 16, 2026**:

- random Spicy play/draw becomes available;
- Karaoke transitions out;
- hot-tub / vibes-showcase / lap-dance-competition energy becomes explicitly supported.

Spicy content is **not secret before midnight**. Browsing/editing is allowed earlier; midnight changes play affordance, not visibility.

---

## One Oracle hand, two interpretive decks

Conceptually players have two decks. Mechanically v1 uses:

```text
ONE personal Oracle cycle
ONE hand of 3 base Oracle cards
TWO interpretation lenses
  ├─ Goodbye Yellow Brick Road
  └─ Spicy
THREE depths per lens
  ├─ Easy
  ├─ Medium
  └─ Hard
```

Do **not** implement separate physical/shuffled Goodbye and Spicy card pools.

---

## Personal cycle rules

For each player + party:

1. At party start, deal 3 base Oracle cards not yet resolved in the current cycle.
2. `Play` marks the base card resolved for the cycle, emits a game event, puts the play on the shared board, and draws a replacement.
3. `Discard` marks the base card resolved for the cycle, emits a game event, and draws a replacement.
4. Browsing never marks a card resolved.
5. A base card cannot re-enter that player's hand until all base Oracle cards have been resolved/encountered for the cycle.
6. After exhausting the full corpus, increment/reset the cycle and make the corpus drawable again.

`PartyOracleDiscovery` remains useful for exposure/history, but current hand and resolution state should be derived from game events rather than overloading discovery as the entire game state.

---

## Shared Game Board

The Game Board is a view over **what players have brought into play**, not a separate spatial board game.

Minimum UI:

```text
FEATURED GM CARD

ACTIVE PLAYS

RECENTLY DID THIS / COMPLETED
```

A player tapping **Play** creates an Active play on the board.

A player may later self-attest with **"I did this"**. Completion is optional; incomplete cards may remain Active indefinitely without penalty.

Completion may unlock the reading's achievement/affordance.

---

## Append-only game record

Create one small party-scoped append-only event primitive as the canonical runtime record.

Conceptual model:

```ts
type PartyGameEvent = {
  id: string
  partyId: string
  playerId?: string | null
  type: string
  cardId?: string | null
  payloadJson: Json
  createdAt: Date
}
```

Expected v1 event types:

```text
party_started
hand_dealt
card_drawn
card_discarded
card_played
card_completed
gm_card_unlocked
gm_card_featured
achievement_unlocked
bar_donated
bar_capture_pending
spicy_unlocked
host_override
```

The event stream should be sufficient to derive:

- current hand;
- personal cycle progress;
- active/completed board state;
- earned party achievements;
- GM feature/unlock history;
- exportable chronological game record.

Avoid dedicated `PartyHand`, `PartyBoard`, and `PartyAchievement` tables unless implementation proves they are required.

---

## Game Master Party Deck

The Party Deck is **12 curated Oracle-based shared possibilities**, not a separate card ontology.

Schedule is deterministic from wall clock:

| Time PDT | Slot |
|---|---:|
| 8:00 PM | 1 |
| 8:20 PM | 2 |
| 8:40 PM | 3 |
| 9:00 PM | 4 |
| 9:20 PM | 5 |
| 9:40 PM | 6 |
| 10:00 PM | 7 |
| 10:20 PM | 8 |
| 10:40 PM | 9 |
| 11:00 PM | 10 |
| 11:20 PM | 11 |
| 11:40 PM | 12 |

Rules:

- Newly unlocked possibilities **accumulate**; old ones do not expire.
- Current featured GM card appears at the top of the board.
- Wall clock determines normal unlock state; do **not** build a background scheduler.
- Host may feature any unlocked card and may unlock the next card early.
- No pauseable timer for v1.
- Multiple players/groups may independently animate the same GM card.

The 12 final Oracle choices and readings are content, not new runtime architecture.

---

## Party interpretation data

Do not mutate the canonical Oracle corpus to encode this one-shot.

Create a party-specific interpretation/config JSON keyed by base Oracle card id. Canonical Oracle fields remain the source of truth for art, suit, rank/title, and base identity.

Conceptual shape:

```ts
type PartyReading = {
  prompt: string
  emotionalAlchemy?: {
    move: 'state_shift' | 'channel_shift' | 'upshift' | 'neutralize_charge' | string
    targetSatisfaction: 'wonder' | 'triumph' | 'bliss' | 'poignance' | 'peace' | string
  }
  achievement?: {
    id: string
    family: 'invocation' | 'challenge' | 'stewardship' | 'coordination' | 'interface' | 'legacy'
    title: string
    description: string
    affordance: string
  }
  hard?: {
    requiresBar: boolean
  }
}

type PartyInterpretation = {
  [baseCardId: string]: {
    goodbye: {
      easy: PartyReading
      medium: PartyReading
      hard: PartyReading
    }
    spicy: {
      easy: PartyReading
      medium: PartyReading
      hard: PartyReading
    }
  }
}
```

Party JSON is the canonical generated interpretation layer. Existing DB-backed Oracle overrides remain the **live Game Master patch layer** for text/content repairs during the event.

Generated readings may be broadly generated before play; content does **not** need publication-grade manual certification before launch because the host can edit cards in real time.

---

## Emotional Alchemy role

Party readings may use Emotional Alchemy as transformation grammar:

- **State Shift**
- **Channel Shift**
- **Upshift**
- **Neutralize Charge**

Desired emotional field emphasizes:

- **Wonder**
- **Triumph**
- **Bliss**
- **Poignance**

The cards are external/direct-action prompts. Emotional context may fuel a move, but prompts terminate in observable action in the party.

---

## Achievement + affordance grammar

Achievements are generated alongside card readings. They are **party-scoped capabilities**, not global RPG levels.

Common law:

> Achievements grant permission, credibility, access, resources, or facilitation rights for initiating play. They never create authority over another person's consent, boundaries, or ordinary agency.

Legal affordance families:

| Game Master | Family | Legal authority |
|---|---|---|
| Shaman | `invocation` | call attention, ritualize, consecrate thresholds/moments |
| Challenger | `challenge` | voluntarily raise stakes, issue optional challenges, initiate boldly |
| Regent | `stewardship` | host, welcome, sponsor, provision shared activity/resources |
| Architect | `coordination` | organize plans, expeditions, side quests, bounded logistics |
| Diplomat | `interface` | make asks, boundaries, redirects, and counteroffers more legible |
| Sage | `legacy` | preserve lore, continuity, future possibility, reusable artifacts |

Achievement is awarded when the player taps **"I did this"**, not merely when Play is pressed.

Affordances may be invoked visibly/socially (e.g. showing the achievement as the reason for initiating a party move).

Achievement historical record may persist, but its active party affordance expires with the party.

### Illegal achievement behavior

Achievements must never:

- compel another player to participate;
- punish or stigmatize refusal;
- assign another person's time/body/resources without agreement;
- turn the game into a consent bypass;
- create permanent social rank from a one-night party achievement.

---

## Hard mode and BAR capture

Hard readings should tend to:

> act → create durable/useful value or social infrastructure → capture it as a BAR → donate/persist it with provenance.

Desired provenance:

```json
{
  "source": "oracle_party",
  "party": "goodbye-yellow-brick-road",
  "card_id": "...",
  "lens": "goodbye|spicy",
  "depth": "hard",
  "play_event_id": "..."
}
```

### Graceful degradation requirement

Existing Valkyrie guests are real `Player` records, but compatibility with the existing BAR capture/auth path must be verified during implementation.

BAR capture **must not block party play**.

If existing BAR creation is not trivially compatible with `party_guest` players:

1. allow Hard play/completion to continue;
2. emit `bar_capture_pending` with the intended BAR payload/provenance in `PartyGameEvent.payloadJson`;
3. preserve enough data for later metabolism/import.

Do not build a new BAR subsystem for this one-shot.

---

## Host/admin controls

Reuse the existing Valkyrie party admin-token/host pattern.

Required v1 controls only:

- edit party card reading/copy;
- hide/delete inappropriate board play if needed;
- feature an unlocked GM card;
- unlock the next GM card early.

Do not build a generalized permissions system.

### Live edit propagation

The existing service rebuilds party cards by merging canonical Oracle + static party data + DB-backed `PartyOracleCardOverride` rows. The client must refetch party/deck data often enough during the active party for host edits to appear without manual cache warfare.

A simple periodic refetch (approximately 15–30 seconds) or refetch after meaningful interactions is sufficient. Do not introduce websockets/realtime infrastructure for v1.

---

## Visual direction

Reuse as much Valkyrie Party UI and Oracle art as possible.

No new art required.

Palette:

- **deep emerald**
- **road gold**
- **warm cream**
- **midnight plum**

Spicy is a hotter state/accent within the same visual world, not a separate product skin.

Follow existing mobile/card UI conventions; avoid a new bespoke card renderer unless existing Valkyrie components prove impossible to reuse.

---

## Party context / physical affordances

The software supports the real party rather than reproducing Partiful logistics.

Relevant runtime context:

- upstairs: grill/kitchen + dance party;
- downstairs: karaoke until midnight;
- midnight transition makes room for hot tub;
- hot tub should appear as a playable party possibility;
- lap-dance competition / vibes showcase is part of the post-midnight spicy field.

Partiful remains source-of-truth for ordinary event logistics; do not duplicate RSVP/event-management features.

---

## Explicit v1 non-goals

- New art.
- Rebuilding Valkyrie Party from scratch.
- New generalized party architecture.
- Separate Spicy physical hand/deck state.
- Player-authored cards (retain underlying Valkyrie capability but hide/defer for v1).
- Pauseable timer.
- Background cron/scheduler for GM cards.
- Spatial/draggable game board.
- Leaderboards.
- Full Vibeulon economy.
- New bounty economy.
- Global/permanent achievement powers.
- Runtime AI generation during party play.
- Publication-grade manual review of every generated reading before launch.
- Hard dependency on BAR capture success.

---

## Success criteria

The one-shot succeeds if:

1. A guest can join on mobile with lightweight Valkyrie-style identity and begin playing without full signup.
2. At 8:00 PM PDT the guest receives a 3-card hand.
3. Play/Discard always replenishes the hand and does not repeat a base Oracle card within that player's cycle.
4. The guest can toggle Goodbye/Spicy and Easy/Medium/Hard readings on a card.
5. Playing a card visibly places the play on the shared board.
6. "I did this" can complete the play and unlock a structured party achievement/affordance.
7. The featured GM card changes according to the 20-minute schedule and may be overridden simply by host controls.
8. Spicy random play is unavailable before midnight and available at/after midnight while Spicy browsing remains available before midnight.
9. Host can live-edit bad content and clients receive the update without redeploying.
10. Hard-mode BAR failure does not break the game.
11. Existing Oracle art/identity and Valkyrie UI remain recognizably intact under the new palette.
12. The game produces more real-world initiation, connection, play, and memorable artifacts than passive phone use.

---

## Acceptance criteria — implementation-ready one-shot

- [ ] New party route/config is isolated from the existing Valkyrie party instance.
- [ ] Party starts Saturday Aug 15, 2026 at 8:00 PM `America/Los_Angeles` / PDT.
- [ ] Player hand size is exactly 3 after every successful deal/play/discard action while cards remain available.
- [ ] Browsing does not affect personal cycle state.
- [ ] Play and Discard both remove the card from the current cycle and draw a replacement.
- [ ] No same base Oracle card is redrawn within a cycle for the same player.
- [ ] One event model/primitive records game moves; current board/hand/achievement views derive from events.
- [ ] Party interpretation JSON supports both lenses × all three depths with structured achievement data.
- [ ] 12 GM slots unlock at the specified 20-minute wall-clock times.
- [ ] Host can feature any unlocked GM card and unlock next early.
- [ ] Spicy browse works before midnight; random Spicy play/draw gate changes at midnight.
- [ ] `Play` creates Active board entry; `I did this` records completion.
- [ ] Completion unlocks configured achievement/affordance.
- [ ] Achievement family is one of the six legal enums.
- [ ] Hard BAR path reuses existing capture when compatible or records pending provenance without blocking completion.
- [ ] Existing dynamic Oracle edit flow still works for the party and propagates to clients during live play.
- [ ] Palette changes are applied without replacing canonical Oracle art.
- [ ] Player-authored cards and other v2 controls are absent/hidden from the one-shot UX.
- [ ] Relevant tests/checks pass before deployment.
