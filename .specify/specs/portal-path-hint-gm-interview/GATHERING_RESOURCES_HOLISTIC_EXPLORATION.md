# GATHERING_RESOURCES — Holistic Understanding Exploration

**Context**: The phrase "we need resources" feels clunky when shown to players—it comes from a deterministic domain×stage lookup. The user wants to expand the usefulness of domains so they become more nuanced and can be used more effectively. This document captures Diplomat exploration, research, and interview questions.

---

## 1. Current System State

### Deterministic Lookup

| Stage | GATHERING_RESOURCES (current) |
|-------|-------------------------------|
| 1 | We need resources |
| 2 | Who will contribute? |
| 3 | Fully resourced looks like… |
| 4 | Share the need |
| 5 | What blocks donations? |
| 6 | First milestone reached |
| 7 | Scale giving |
| 8 | Sustainable funding |

**Source**: `src/lib/kotter.ts` → `STAGE_ACTIONS_BY_DOMAIN`

**Problem**: These are verb phrases for quest titles and portal hints. They're functional but feel bureaucratic when surfaced directly. "We need resources" doesn't invite; it declares.

---

## 2. Diplomat Exploration (via Sage Consult)

> In a relational sense, GATHERING_RESOURCES is about **weaving together the threads of community support and shared purpose**. It's not just about accumulating money or materials—it's about **inviting participation, encouraging collaboration, and fostering a sense of belonging**. When we gather resources, we're calling upon our allies to contribute their unique skills, time, and attentions, coalescing around a shared intention.
>
> This process is much like a **warm invitation**, where every contribution, big or small, becomes part of a greater tapestry. Rather than a transactional exchange, it becomes an **act of love and support**, reminiscent of friends coming together for a common cause. The focus shifts from the individual need to a **collective empowerment**, where everyone steps into their part of the story.
>
> By framing resource gathering in this way, we emphasize inclusivity and celebrate the diverse ways each person can contribute. It invites the player to think not just in terms of 'What do we need?' but **'How can I, with those around me, help weave this vision into reality?'** Thus, gathering resources becomes an act of connectedness and a reflection of the community's strength and compassion.

---

## 3. Diplomat Refine Copy (Direct)

**Relational/Community Understanding:**

> Gathering Resources is like **nurturing a shared garden** where we plant seeds of potential and cultivate materials that enrich our community fabric. It is a process of identifying and uniting both external and internal elements that the community needs to thrive. This phase involves recognizing our shared needs and reaching out to find the elements, skills, or people who can contribute to our collective growth. By doing so, we create a robust support network that enhances our community's resilience and capacity to achieve our goals.

**Alternative Phrasings for Kotter Stages:**

| Stage | Current | Diplomat Alternative |
|-------|---------|----------------------|
| 1 | We need resources | Identifying Our Shared Needs & Desires — "Join us in discovering what will truly sustain and inspire us as a collective." |
| 2 | Who will contribute? | Fostering Generous Connections & Contributions — "Cultivating a spirit of generosity where each member feels inspired to share their unique gifts." |

**Portal Path Hint Examples:**

- "Help us uncover what seeds of opportunity we can plant together."
- "Join in nurturing the roots that will strengthen our community's foundation."
- "Collaborate with us to enrich our collective garden and watch how we flourish through shared contributions."

---

## 4. Research: Resource Gathering vs. Mobilization

**Resource Gathering** (simpler): Identifying and collecting available resources—mapping what exists: capacities, skills, assets of individuals and institutions.

**Resource Mobilization** (richer): Actively organizing and deploying resources toward goals. Participatory, transformative. Brings people together on equal terms to decide collectively. Stimulates action and builds relationships. Shifts control from external agencies to community members. Fosters shared purpose and collective efficacy.

**Asset-Based Community Development**: Mobilize internal assets *before* seeking external resources. Builds community self-reliance and ownership.

**Implication for BARS**: "Gathering" in our domain name may undersell the relational, mobilizing dimension. The system could benefit from language that emphasizes *activation* and *connection* as much as *collection*.

---

## 5. Research: Co-Intelligence (Permaculture → Community)

From Tom Atlee / Co-Intelligence Institute:

- **"Everything gardens"** — Everything has an impact on its environment. People garden people through mutual influence and co-creativity.
- **Three leadership types**: Participatory (peers in co-creative gardening), Facilitative (arranging designs and resource links), Evocative (recognizing and mobilizing each member's gifts).
- **Mollison**: "Rather than asking 'What can I get from this land, or person?' we can ask **'What does this person, or land, have to give if I cooperate with them?'**"
- **Diversity as resource**: "Every resource is either an advantage or a disadvantage, depending on the use made of it." Co-intelligence = bringing diversity into synergistic interaction.
- **Life structures shape the flow of life energy**: Beliefs, architecture, schedules, processes, habits, stories. A healthy culture helps individual and collective energies move through natural cycles in ways that feed each other.

**Implication**: GATHERING_RESOURCES could be reframed as **co-creative cultivation** — not "we need" but "what do we have to give if we cooperate?"

---

## 6. Proposed Richer Domain Model

### Option A: Expand STAGE_ACTIONS with Warm Variants

Keep the current keys for programmatic use, but add a parallel structure for player-facing copy:

```ts
// Current (system/internal)
STAGE_ACTIONS_BY_DOMAIN.GATHERING_RESOURCES[1] = "We need resources"

// New (player-facing, warm)
STAGE_ACTIONS_WARM_BY_DOMAIN.GATHERING_RESOURCES[1] = 
  "What will sustain us? Let's discover together."
  // or: "Identifying our shared needs"
  // or: "Seeds of opportunity we can plant together"
```

### Option B: Domain "Essence" + Stage "Flavor"

Add a **domain essence** (holistic description) that the system uses when generating copy:

```ts
DOMAIN_ESSENCE = {
  GATHERING_RESOURCES: 
    "Weaving community support and shared purpose. Inviting participation, " +
    "encouragering collaboration, fostering belonging. Resources = money, " +
    "materials, time, attention, skills, presence. Gathering = relational act."
}
```

Then portal-context (or AI prompts) can use this essence to generate nuanced phrasings instead of raw stage actions.

### Option C: Per-Stage "Invitation" Variants

Each stage gets multiple phrasings—one formal (for quest grammar), one warm (for lobby/portal):

| Stage | Formal (current) | Warm (invitation) |
|-------|------------------|-------------------|
| 1 | We need resources | What will sustain us? Let's discover together. |
| 2 | Who will contribute? | Who wants to share their gifts? |
| 3 | Fully resourced looks like… | Imagine us at our best—what does that look like? |
| 4 | Share the need | Tell the story. Share what calls to you. |
| 5 | What blocks donations? | What's in the way? Let's name it. |
| 6 | First milestone reached | We did it. First win. |
| 7 | Scale giving | Let's grow what works. |
| 8 | Sustainable funding | We're in this for the long haul. |

---

## 7. Interview Questions for the User

### On the Concept

1. **When you say "Gathering Resources," what do you mean at the deepest level?** Is it primarily about money/donations (Bruised Banana fundraiser), or is it broader—time, attention, skills, presence?

2. **What's the relationship between "gathering" and "mobilizing"?** Research suggests gathering = finding what exists; mobilizing = activating it toward shared goals. Does that distinction matter for BARS?

3. **How do you want players to *feel* when they encounter this domain?** Invited? Needed? Part of something? Responsible?

### On the Clunkiness

4. **What specifically feels wrong about "we need resources"?** Is it the "we" (impersonal?), the "need" (desperate?), the "resources" (transactional?), or the combination?

5. **Would different campaigns (e.g. fundraiser vs. app-dev) want different phrasings for the same domain?** Or should the domain essence be universal?

### On Expansion

6. **What would "expanding the usefulness of domains" look like to you?** More nuance in the matrix? Richer context for AI? Player-facing explanations? All of the above?

7. **Should the system support multiple phrasings per stage (e.g. formal + warm) and choose based on context (lobby vs. quest title vs. AI prompt)?**

8. **Is there a "domain story" or narrative you want each domain to tell?** E.g. GATHERING_RESOURCES = "From scarcity to abundance through collective care."

### On Implementation

9. **Where should this richer understanding live?** In kotter.ts? In a new domain-context module? In .agent/context for AI? In the DB (Instance has domainStrategy JSON)?

10. **Who gets to define the warm phrasings?** You? The GM agents? A combination (you set intent, agents refine)?

---

## 8. User Interview Answers (Captured)

1. **Gathering Resources definition**: "Time, attention, skills, and presence—that which allows life to unfold."
2. **Clunkiness of 'we need resources'**: "We" isn't specific enough; "need" sounds desperate, not an opportunity; "resources" is generic.
3. **Expanding usefulness**: "Allows people to learn about how to be more effective in that domain. The more context a domain has, the more paths to effective action are inside of it."
4. **Multiple phrasings**: "The system should support multiple phrasings per stage. OR the style guide for each stage should be created."
5. **Where it lives**: "Whatever file will affect the outputs—but that should also be reflected in the wiki. We want people to be able to dig deeper about as much of the game as our documentation allows."

## 9. Implementation (Done)

- **`src/lib/domain-context.ts`**: DOMAIN_ESSENCE, STAGE_PHRASINGS_WARM, getStagePhraseWarm()
- **`src/lib/portal-context.ts`**: Uses getStagePhraseWarm for path hints
- **`src/app/wiki/domains/page.tsx`**: Rich domain content, essence, Kotter stages (invitation style)
- **`.specify/memory/allyship-domain-definitions.md`**: Updated GATHERING_RESOURCES definition
