# Lore BARs, Library, Wiki + Story World ↔ Mechanics

**Clarifications from design session:**

1. **Contributed lore** is stored in the wiki, but wiki pages are templated.
2. **LORE BARs** can be added to the **library** based on something the player learned about the world.
3. **Story world ↔ mechanics** — need to link the narrative to the game more.

---

## Architecture: Library vs Wiki

| Layer | What it is | Content |
|-------|------------|---------|
| **Wiki** | Templated pages (`/wiki/*`) | Static structure + sections. Campaign page, domains, moves, glossary. |
| **Library** | DocNode + DocEvidenceLink | Searchable knowledge base. DocNodes can be `nodeType: 'lore'`. BARs (CustomBar) link as evidence via DocEvidenceLink. |
| **LORE BAR** | CustomBar with `evidenceKind: 'lore'` | Player's learning from a quest. Structured by move (Wake Up, Clean Up, Grow Up, Show Up). |

**Flow:** Player completes quest → chooses "Add to lore?" → BAR to hand → "Contribute to library" → BAR becomes evidence for a DocNode (or spawns one). Wiki pages are **templated** — they may pull from DocNodes (e.g. "Campaign Story" section) or render a feed of lore entries. The template defines the slot; the library fills it.

---

## LORE BAR → Library

**"Something the player learned about the world"**

- **Library** = the knowledge base (DocNodes). LORE BARs are added there.
- **Add to library** = Create DocEvidenceLink (customBarId → docNodeId, kind: 'lore').
- **Target DocNode:** Either (a) existing lore node (e.g. "What we learned about urgency") that the BAR extends, or (b) new DocNode created from the BAR (e.g. player contributes → spawns draft DocNode).

**Proposed flow:**
1. Player creates LORE BAR from quest completion (structured template by move).
2. BAR goes to hand. Player edits/fills the template.
3. Player contributes from **hand** (click BAR → "Contribute to campaign lore") **or from the wiki** (viewing campaign lore, select BAR from hand → contribute).
4. System: Find or create DocNode for this context (e.g. `slug: campaign-bruised-banana-urgency`, `nodeType: lore`). Create DocEvidenceLink(BAR → DocNode, kind: 'lore').
5. DocNode body can be generated from BAR cluster (doc-assembly) or curated. Admin can promote to canonical.

**Template by move (what they learned):**
- Wake Up: "What did I see about the world?"
- Clean Up: "What did I clear? What did I learn?"
- Grow Up: "What skill did I develop? What does the world teach?"
- Show Up: "What did I complete? What does that say about the world?"

---

## Wiki: Templated Pages

Wiki pages are **templated** — structure is fixed, content can be dynamic.

**Current:** `/wiki/campaign/bruised-banana` is a static React component with hardcoded sections (Residency, Fundraiser, House).

**Possible evolution:**
- **Template slots:** e.g. `<CampaignStoryFeed instanceId="..." />` — pulls from DocNodes where `nodeType: 'lore'`, `scope: 'campaign'`, `tags` includes instance slug.
- **Campaign Story section:** "What we've learned" — list of lore DocNodes from the library, filtered by campaign/instance.
- **Stage-specific sections:** "Stage 1: Rally the Urgency — 3 entries" — lore entries tagged with kotter stage.

**Key:** Wiki = templated presentation. Library = content store. Wiki renders library content in defined slots.

---

## Story World ↔ Mechanics

**Gap:** The narrative (story world) and mechanics (quests, stages, vibeulons) feel separate. Need to link them.

### Mechanics → Story

| Mechanic | Story expression |
|----------|------------------|
| `instance.kotterStage` | "We're in Stage 2: Build the Coalition. Who will contribute?" |
| `instance.currentAmountCents` / `goalAmountCents` | "We're at 23% of our goal. $690 of $3000." |
| Quest completion | "3 urgency quests completed. The story grows." |
| Stage unlock by % | "Stage 2 unlocked at 15%. The coalition is forming." |
| Lore BARs contributed | "What we've learned: [feed of lore entries]" |

**Where:** Event page, campaign narrative, wiki campaign page, quest descriptions. Copy should reference current state (stage, %, lore count).

### Story → Mechanics

| Story element | Mechanic impact |
|---------------|----------------|
| Lore entries | Could inform quest prompts (e.g. "Building on what we learned: [X]") |
| Campaign narrative | Shapes quest descriptions, event page copy |
| "What we've learned" | Visible in Market or Event — "Others learned: [snippet]" to inspire quest creation |
| Archetype + stage | Visionaries can create Vision quests early — story allows parallel work |

**Where:** Quest templates could reference recent lore. Event page could show "Latest from the campaign" (lore entries). New players could see "What others have learned" before picking a quest.

### Concrete links to add

1. **Event page:** "Stage N: [Name]. We're at X% of our goal. [N] lore entries added so far." — mechanics visible in story.
2. **Wiki campaign page:** Dynamic "Campaign Story" section — pulls lore DocNodes from library. Templated slot, library content. **Contribute from wiki:** Player can contribute a BAR to campaign lore while viewing the wiki (e.g. "Add your learning" — select BAR from hand, contribute).
3. **Quest detail:** "Part of Rally the Urgency. [Link to campaign story / lore for this stage]."
4. **Market:** "Current stage: [Name]. [Snippet from recent lore]." — story enriches the mechanic.
5. **Completion flow:** "Add what you learned to the library?" — mechanic directly produces story.

---

## Open Questions

1. **Wiki template:** How do wiki pages pull from DocNodes today? Is there a `getCampaignLore(instanceId)` or similar? Or is this net-new?
2. **DocNode per what?** One DocNode per campaign stage? Per move? Per "campaign story" (aggregate)? How do we structure lore so the wiki can template it?
3. **Story world:** Is "story world" = the narrative copy (event, wiki, quest descriptions) or also the emergent lore (what players contribute)? Both?
4. **Hand → Library:** Does "Contribute to library" create a new DocNode or add to an existing one? (e.g. "Bruised Banana — Urgency learnings" = one DocNode with many evidence BARs)

---

## Summary

| Concept | Resolution |
|---------|------------|
| Contributed lore storage | Wiki (templated pages) + Library (DocNodes). Wiki = presentation; Library = content. |
| LORE BARs | Added to library. Based on "something learned about the world." Structured by move. |
| Story ↔ mechanics | Event, wiki, quests should reference stage, %, lore. Lore should feed back into quest prompts and campaign narrative. |
