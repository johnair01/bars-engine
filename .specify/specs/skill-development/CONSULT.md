# Skill Development + Attribute System
**Date**: 2026-03-20
**Source**: `npx tsx scripts/strand-consult-skill-development.ts`

---

## The Design Problem

BARs Engine needs an attribute + skill system that is:
- **A character sheet** — tells the story of who this player is becoming
- **A growth record** — every score reflects demonstrated behavior, not preferences
- **A gameplay mechanic** — attributes and skills create real differences in play

### Constraints
- No dice — scores (0–5), not die types
- Everyone starts at 0 — attributes emerge from play
- Skills are archetype-specific — your archetype determines your skill tree
- Skills unlock when demonstrated via completed quest (proof-of-work)
- GM faces are level gates in Integral altitude order:
  Shaman → Challenger → Regent → Architect → Diplomat → Sage
- Shadow boxing: boss NPC encounters deepen the relationship with the archetype's shadow;
  the integrated shadow becomes the skill

### Reference
Kids on Bikes: Brawn / Charm / Fight / Flight / Brains / Grit — die-typed attributes.
We want the same legibility and character-sheet feel, without dice.

---

## Shaman — The Felt Sense of an Attribute

```json
{
  "current_element": null,
  "emotional_channel": null,
  "satisfaction_state": null,
  "narrative_lock": null,
  "shadow_belief": null,
  "recommended_move_type": null,
  "wave_stage": null,
  "guidance": "**1. The Felt Sense of Going from 0 to 1:**\nWhen a character crosses from knowing nothing—where the attribute rests at zero—to touching the edge of something new, there's a sensation of awakening in the body. It’s like the first flicker of a flame, a curious stirring in the belly that raises awareness to possibilities previously unseen. Imagine standing at the cusp of dawn; the air is charged with potentials not yet breathed in. This shift from 0 to 1 is the somatic realization of capability, the recognition that one has begun to grasp the texture of the attribute, like touching a thread in the web of their own existence.\n\n**2. Proposed Attributes:**\n- **Presence:** The felt sense of harmony in one's being and field of influence, like the anchored stillness in the eye of a storm.\n- **Edge:** The thrill of pushing boundaries with grace, akin to the sharp clarity of a mountain air.\n- **Resilience:** The enduring strength found in the softness of yielding yet unyielding, like a reed in a tempest.\n- **Flow:** The capacity to navigate life's currents effortlessly, reminiscent of the serene energy of a river's continuous path.\n- **Vitality:** The aliveness that courses through, akin to the sun rising within every cell.\n- **Insight:** The clarity of understanding that unfurls like the petals of a nocturnal bloom revealing truths in darkness.\n\n**3. Shadow Boxing's Connection to Attribute Development:**\nEncountering one's archetype boss during a shadow boxing challenge serves as a crucible for transformative growth. It typically enhances an attribute relevant to the archetype and aligns with the GM face managing the encounter. For example:\n- Shaman guides may amplify **Insight** through profound introspection.\n- Challengers may bolster **Edge** by pushing through adversity.\n- Regents may fortify **Presence** by fostering leadership.\n- Architects may cultivate **Flow** by harmonizing complexities.\n- Diplomats may enhance **Resilience** through empathetic connection.\n- Sages potentially deepen **Vitality**, tapping into the core warmth of internal wisdom.\n\n**4. Somatic Signature of Being Maxed Out (Score of 5):**\nTo carry a 5 in any attribute is to embody that essence fully. For instance, a 5 in Presence feels like a potent gravitational field; people are naturally drawn into mutual understanding and attention. A 5 in Edge feels like standing at the very crest of a wave—everything is vibrant, immediate, and possible. Each attribute, at its peak, envelops the being in its purity, almost transcending the body's limits, whispering of the unity between the inner and outer cosmos. It's the tranquility in acceptance of one's power, as every sinew harmonizes with purpose and flow."
}
```

---

## Regent — Canonical Attributes + Unlock Governance

```json
{
  "instance_id": null,
  "current_kotter_stage": 2,
  "active_domains": [
    "Gathering Resources",
    "Skillful Organizing"
  ],
  "thread_status": [
    {
      "thread_id": "gm-face-alignment",
      "title": "GM Face Alignment",
      "status": "in_progress",
      "quest_count": 2
    },
    {
      "thread_id": "boss-npc-integration",
      "title": "Boss NPC Integration",
      "status": "not_started",
      "quest_count": 0
    }
  ],
  "recommended_actions": [
    "Initiate resource gathering for NPC development tools.",
    "Coordinate skill unlocking protocols with quest completion metrics.",
    "Define explicit governance rules for cross-archetype learning abilities."
  ],
  "readiness_for_next_stage": 0.4,
  "reasoning": "Campaign progress requires further development of necessary resources and clearer communication of the skill unlocking mechanism. An increase in quest activity is needed to smoothly transition to the next stage."
}
```

---

## Architect — Data Model + Player Profile Page

```json
{
  "title": "Architect: Data Model + Player Profile Page - New System",
  "description": "Design and implement a data model for player attributes and archetype-specific skills in a Next.js 14+ / Prisma / PostgreSQL stack.",
  "quest_type": "communal",
  "grammar": "kotter",
  "move_type": "wake_up",
  "emotional_alchemy_tag": "joy",
  "kotter_stage": 1,
  "nation": "Argyra",
  "archetype": "Heaven",
  "allyship_domain": "gathering_resources",
  "completion_conditions": [
    "Define Prisma schema additions for PlayerAttribute, Skill, and PlayerSkill models.",
    "Map trigger points for attribute increases in the existing codebase.",
    "Sketch the data shape for a player character sheet for the player profile page.",
    "Propose a flat list format for skill tree display without a graphical node editor."
  ],
  "vibulon_reward": 5,
  "confidence": 0.9,
  "reasoning": "The design of a robust attribute and skill system requires the careful integration of new models into the existing data structure while maintaining query efficiency and codebase consistency. By utilizing the Kotter grammar, the focus is on the communal effort needed to implement a complex system that enhances player experiences across the board. The wake_up move aligns with initiating the design and implementation process with clarity and foresight, ensuring that the solution is well-engineered and aesthetically pleasing."
}
```

---

## Sage Synthesis — The Governing Principle

Upon synthesizing insights from the Shaman, Regent, and Architect, here are the synthesized responses to your questions:

1. **Canonical Attributes**:
   - **Presence**: The harmony in one's being and field of influence.
   - **Edge**: The drive to push boundaries with precision and focus.
   - **Resilience**: The strength in adapting and enduring challenges.
   - **Flow**: The ability to navigate complexities with ease and fluidity.
   - **Vitality**: The lifeforce and energy that ignites action.
   - **Insight**: The clarity of understanding and depth of perception.

2. **Governing Principle**:
   The principle is "Co-Creative Reflection," signifying progress that results from meaningful contributions and reflections of personal and collective narratives, ensuring development feels earned as it derives from authentic experiences and shared growth.

3. **Shadow Boxing Mappings**:
   - **Nation Bosses**: Reflect the cultural or societal attributes, enhancing Presence or Resilience.
   - **Archetype Bosses**: Mirror personal developmental paths, advancing Edge, Flow, Insight, or Vitality, depending on the archetype's nature.

4. **Player Page Description**:
   The player's page embodies an aesthetic of a dynamic tapestry. Layout-wise, profile attributes and skills are portrayed as living elements within a 'Garden of Growth' theme. The character sheet highlights the harmonic interplay between attributes, beautifully blending visual storytelling with integral ontology, echoing both inner and outer worlds from character milestones to shadow work breakthroughs.

5. **System Safeguard**:
   Protect against "Illusory Advancement," where apparent progress shadows genuine growth. Ensure transparency and depth in every advancement mechanism to maintain integrity.

*Consulted agents: Shaman, Regent, Architect*

---

## Design Doctrine (extracted + synthesized)

### Governing Principle
> Attributes reflect demonstrated behavior — you have what you've done, not what you've chosen.
> (Sage called this "Co-Creative Reflection." The simpler frame: proof-of-work, not preference.)

### The 6 Canonical Attributes

Two dimensions of development — **horizontal** (player-driven, any time) and **vertical** (story-gated, face altitude).

**Horizontal — attributes develop freely through play:**

| Attribute | KoB Analog | Face Affinity (soft) | Felt-sense |
|-----------|-----------|---------------------|------------|
| **Vitality** | Brawn | Shaman (Magenta) | The lifeforce and energy that ignites action — somatic aliveness |
| **Edge** | Fight | Challenger (Red) | The drive to push boundaries and hold friction without flinching |
| **Presence** | Charm | Regent (Amber) | The weight and authority of your field — people feel you before you speak |
| **Flow** | Flight | Architect (Orange) | Navigating complexity with design-sense — knowing which way to move |
| **Harmony** | Grit | Diplomat (Green) | Holding competing forces in relationship — bridge-building as strength |
| **Insight** | Brains | Sage (Teal) | Clarity of understanding across levels — seeing the pattern beneath the pattern |

Face affinity is **soft** — Vitality is Shaman's home attribute, but a player can develop Vitality at any altitude through any demonstrated quest. The affinity is lore and aesthetic, not a gate.

**Vertical — face altitude gates skill tiers:**

| Face | Altitude | Skill tier unlocked |
|------|----------|-------------------|
| Shaman | Magenta | Tier 1 |
| Challenger | Red | Tier 2 |
| Regent | Amber | Tier 3 |
| Architect | Orange | Tier 4 |
| Diplomat | Green | Tier 5 |
| Sage | Teal | Tier 6 (mastery) |

**A skill unlocks when both conditions are met:**
```
attribute_score >= threshold   ← horizontal (player earned this through quests)
AND
face_altitude >= skill_tier    ← vertical (story brought this)
```

Players can build attribute scores ahead of their altitude — the score waits, the story delivers the key.

### Shadow Boxing → What It Advances
- **Archetype Boss** encounter metabolized → advances the face's affinity attribute (Shaman-run encounter → Vitality, Regent-run → Presence, etc.)
- **Nation Boss** encounter metabolized → advances **Presence** (who you are in community) or **Harmony** (holding the nation's shadow in relationship)
- Face altitude itself advances through boss encounters + story milestones — not through quest volume

### Skill Unlock Rule
- Skills are archetype-specific (your archetype determines your skill tree)
- Unlock triggers when: quest completed with matching `moveType` or `alignedAction` AND face altitude ≥ skill tier
- No dice. No cooldown. The system must know *what kind* of demonstration happened — quest volume alone doesn't unlock anything.

### Cross-Archetype Learning
Late-game or second-character content only. Unlocked via campaign event or specific NPC offering (Regent-approved). Not in base play.

### The One Thing to Protect Against
> The mechanic that, if it went wrong, would turn growth into performance of growth.
> Safeguard: attribute score alone never unlocks a skill. It takes demonstrated quest type AND story altitude. You cannot grind your way to mastery.

## Immediate Action Items

- [ ] Write Prisma schema: `PlayerAttribute`, `Skill` (registry), `PlayerSkill`
- [ ] Define `Skill` registry entries: one per archetype × face × tier (8 archetypes × 6 faces × 3 tiers = 144 skills max; start with Bold Heart + one nation as proof)
- [ ] Add attribute increment trigger to `createQuestFrom321Metadata` and quest completion actions
- [ ] Design player profile page: attributes as scores + skill list grouped by face level
- [ ] Write spec: `.specify/specs/skill-development/spec.md`
