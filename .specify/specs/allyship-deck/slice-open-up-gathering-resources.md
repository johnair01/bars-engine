# Vertical Slice — Card Schema + "Open Up × Gathering Resources"

Worked example proving the card pattern before the full 120 are assembled. Move: **Open Up**
(receive charge → Experience BAR; *"What energy is trying to get through?"*). Domain:
**Gathering Resources**. Six cards — one per Operation. Source of truth:
[`move-library-core-rules.md`](./move-library-core-rules.md).

> Why this slice: Open Up = receiving/allowing charge, and Gathering Resources = the domain of
> needing, asking, and marshaling resources. Together they carry the **fake-asking → real-asking**
> knife (asking to be *changed*, not rescued). Best showcase for the anatomy.

## Card schema (proposed)

```ts
export type BasicMove = 'wake_up' | 'open_up' | 'clean_up' | 'grow_up' | 'show_up'
export type Operation = 'shaman' | 'challenger' | 'regent' | 'architect' | 'diplomat' | 'sage'
export type AllyshipDomain =
  | 'GATHERING_RESOURCES' | 'RAISE_AWARENESS' | 'DIRECT_ACTION' | 'SKILLFUL_ORGANIZING'
export type Capability = 'agency' | 'connection' | 'exploration' | 'rest' | 'participation'
export type OutputBar = 'awareness' | 'experience' | 'insight' | 'wisdom' | 'artifact'

export interface MoveCard {
  id: string                 // `${MOVE}-${DOMAIN}-${OPERATION}`, e.g. "OPEN-GR-SHAMAN"
  kind: 'move'
  move: BasicMove
  operation: Operation
  domain: AllyshipDomain
  outputBar: OutputBar       // open_up → 'experience'

  title: string              // evocative card name
  submovePrompt: string      // canonical submove line (core rules)

  // skill-stack anatomy (the "spell")
  primaryQuestion: string
  optimizesFor: string
  forbiddenMoves: string[]
  failureModes: string[]
  remediation: string        // the practice — what you actually do

  flavor?: string
  capabilities?: Capability[] // capability(ies) this can restore (latent; not fixed per face)
  artKey?: string             // identity/visual layer (separate axis)
}

export interface InstructionCard {
  id: string; kind: 'instruction'; topic: string; title: string; body: string
}
export type AllyshipCard = MoveCard | InstructionCard
```

ID convention for this slice: `OPEN-GR-<OPERATION>`. Operation essence: Shaman=Notice,
Challenger=Challenge, Regent=Steward, Architect=Amplify, Diplomat=Care, Sage=Integrate.

---

## The 6 cards

### OPEN-GR-SHAMAN — "The Empty Cup"
- **Operation / Move / Domain:** Shaman · Open Up · Gathering Resources
- **Submove (canonical):** *Allow experience — what am I actually feeling?*
- **Primary Question:** What does the lack actually *feel* like in my body, before I reach for a plan?
- **Optimizes For:** Honest contact with the felt sense of need, so resourcing starts from truth, not panic.
- **Forbidden Moves:** Jumping straight to a budget/plan · numbing the need · performing abundance you don't feel.
- **Failure Modes:** Spiritual bypass ("I don't really need anything") · scarcity panic · talking about "the money" with no body in it.
- **Remediation (practice):** Name the sensation of lack out loud — *where* it sits in the body — before you make a single ask.
- **Flavor:** *The child holding the empty cup is not a problem to solve yet. First, let yourself see the cup.*
- **Restores:** connection · rest · → Experience BAR

### OPEN-GR-CHALLENGER — "The Ask You're Avoiding"
- **Operation / Move / Domain:** Challenger · Open Up · Gathering Resources
- **Submove (canonical):** *Allow discomfort — what am I avoiding feeling?*
- **Primary Question:** What resource am I afraid to ask for — and what am I avoiding feeling about needing it?
- **Optimizes For:** Contact with the avoided discomfort of dependence; surfacing the *real* ask under the safe one.
- **Forbidden Moves:** Rescuing yourself just to avoid asking · self-sufficiency performance · resentment in place of a request.
- **Failure Modes:** **Fake asking** (asking for rescue, not to be changed) · martyrdom · saying "no" *for* people before they can answer.
- **Remediation (practice):** Feel the "no" you're bracing against. Make the real ask anyway — for the thing you actually need.
- **Flavor:** *It never worked because the asking was fake. It was asking for rescue, not asking to be changed.*
- **Restores:** agency · connection · → Experience BAR

### OPEN-GR-REGENT — "Stay With the Need"
- **Operation / Move / Domain:** Regent · Open Up · Gathering Resources
- **Submove (canonical):** *Hold responsibility — can I stay with this?*
- **Primary Question:** Can I hold this need as *mine to steward* — without collapsing into helplessness or dumping it on someone else?
- **Optimizes For:** Staying present and responsible to the gap long enough to act from steadiness.
- **Forbidden Moves:** Making your need someone else's emergency · abdicating it entirely · grabbing total control to feel safe.
- **Failure Modes:** Helplessness handoff · savior-summoning · white-knuckling it alone.
- **Remediation (practice):** Hold the need for sixty seconds without solving it. Then choose *one* stewarding act you can own.
- **Restores:** agency · rest · → Experience BAR

### OPEN-GR-ARCHITECT — "The Hidden Supply"
- **Operation / Move / Domain:** Architect · Open Up · Gathering Resources
- **Submove (canonical):** *Receive the resource — what energy is hidden here?*
- **Primary Question:** What resource is already within reach that I haven't let myself receive?
- **Optimizes For:** Perceiving latent/available resources — skills, relationships, slack, standing offers.
- **Forbidden Moves:** Hoarding · discounting what's offered · the reflexive "it's not enough."
- **Failure Modes:** Scarcity blindness · refusing help that's right there · over-counting the future while starving the present.
- **Remediation (practice):** List three resources already within reach. Receive one of them *today*.
- **Restores:** exploration · participation · → Experience BAR

### OPEN-GR-DIPLOMAT — "The Tenderness of Asking"
- **Operation / Move / Domain:** Diplomat · Open Up · Gathering Resources
- **Submove (canonical):** *Care for experience — how can I relate compassionately to this?*
- **Primary Question:** How can I relate to this need — mine and others' — with care instead of shame or scorekeeping?
- **Optimizes For:** A compassionate relational stance toward resource flow; giving and receiving without debt-shame.
- **Forbidden Moves:** Transactional scorekeeping · leveraging guilt · pity dressed as generosity.
- **Failure Modes:** Obligation webs · charity-as-power-over · resentment-laden giving.
- **Remediation (practice):** Offer or receive one resource with *no strings* — and say "no strings" out loud.
- **Restores:** connection · participation · → Experience BAR

### OPEN-GR-SAGE — "When You Stop Fighting the Lack"
- **Operation / Move / Domain:** Sage · Open Up · Gathering Resources
- **Submove (canonical):** *Witness experience — what happens when I stop fighting it?*
- **Primary Question:** What becomes clear about this need when I stop fighting it and simply witness it?
- **Optimizes For:** Integrated seeing of the resource pattern — the larger truth about what the need is *really* about.
- **Forbidden Moves:** Forcing the insight · bypassing into "it's all fine" · premature meaning-making.
- **Failure Modes:** Spiritual gloss · passivity disguised as acceptance · analysis standing in for witness.
- **Remediation (practice):** Watch the lack for three breaths without fixing it. Write the one true sentence that surfaces.
- **Restores:** exploration · connection · → Experience BAR

---

## What this slice proves (for the assembly pipeline)

1. **The anatomy holds.** Every `(operation × move × domain)` cell yields a distinct, non-shaming,
   *playable* card — operation gives the *stance*, move gives the *function*, domain gives the
   *context*. None feel like filler.
2. **The grammar is generable.** `submovePrompt` + `primaryQuestion` come straight from the core
   rules + operation essence; the domain inflects the wording (Gathering Resources → need/asking/
   supply language). The move-grammar resolver can draft these; the **anatomy fields + flavor** are
   where human polish lives.
3. **Capabilities stay latent** (a *set* per card, selected at consult), honoring "faces are
   channel-agnostic."
4. **`outputBar` is fixed by move** (Open Up → Experience), giving the BAR-flow tie-in for free.

→ Next: confirm voice/format, then this becomes the template the assembly script fills across all
**5 moves × 6 operations × 4 domains = 120**, plus the **30 instruction cards** (BAR flow, how to
draw/consult, capability model, problem→move index).
