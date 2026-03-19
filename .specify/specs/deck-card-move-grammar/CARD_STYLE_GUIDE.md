# BARs Engine — Card Writing Style Guide

**Version**: 1.1
**Scope**: Starter deck card body text (`bodyText`), titles, move type assignment, and canonical move expressions
**Audience**: Human designers and agent editors producing or reviewing card content

---

## Inspirational Sources

Four reference systems inform this guide. Each contributes a distinct design principle.

### I Ching
The oracle speaks in images and situations — not instructions. It names what *is*, and trusts the reader to find the move. A good I Ching reading produces clarity about the present moment, not a to-do list. The card's job is to make the player *see something real*, and the action follows from that seeing.

**Design principle**: The card is an oracle moment. The prompt reveals the situation; the player names the specific.

### Pip Decks
Each card is a formula: a named tactic (front) and its step-by-step execution (back). Color-coded by category. The language is direct and enables non-experts. Importantly — the card recommends what comes before and after, so cards create *flow*, not isolated moments.

**Design principle**: Structural clarity. Each card has one job. The move type is the category. The prompt tells you how to execute the job, not just what the job is.

### We're Not Really Strangers (WNRS)
Three levels of depth — Perception, Connection, Reflection — that move from surface to vulnerable. The question does the work, not the explanation. "Honest answers only" is the core rule. The game creates intimacy through progressively deeper disclosure, culminating in action (the Final Card).

**Design principle**: The question creates the depth. Don't explain what the player should feel — ask the question that makes them feel it. Vulnerability is the mechanic, not the theme.

### TCG/CCG Design Framework (Gabriel, BGG)
Two structural principles from competitive card game design apply directly here:

**Variables must serve the player, not complicate them.** Every field on a card — title, move type, cost, effect — is a variable. More variables increase design space but also cognitive load. The rule: if a variable doesn't change player behavior, remove it. In BARs cards, `bodyText` does most of the work. Mechanics should be immediately readable.

**Don't depend on rarity.** In competitive TCGs, rare cards create pay-to-win dynamics that erode the player base. In BARs Engine, the equivalent failure mode is *content complexity gatekeeping* — where higher-level or custom cards feel so much more powerful that starter cards become obsolete. Every starter deck card must be genuinely playable and valuable, regardless of what level of deck a player eventually builds. A `wake_up` card from the onboarding deck should be as *worth playing* as one from a Level 3 custom deck. Power comes from the player's engagement with the prompt, not from the card's mechanics.

**Design principle**: Simplicity of variables, accessibility of power. A card that any player can pick up and find meaningful is better than a card that rewards deck-building expertise.

---

## The Card's One Job

Every card in this system has one job per play:

> **Make the player name something specific they would not have named without the card, then act on it.**

The card is not a reflection exercise. It is not journaling. It is not a check-in. It is an oracle moment that produces a named artifact — a BAR, a logged action, a charge entry — that exists after the card is put down.

---

## Voice and Tone

### Always second person
Address the player directly as "you" or "your" — or use the implied "you" of the imperative mood. Never write in third person ("Players should...") or first person ("I wonder...").

✓ `What are you carrying that is not yours to hold?`
✓ `Name the one thing.` *(imperative — implied "you")*
✗ `Players might consider reflecting on their responsibilities.`

### Present tense
The card is alive now. Use present tense throughout.

✓ `What is happening underneath?`
✗ `What was happening when you last felt stuck?`

*Exception*: Retrospective `clean_up` cards may reference the recent past to name a pattern — but the naming act itself is present tense.

### One prompt, one job
Do not double-ask. One question OR one imperative, not both.

✓ `Name the person you have been circling.`
✓ `What is the weight you are still carrying from the last crossing?`
✗ `Think about who you have been circling, and what it would mean to reach out. What is holding you back?`

### No hedging
Cards do not say "might want to," "perhaps," "consider," or "you could." These are invitations, not suggestions. They speak with the authority of the oracle.

✗ `You might want to consider naming the pattern you've been noticing.`
✓ `Name the pattern. Not the event — the pattern underneath the events.`

### Specificity over generality
The card's value is in forcing specificity the player would avoid without it. Wherever a card says "something," push for "one thing." Wherever it says "people," push for "one person."

✗ `Think about someone in your community who needs support.`
✓ `Name one person in your community who is going through something that no one has named yet.`

---

## The Four Move Types

The WAVE model defines four stages of throughput. Each move type has a specific job and a specific failure mode.

### WAKE UP — *See more of what's available*

**Job**: Produce a named observation. The player should see something specific that was previously vague or invisible.

**Tone**: Curious, orienting. The I Ching oracle tone. The card reveals; the player confirms.

**Completion**: Choice-based. No required attestation. The player passes by naming the observation — even in writing it here.

**Test**: After playing this card, can the player complete the sentence: *"I now see that ___"*? If no — the card is too abstract.

**Failure modes**:
- Too broad: `What is happening in your life?` — gives the player nothing to locate
- Already known: If the observation is something any player would already name without the card, it's not a `wake_up`
- Advisory: `You should pay attention to...` — this is telling, not revealing

**Example of strong wake_up**:
> *"You have access to layers of this situation that others do not. What do you see when you go below the surface? What is the current underneath? Capture what the depth is showing you."*

### CLEAN UP — *Name the shadow; recover emotional energy*

**Job**: Surface the specific failure mode, cost, or distortion that is costing this player energy. The player should feel slightly uncomfortable — not attacked, but caught.

**Tone**: Honest, unflinching. WNRS "dig deeper" energy. The card names what the player is avoiding.

**Completion**: Choice-based, but requires honesty. The completion is naming it — not fixing it.

**The shadow card rule**: Every archetype and nation has a specific shadow — a failure mode that is the *dark side of their gift*. The `clean_up` card must name the archetype's or nation's *specific* shadow, not generic personal growth material. If the shadow named could apply to any archetype, it's too generic.

| Archetype | Gift | Shadow |
|-----------|------|--------|
| Devoted Guardian | Sustained care | Caregiving as self-erasure |
| Truth Seer | Clarity | Precision as weapon |
| Decisive Storm | Bold action | Moving without warning others |
| Still Point | Stability | Stillness as withdrawal |
| Subtle Influence | Gentle shaping | Influence as manipulation |
| Bold Heart | Direct action | Courage as dominance |
| Danger Walker | Risk navigation | Avoiding the specific risk that matters most |
| Joyful Connector | Genuine connection | Connection as performance |

**Test**: After playing this card, can the player complete: *"The specific thing I have been avoiding naming is ___"*? If it's too easy to answer without any discomfort, the card is too soft.

**Failure modes**:
- Generic shadow: `When have you been hard on yourself?` — could apply to anyone
- Over-explained: Don't explain the shadow at length; name it and let the question do the work
- Judgmental: The tone is honest, not accusatory. `Name it without judgment.` is a valid closer.

**Example of strong clean_up**:
> *"Your influence can sometimes be so gradual that you become invisible — even to yourself. When did you last make your contribution legible? Who does not know what you have done? Name the invisibility gap."*

### GROW UP — *Design or commit to a structural change*

**Job**: Produce a design, plan, or commitment — not just an insight. The player should leave with something they have *designed*, not just understood.

**Tone**: Architectural, forward-looking. Pip Decks "execution" energy. Here the card becomes a recipe.

**Completion**: Requires naming a design or commitment with enough specificity that the player could be held to it.

**Test**: After playing this card, does the player have something they committed to doing — with enough detail that someone else could verify it? If it's vague ("I'll work on this"), the card failed.

**Failure modes**:
- Insight only: `Reflect on what a more sustainable approach would look like.` — this is a `wake_up`, not a `grow_up`
- Too abstract: Design prompts must ask for specific structures, not general intentions
- Orphaned: The design produced should connect to the player's situation — not a generic best practice

**Strong grow_up** signals: "Design one piece of it." / "Commit to doing it for one week." / "Name the structure." / "Write the plan."

**Example of strong grow_up**:
> *"What single small action, taken consistently over time, would shift the system you are trying to change? Not the grand intervention — the persistent nudge. Design it. Commit to doing it for one week. Log the first instance."*

### SHOW UP — *Take action and log it*

**Job**: Require a real-world action and an attestation (log). This is the card type where nothing is completed by thinking alone.

**Tone**: Direct, declarative. The card names the action. The player does it.

**Completion**: Action-based. The player must do something in the world and log that they did it. A `show_up` card that can be completed without doing anything in the world is wrong.

**The log requirement**: Every `show_up` card must explicitly ask the player to log what happened — not just take the action. The log is what makes the card replayable and what feeds the BAR system.

**Test**: If a player could play this card while sitting still with their eyes closed, it is not a `show_up`. There must be a real-world interaction — a message sent, a conversation held, an action completed, a BAR written.

**Failure modes**:
- Pure reflection: `Sit with the question and write your thoughts.` — no action
- Missing log: The card asks for action but doesn't ask the player to record what happened
- Vague action: `Do something kind today.` — not specific enough to log meaningfully

**Strong show_up** signals: "Send the message." / "Write the BAR." / "Make the call." / "Log what you did and what shifted." / "Share it."

**Example of strong show_up**:
> *"Say the thing you have been seeing. Write it as a BAR — clearly, directly, without softening or over-qualifying. Share it with one person who needs to hear it. Log the moment of speaking."*

---

## Deck Structure: The Arc of Eight

A well-designed 8-card deck is not 8 independent prompts. It has a developmental arc.

```
WAKE UP ×2    →  Seeing the situation + seeing the self
CLEAN UP ×2   →  Naming the cost + naming the shadow
GROW UP ×2    →  Designing the structural move + growing the container
SHOW UP ×2    →  The solo action + the community-visible action
```

### The WAKE UP pair
One card should orient the player *inward* (what am I experiencing, carrying, sensing?). One should orient *outward* (what is happening in the situation, the community, the system?). Together they triangulate.

### The CLEAN UP pair
One card names the *cost* — what this archetype/nation pays for its gift. One card names the *shadow* — the way the gift becomes a failure mode. These are related but distinct: cost is about depletion; shadow is about distortion.

### The GROW UP pair
One card asks for a *structural design* (a plan, a system, a routine). One asks for a *relational move* (who else is involved, who guards the guardian, who needs to be in the room). Growth without relational accountability is just planning.

### The SHOW UP pair
One card is a *solo action* — something the player does alone in the world. One card is *community-visible* — something logged, shared, or done in relationship. The `playEffect.target` field encodes this: `self` for solo, `community` for visible.

---

## Play Effect Design

The `playEffect` field encodes what the card *does* mechanically when played.

| Effect type | When to use |
|-------------|-------------|
| `charge_generate` | The card is a pure energy-recovery moment — a naming or seeing that restores capacity. Reserve for the first `wake_up` in a deck. |
| `bar_create` | The card produces something the player logs in the BAR system. Use for most cards. |

### Magnitude guidelines

| Magnitude | Meaning | Typical card type |
|-----------|---------|------------------|
| 1 | Light touch — naming an observation | `wake_up` card 1 |
| 2 | Honest naming — naming a shadow or cost | `clean_up`, `wake_up` card 2 |
| 3 | Design or structural move | `grow_up`, `show_up` solo |
| 4 | Community-visible action or shared artifact | `show_up` community |
| 5 | Reserved for breakthrough moments — not typical in starters |

### Cost (`playCost`) guidelines
- `1` — the card is accessible; the action is within reach
- `2` — the card requires more of the player; the action is harder or more exposed

Use `playCost: 2` for cards that demand the player do something uncomfortable — name the shadow they've been avoiding, share something publicly, make the call they've been deferring.

---

## Title Design

The title is the card's headline — the first thing the player reads, and the thing they remember.

**Rules**:
- 4–7 words (occasionally up to 8)
- Either a direct question or a named action/concept
- Must be specific enough to distinguish this card from all other cards in the deck
- Questions as titles work best for `wake_up` and `clean_up`
- Declarative phrases work best for `grow_up` and `show_up`

✓ `Who Guards the Guardian?` *(clean_up — specific paradox)*
✓ `The Controlled Risk` *(grow_up — named concept)*
✓ `Build the Infrastructure of Care` *(grow_up — named action)*
✓ `Name What the Room Cannot Name` *(show_up — specific action)*

✗ `Reflection` *(too generic)*
✗ `Think About Your Community` *(too generic, no tension)*
✗ `What Are You Feeling?` *(too broad for any specific archetype)*

---

## Body Text Length

Target: **150–350 characters** of actual content per card (approximately 2–4 sentences).

- Under 120 characters: usually too sparse — the prompt doesn't do enough scaffolding
- Over 500 characters: usually over-explained — trust the prompt more, explain less

The sweet spot is a card that reads in under 15 seconds and produces 5–10 minutes of reflection or action.

---

## Card Variables and Balance

Every card has six variables. Each must earn its presence.

| Variable | What it controls | Balance concern |
|----------|-----------------|-----------------|
| `title` | First read; recall after play | Must distinguish this card from all others in the deck |
| `moveType` | The stage of throughput (WAVE) | Must match the actual job the card does — not aspirational |
| `playCost` | Energy required to play | Calibrate to the ask: uncomfortable = cost 2, accessible = cost 1 |
| `playEffect.type` | Mechanical output (charge or BAR) | `charge_generate` is rare; most cards produce a BAR |
| `playEffect.magnitude` | Intensity of output | Scales with depth of action (see magnitude table above) |
| `playEffect.target` | Who benefits | `community` must be earned — the card's action must actually involve others |

### The information load principle
A player should be able to read a card and know exactly what to do in under 15 seconds. If the body text requires re-reading to understand the task, it is too complex. Test: can you state the card's ask in one sentence? That sentence should essentially be the card.

### Raw capacity vs. supplementing moves
From competitive TCG design: there are two types of card power — *raw capacity* (doing the thing) and *supplementing moves* (enabling the thing to be done better). In BARs Engine:

- `show_up` cards = raw capacity. They require the action directly.
- `wake_up` and `clean_up` cards = supplementing moves. They build the insight and emotional energy that makes the `show_up` possible.
- `grow_up` cards = structural supplements. They design the system that makes the `show_up` repeatable.

A deck with only `show_up` energy burns players out. A deck with only `wake_up` energy produces reflection without movement. The 2×2×2×2 arc is a deliberate balance between these modes.

### The rarity trap in content design
Starter decks must not feel like a lesser product. The trap: writing archetype-specific or nation-specific language that is *so* rich and resonant that the generic onboarding deck feels hollow by comparison. The fix: onboarding cards must carry the same quality of oracle precision — they are simply wider in target audience, not shallower in craft.

---

## Common Weaknesses to Flag

When reviewing cards, look for these patterns:

| Flag | Description | Fix |
|------|-------------|-----|
| **Too comfortable** | The card could be played without any discomfort | Add specificity or raise the shadow |
| **Generic shadow** | Clean_up card applies to any human, not this archetype | Name the archetype's *specific* failure mode |
| **Reflection trap** | Show_up card can be completed without leaving the chair | Add required action + log |
| **Double ask** | Two questions in one card | Pick the stronger one |
| **Advice mode** | Card tells the player what to think or do rather than prompting | Reframe as question or specific imperative |
| **No arc** | The 8 cards don't build — could be played in any order without loss | Ensure the pairs compound |
| **Missing log** | Show_up card has no "log what happened" closer | Add it |
| **Target mismatch** | Card says `community` but action doesn't require anyone else | Fix target or add the community element |

---

## The Solitaire Test

Before a card is considered complete, it passes the solitaire test:

1. **Can you play it alone, in 10 minutes?** If it requires external setup, simplify.
2. **Does playing it produce something you can log?** If not, it's not a playable card — it's a journal prompt.
3. **Would you remember what you did after playing it?** A card that produces a vague feeling is not a card — it's a mood.
4. **Is the specific thing named?** Not "I thought about my community" — "I named [person/situation/pattern]."

---

---

## Hearts Blazing Learnings (v1.1 additions)

*From the Face agent review of Hearts Blazing (Games by Play Date, 2015). See: `HEARTS_BLAZING_REVIEW.md`*

### Second-Register Names

Every canonical move has a **second-register name** — a 2-5 word compression phrase that fires a felt sense before the player consciously processes the description. Inspired by Hearts Blazing's cliche card naming convention ("True Grit", "Get to Da Choppa!").

BARs Engine's second-register names are drawn from the game world's own elemental/archetype register, not pop-culture. They are **first-pass bootstrap** names to be refined by the cultural substrate pipeline as community BARs accumulate. See: `.specify/backlog/prompts/cultural-substrate-card-language.md`.

| Move ID | Canonical Name | Second-Register Name | Status |
|---------|---------------|---------------------|--------|
| `metal_transcend` | Step Through (Excitement) | **Walk the Cutting Edge** | bootstrap |
| `water_transcend` | Reclaim Meaning | **The Tide Knows Its Shore** | bootstrap |
| `wood_transcend` | Commit to Growth | **Root Before You Reach** | bootstrap |
| `fire_transcend` | Achieve Breakthrough (Triumph) | **The Boundary Holds** | bootstrap |
| `earth_transcend` | Stabilize Coherence | **Become the Floor** | bootstrap |
| `wood_fire` | Declare Intention | **Say It Out Loud** | bootstrap |
| `fire_earth` | Integrate Gains | **Let It Land** | bootstrap |
| `earth_metal` | Reveal Stakes | **Name What Is Load-Bearing** | bootstrap |
| `metal_water` | Deepen Value | **Cut to What Matters** | bootstrap |
| `water_wood` | Renew Vitality | **The Grief Fed Something** | bootstrap |
| `wood_earth` | Consolidate Energy | **Tend the Ground You Have** | bootstrap* |
| `fire_metal` | Temper Action | **Cool Before You Cut** | bootstrap* |
| `earth_water` | Reopen Sensitivity | **Soften the Wall a Little** | bootstrap* |
| `metal_wood` | Activate Hope | **Fear Has a Direction Now** | bootstrap* |
| `water_fire` | Mobilize Grief | **Sadness With a Spine** | bootstrap* |

*\* Control moves are highest priority for corpus refinement — players are most likely to misread these because the kè cycle's subtractive quality runs against the implicit expectation that a move should feel generative. Real player BARs about using a control move well — where the constraint was the gift — are what these names are waiting for.*

**How to refine a bootstrap name**: When an exemplary BAR arrives that captures the felt essence of a move in the community's own language, the cultural substrate distillation pipeline extracts the compression phrase. If it outperforms the bootstrap name on the "fires before it explains" test, it replaces it.

---

### Contextual Expressions (I / We / Its)

Every canonical move has three contextual expressions — one per relational register. These give group-play cards a shared interpretive contract: two players holding a card of the same `moveType` can read it into different relational contexts without losing its essential meaning.

The three registers map to AQAL quadrants:
- **I (internal)**: Individual/Interior — what the player notices or experiences in the body and psyche
- **We (interpersonal)**: Collective/Interior — what changes between people; what others notice or receive
- **Its (systemic)**: Collective/Exterior — what a community or room observer could name from outside

Full expressions for all 15 canonical moves are in `src/lib/quest-grammar/move-expressions.ts`.

**Examples:**

`earth_transcend` — "Stabilize Coherence" / **Become the Floor**
> **I:** You stop reaching for the next thing to add. The steadiness you feel is not detachment — it is full presence without agenda. You become the thing in the room that is not moving.
> **We:** Others feel themselves orienting toward you without knowing why. You are not directing them — you are simply stable enough that the field around you stops spinning. People find their footing.
> **Its:** The confusion that was circulating settles. Not because anyone solved the problem — because a reference point became available. The system finds its level the way water finds its level.

`water_fire` — "Mobilize Grief" / **Sadness With a Spine**
> **I:** The grief does not need to be managed before it is useful — it needs to be fully met. When you stop trying to move past it and let it land completely, something underneath it becomes legible: what you are grieving mattered enough to protect what remains.
> **We:** The people in the room feel something shift from diffuse sadness into named care. The boundary lands differently when others can feel the grief underneath it. It does not close them out. It tells them what is worth standing with.
> **Its:** The community sees grief converted into something that holds a line — not from hardness but from the precision that only comes from genuine loss. The system does not lose the grief. It learns what the grief was always trying to protect.

**Writing principle**: Each expression should feel like it belongs to its specific elemental register — not interchangeable with the others. The `water_fire` expression should have a different texture from `fire_earth`. The element is in the writing, not just the label.

---

### Intensity Register

Hearts Blazing uses bid values (1, 2, 3, 6) to distinguish move intensity. BARs Engine's current `playCost` binary (1 or 2) only covers the 1–2 band — it has no encoding for the 3 (skilled, repeated mastery) or 6 (identity-constituting, once-per-arc) registers.

**Intensity levels** (for card design consciousness, even before schema implementation):

| Intensity | Description | BARs equivalent |
|-----------|-------------|-----------------|
| **Everyday** (1) | Accessible, any session, low barrier | playCost: 1 |
| **Capable** (2) | Requires some emotional readiness | playCost: 2 |
| **Skilled** (3) | Requires practice and developmental context | (not yet encoded) |
| **Defining** (6) | Identity-constituting; once-per-arc; marks who you are | (not yet encoded) |

A `defining`-intensity card is not just hard — it is *the move the archetype is known for*. The Devoted Guardian's defining card is the one where they name what they are willing to sacrifice to protect what matters. The Decisive Storm's defining card is the strike that changes the situation irreversibly.

**Design implication**: When writing archetype and nation starter decks, identify which card is the defining move (the one the archetype would be remembered for) and write it at that register. Currently this lives in the bodyText quality rather than a schema field — the defining card should be viscerally different from the everyday cards in the same deck.

---

### The Carried Weight Mechanic (design note)

Hearts Blazing's "Frailty" card (voluntarily played, -1 bid value, penalizes at Finale if held) is structurally doing something BARs Engine's `clean_up` cards are not: it makes shadow material into a **holdable object** the player carries and chooses when to play.

BARs Engine acknowledges shadow (via the Shaman's `nameShadowBelief` → insight BAR) but the acknowledgment has no downward pressure on current play capacity. The held-but-unplayed state is not modeled.

The **Carried Weight** mechanic (planned, Phase 2) would:
- Give the shadow belief named during 321 a card form the player holds in their hand
- The card is meaningful held-but-unplayed (the system sees the load)
- The player chooses when to play it (not: "do shadow work" — "decide whether to play the card")
- Playing it produces a BAR; holding it past a milestone incurs a cost

This is NOT Hearts Blazing's Frailty. BARs is not competitive. The mechanic serves: *I am choosing to pick up this weight because the story requires it and I trust the system to help me work with it.*

---

## Agent Editorial Lenses

When an agent reviews cards, they review from their Face's specific concern. These are not overlapping — each lens catches a distinct class of problem.

| Face | Reviews for | Key question |
|------|-------------|--------------|
| **Challenger** | Edge and demand — does the card actually require something of the player? | *Would this card make me uncomfortable? If not, why not?* |
| **Regent** | Structural integrity — does the move type match the mechanics? | *Does this show_up require an action? Does this clean_up name a shadow?* |
| **Architect** | Deck arc — do the 8 cards compound? Is there a developmental sequence? | *What does card 2 assume card 1 revealed? Do they build?* |
| **Diplomat** | Relational depth — does the deck build toward community? Are community-target cards earned? | *Who else is in this card? What relationship does it activate?* |
| **Shaman** | Mythic register — does the card language invoke the archetype's energy? | *Does this card sound like the Bold Heart / Devoted Guardian / etc.? Or could it be in any deck?* |
| **Sage** | Integration — does the deck as a whole teach developmental wisdom? Does the shadow pair actually do shadow work? | *If a player completed this deck, what would they have learned about their type?* |
