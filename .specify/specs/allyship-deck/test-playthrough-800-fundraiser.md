# Full-System Test — Apply the Move Library to a Real Goal

**Goal:** Raise **$800 for someone else** (a friend who needs it — car repair / rent / medical).
**Domain:** Gathering Resources. **Use context:** a real **campaign / milestone**, in service of
another person — *not* private introspection.

This tests the tension the author named: *the cards are introspective ("what am I feeling?") but
will be used on milestones and campaigns for helping others.* We run the complete BAR flow
(Charge → Wake → Open → Clean → Grow → Show) and see whether introspective cards drive outward
action — and what the design needs to add.

---

## The playthrough (Gathering Resources)

### Charge
*"My friend needs $800 by the end of the month. I want to help — and I immediately feel my own
scarcity and the fear of asking people for money again."* (The charge is real and mixed: care +
scarcity + ask-shame.)

### 1 · WAKE UP — Awareness *(what is happening?)*
| Operation | Applied to the campaign |
|-----------|-------------------------|
| Shaman (Notice signal) | What's the *real* need — the $800, or the dignity behind it? Notice both their signal and mine. |
| Challenger (Notice resistance) | What in me resists raising money for someone — "I can barely help myself"? |
| Regent (Notice stewardship) | Is $800 the right ask, the right timeline, the right target? |
| Architect (Notice potential) | What networks / channels could carry this? |
| Diplomat (Notice relationships) | Who's in the web — my friend (do they consent to a public ask?), potential givers, power dynamics? |
| Sage (Notice meaning) | Why this person, why now — what story does helping serve? |
→ **Awareness BAR:** *"A friend needs $800; I feel pulled to help and braced by my own scarcity and ask-shame."*

### 2 · OPEN UP — Experience + Channel ID *(what energy is trying to get through?)*
This is the slice deck (`OPEN-GR-*`), used **on behalf of the campaign**:
- **The Empty Cup (Shaman):** feel the lack honestly — but now the cup is *theirs and mine*.
- **The Ask You're Avoiding (Challenger):** the avoided ask is *asking my network for someone else* — am I afraid of spending social capital? → the fake-asking knife reappears, pointed outward.
- **Stay With the Need (Regent):** can I steward *their* need without making it my emergency or savior-grabbing it?
- **The Hidden Supply (Architect):** what's already available — a venue, a match donor, an email list?
- **The Tenderness of Asking (Diplomat):** ask for them without shame, scorekeeping, or pity toward my friend.
- **When You Stop Fighting the Lack (Sage):** what's true when I stop fighting both their lack and my discomfort?
→ **Experience BAR + Channel identified:** likely **Water/Connection** (distance from my friend's wellbeing) braided with **Metal/Fear** (the ask).

### 3 · CLEAN UP — Insight + Missing Move *(what move is missing?)*
- Shaman: which channel is active? **Fear** (judgment) over **Sadness** (their situation).
- Challenger: what story am I believing? *"People will think I'm always asking for money."*
- Regent: what capability is unavailable? **Agency** — "I can act / post the ask."
- Architect: Transcend / Translate / **Neutralize**? → **Translate** Fear → Agency (Metal → Fire) so the ask becomes a clear act.
- Diplomat: which channel better serves? Move from Fear to **Connection** — frame the ask as an invitation to belong to a good thing.
- Sage: what does this teach? *Asking for others is the rep that finally makes asking real.*
→ **Insight BAR + Missing move:** *"Translate ask-fear into agency; the missing move is the clear public invitation."*

### 4 · GROW UP — Wisdom + Capacity *(who must I become?)*
- Build the capacity to run a clean ask: post it, hold the discomfort, receive, follow up, thank.
- → **Wisdom BAR + Capacity gained:** *"I can ask on someone's behalf without collapsing or apologizing for the need."* (Restores **Agency** + **Connection**.)

### 5 · SHOW UP — Artifact *(what shall I create?)*
| Operation | Concrete artifact for the $800 campaign |
|-----------|------------------------------------------|
| Shaman (choose domain) | **Gather Resources** — confirmed. |
| Challenger (intervention) | Launch the **$800 ask** — the post/page goes live. |
| Regent (stewardship) | Funds handling + accountability *to the friend* (consent, transparency). |
| Architect (structure) | The campaign page + **milestones: $200 / $400 / $800**; a match-donor ladder. |
| Diplomat (relationship) | The ask list, the invite copy, the power-dynamic check (is it mine to ask?). |
| Sage (legacy) | The thank-you + the story of what the help made possible. |
→ **Artifact BAR = the fundraiser itself** (a Quest/Campaign) with milestone BARs. *The deck just produced a real campaign.*

---

## What the test proves

- **Introspective cards DO drive outward action.** In this system your own charge (scarcity,
  ask-shame) is precisely what blocks effective help; Open Up + Clean Up metabolize it, Grow Up
  builds capacity, Show Up invests it in *their* campaign. "Emotional energy is fuel" — confirmed
  end-to-end. The fake-asking knife works *outward* (asking for others) as cleanly as inward.
- **Milestones + campaigns are native to Show Up + the BAR flow.** The $800 decomposes into
  milestone BARs; the deck can be re-consulted at each milestone (stuck at $400 → draw/consult).

## What the test reveals the design needs

> **Finding: cards need two registers — a SUBJECT toggle (self ↔ other/collective).**
> The submoves are written "what am I feeling?" but on a helping-others campaign the same move must
> also read "what is needed *here / for them / for the collective*?" Every card above had to be
> *mentally reframed* outward. That reframe should be **built in, not improvised.**

Proposed schema addition (extends the slice schema):

```ts
interface MoveCard {
  // …existing…
  primaryQuestion: string          // introspective default ("what am I feeling?")
  campaignQuestion?: string        // for-others / milestone reframe ("what does this campaign need?")
  subject?: 'self' | 'other' | 'collective'  // default consult lens; overridable at draw time
}
```

And a **consult-mode toggle** in the reader/guidebook: *"I'm working on myself"* vs *"I'm working a
campaign/milestone (for/with others)."* The same 120 cards serve both; the toggle swaps which
question is foregrounded. (No new cards — a second reading of each card.)

Secondary findings:
- **Consent & power-dynamics belong on the Diplomat cards** explicitly (is it my place to ask on
  their behalf? did they agree to a public ask?). The Diplomat operation already asks "what power
  dynamic matters?" — make it explicit in for-others mode.
- **Domains can shift mid-campaign** (a fundraiser may need Raise Awareness to reach $800). The
  deck handles this via the domain axis; the consult flow should allow switching domains.

## Recommendation

Adopt the **subject toggle** (introspective ↔ campaign) as a first-class part of the card schema
and the consult UX. It resolves the named tension without doubling the deck, and it makes the deck
usable exactly where the author intends: **on milestones and campaigns that help others.**
