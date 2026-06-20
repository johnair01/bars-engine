# Superpower Quiz — Item Bank & Result Copy (DRAFT for review)

> **Reviewable authored data** for [`superpower-quiz-design`](./spec.md), mined from
> the six Strategy Guides (Drive) + the addendum (Coach). **Not code yet** — review
> and edit this, then it becomes `src/lib/superpowers/quiz/{items,score,descriptions}.ts`.
> Follows [RESEARCH_quiz-construction.md](./RESEARCH_quiz-construction.md):
> forced-choice behavioral items, multi-weighted options, shadows included (no
> equalized favorability), falsifiable copy, lens-not-verdict framing.

## Superpower profiles (mined from the guides)

| Superpower | Element → emotion arc | Domain (WHERE) | Overuse shadow | Avoidance shadow | "Signs someone needs them" |
|-----------|----------------------|----------------|----------------|------------------|----------------------------|
| **Connector** | Earth (Neutrality→Peace) + Water (Sadness→Poignance) | Raise Awareness / Gather Resources | over-mediates, responsible for everyone's bonds, absorbs all emotions | withholds intros — "people should figure it out" | isolated-but-open; trying to bridge a divide; has value but no social pathway |
| **Storyteller** | Fire (Anger→Triumph) + Water (Sadness→Poignance) | Raise Awareness | **the Manipulator** — distorts/dramatizes for engagement | **the Lost Author** — won't claim a voice, lets others own the story | can't inspire action; trapped in an old story; needs to reframe after a shift |
| **Strategist** | Metal (Fear→Clarity/Precision) + Wood | Skillful Organizing | analysis paralysis, over-control, people-as-chess-pieces | won't act without a perfect plan | no roadmap; leverage unseen; energy leaking everywhere |
| **Disruptor** | Fire (Anger→Triumph) | Direct Action | **the Chaos Bringer** — burns everything, fights to fight | **the Caged Rebel** — bitter, waits for permission, inert | stuck in stagnation/avoidance; in denial about a broken system |
| **Alchemist** | All elements (Sadness→Poignance→Joy) | Direct Action / emotional alchemy | **Emotional Overload** — absorbs too much, burns out | **the Detached Observer** — intellectualizes, stays distant | emotionally stuck in grief/fear; knows what to do but can't move |
| **Escape Artist** | Water (Sadness→Poignance) + Metal (Fear→Excitement) | Direct Action (strategic exit) | **the Martyr** — stays too long out of guilt | **the Ghost** — bolts at first friction | sustaining a broken system; drained faster than they recover; punished for growth |
| **Coach** | Fire (Frustration→Triumph) — softened Disruptor; integrator of all | Gather Resources (capacity-building) / self-allyship | **the Taskmaster** — drags instead of calls up; creates dependence | **the Empty Cheerleader** — only affirms, never nudges | knows what to do but won't start; outgrown their level but loyal to it; stuck in an expired story; waiting for permission |

Abbreviations below: `CON STO STR DIS ALC ESC COA`.

---

## Items (forced-choice, behavioral) — 11 superpower + 1 orientation

> Each item: pick **one**. Each option carries `weights` (primary = 2, secondary =
> 1). Quasi-ipsative: options are *not* equally desirable (shadows included).
> Light guild/heist flavor in framing; items themselves stay concrete (research:
> one idea per item, behavioral not adjectival).

### Q1 — A group effort is stalling; the meeting's going in circles. Your instinct?
- "Who's *not* in this room that should be? I start making the call." → `CON:2`
- "Reframe what this is *really* about so people care again." → `STO:2`
- "Lay out the steps and who owns what." → `STR:2`
- "Name the thing nobody will say out loud." → `DIS:2`
- "Read the mood, ease the tension before we go further." → `ALC:2`
- "Ask whether this is even worth saving." → `ESC:2`

### Q2 — You walk into a room thick with tension. First move?
- "Find whoever's on the edge and pull them in." → `CON:2`
- "Feel the undercurrent and name it gently." → `ALC:2`
- "Clock who actually decides things here." → `STR:2`
- "Say the true thing." → `DIS:2 STO:1`
- "Drop in a story that changes the frame." → `STO:2`

### Q3 — A friend is stuck in something draining (job, relationship, group). You…
- "Help them see the door's already open — leaving is allowed." → `ESC:2`
- "Help them find the one next step they can actually take." → `COA:2`
- "Introduce them to someone who's walked this road." → `CON:2`
- "Help them feel the grief/fear underneath before deciding." → `ALC:2`
- "Map the bigger pattern and a way out." → `STR:2`

### Q4 — Honest check: when you're overextended, you tend to… *(shadow item)*
- "Carry everyone's relationships until I'm fried." → `CON:2`
- "Dramatize a bit to get people to act." → `STO:2`
- "Over-plan and grip too tight — people become chess pieces." → `STR:2`
- "Burn it all down; fight for the sake of fighting." → `DIS:2`
- "Soak up everyone's feelings till I crack." → `ALC:2`
- "Either stay way too long out of guilt, or bolt at the first snag." → `ESC:2`

### Q5 — People come to you when they need…
- "An introduction — to be connected to the right person." → `CON:2`
- "To understand *why* something matters." → `STO:2`
- "A plan — someone thinking three moves ahead." → `STR:2`
- "Someone to challenge what's broken." → `DIS:2`
- "To process something heavy." → `ALC:2`
- "Permission and clarity to walk away." → `ESC:2`
- "A push — to actually start." → `COA:2`

### Q6 — A cause you love is losing steam. You…
- "Reframe the story so people care again." → `STO:2`
- "Rekindle morale — hold the grief, shift the energy." → `ALC:2`
- "Find the leverage and sharpen the plan." → `STR:2`
- "Apply pressure; force the issue." → `DIS:2`
- "Rebuild the relationships holding it together." → `CON:2`

### Q7 — What quietly frustrates you about people?
- "They let good relationships wither." → `CON:2`
- "They swallow the story they were handed." → `STO:2`
- "They act before thinking it through." → `STR:2`
- "They tolerate what's obviously broken." → `DIS:2`
- "They run from their own feelings." → `ALC:2`
- "They stay in cages with the door wide open." → `ESC:2`
- "They know what to do but never begin." → `COA:2`

### Q8 — "Moving the needle" looks like…
- "The right two people finally meeting." → `CON:2`
- "A story that changes how people see it." → `STO:2`
- "A plan that actually holds up." → `STR:2`
- "Breaking the thing blocking everyone." → `DIS:2`
- "A real shift in the room's energy." → `ALC:2`
- "Someone taking the actual next step." → `COA:2`

### Q9 — The risk you'll most readily take…
- "Vouch for people across a divide." → `CON:2`
- "Say the uncomfortable true thing in public." → `DIS:2 STO:1`
- "Bet on a plan others call overkill." → `STR:2`
- "Sit in someone's pain without fixing it." → `ALC:2`
- "Walk away from what everyone says I should keep." → `ESC:2`

### Q10 — Helping *this* campaign, you light up at…
- "Weaving the network — warm intros." → `CON:2`
- "Crafting the message." → `STO:2`
- "Building the plan and structure." → `STR:2`
- "Challenging the bottleneck." → `DIS:2`
- "Tending people's energy and morale." → `ALC:2`
- "Knowing when to cut losses and pivot." → `ESC:2`
- "Coaching someone to their next step." → `COA:2`

### Q11 — The compliment that lands deepest…
- "'You brought the right people together.'" → `CON:2`
- "'You helped me see it differently.'" → `STO:2`
- "'You saw that coming — your plan worked.'" → `STR:2`
- "'You said what no one else would.'" → `DIS:2`
- "'You helped me feel it and move through it.'" → `ALC:2`
- "'You helped me let go.'" → `ESC:2`
- "'You helped me actually do it.'" → `COA:2`

### Q12 — ORIENTATION (separate axis — not superpower scoring)
> *"Where is this card asking you to ally?"* (the addendum's polarity)
- "Work within myself first, so I can act cleanly." → `orientation: internal`
- "Move resources, people, or story out in the world." → `orientation: external`

---

## Coverage check (signals per superpower)

Counting primary (2) appearances across Q1–Q11:

| | CON | STO | STR | DIS | ALC | ESC | COA |
|--|--|--|--|--|--|--|--|
| Items appearing as primary | Q1,2,5,6,7,8,9?,10,11 (≈8) | Q1,2(sec),5,6,7,8,9(sec),10,11 (≈7) | Q1,2,3,5,6,7,8,9,10,11 (≈9) | Q1,2(sec→DIS2),4,5,7,8,9,10,11 (≈8) | Q1,2,3,4,5,6,7,8,9,10,11 (≈10) | Q3,4,5,7,8(no),9,10,11 (≈7) | Q3,5,7,8,10,11 (≈6) |

All seven clear the ≥3–4 signal floor (Coach lowest at ~6 — acceptable). **To
finalize**: balance so every superpower has the *same* primary
count, or rely on percent-of-max normalization (the scorer does this). Over-generate
a few alternates (below) and swap to even out Coach/Escape Artist.

### Alternate/candidate items (over-generate-and-trim pool)
- *Coach:* "Someone's overwhelmed by everything they *could* do. You…" → help them
  pick one true next step (`COA:2`) vs map the whole plan (`STR:2`) vs reframe why
  it matters (`STO:2`).
- *Escape Artist:* "A project you've poured months into is clearly failing. You…" →
  name that it's time to stop (`ESC:2`) vs push harder (`DIS:2`) vs grieve it and
  shift (`ALC:2`).

---

## Result copy (DRAFT) — falsifiable, behavioral, shadow-bearing

> Per research §4: differentiated (a wrong type should be rejectable), behavioral
> anchors, **includes the shadow** (favorability not equalized), no two-sided
> hedges, no authority/AI cosplay. Each ends with "try the adjacent one" (taker is
> the authority).

**Connector** — *You see the invisible threads between people before anyone names
them.* Your move is the right introduction at the right moment; your work is often
invisible precisely because it works. **Shadow:** you over-mediate, take
responsibility for everyone's bonds, and burn out absorbing feelings that aren't
yours. **At your best:** grounded enough to connect the *right* people, not
everyone. *Not quite you? Your secondary may be {secondary}.*

**Storyteller** — *You shape meaning; you can move people from rage to triumph and
grief to purpose.* You reframe the story people are trapped inside. **Shadow:** the
Manipulator who bends the truth for engagement — or the Lost Author who won't claim
a voice and lets others own the narrative. **At your best:** you reveal, you don't
control. *Not quite you? Try {secondary}.*

**Strategist** — *You see the whole board and the move three steps out.* You find
leverage and build the plan that holds. **Shadow:** analysis paralysis, gripping
too tight, treating people as chess pieces — or refusing to act until the plan is
"perfect." **At your best:** foresight in service of people, not control. *Not quite
you? Try {secondary}.*

**Disruptor** — *You feel the fire when something's broken and you're willing to
name it.* You make space by breaking what no longer works. **Shadow:** the Chaos
Bringer who burns everything (and every ally) — or the Caged Rebel, bitter and
waiting for permission. **At your best:** precise, not reckless; you clear the way
for something better. *Not quite you? Try {secondary}.*

**Alchemist** — *You don't just feel emotion — you move it.* You turn grief into
meaning and rage into momentum, in yourself and in a room. **Shadow:** Emotional
Overload (a sponge that cracks) — or the Detached Observer who analyzes feelings
from the shore. **At your best:** you swim — present without drowning. *Not quite
you? Try {secondary}.*

**Escape Artist** — *You see the cage before the walls close in, and you know
leaving can be a skill, not a failure.* **Shadow:** the Martyr who stays too long
out of guilt — or the Ghost who bolts at the first discomfort and never belongs
anywhere. **At your best:** you leave *well*, and help others see their own open
door. *Not quite you? Try {secondary}.*

**Coach** — *You help people remember their own power by helping them abandon the
level they've outgrown — and the story that keeps them there.* You're the softened
Disruptor: frustration at wasted potential, re-aimed from systems to a person's
excuse, converted into their Triumph. **Shadow:** the Taskmaster who drags instead
of calls up (and breeds dependence) — or the Empty Cheerleader who only affirms and
never delivers the honest nudge. **At your best:** you hand power back; they climb,
and they credit themselves. *Not quite you? Try {secondary}.* See
[coach-strategy-guide.md](./coach-strategy-guide.md).

### Result framing (shown with every result)
> "This is a **lens, not a verdict** — computed from 12 questions, a snapshot of a
> current pattern, not a fixed identity. **You're the authority on you.** Your
> top two are below with how close they are. Does the top one fit? If not, the
> second is right there. No type is better than another, and none of this labels,
> limits, or scores you." *(No email required to see this.)*
