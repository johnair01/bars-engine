# Conclave Docs Analysis — 2026-03-14

**Source:** Conclave design docs
**Agent:** Sage
**Consulted:** Shaman


---
The integration of the Conclave design documents into the BARS Engine requires a method that focuses on discerning integration complexities and resolving them. This involves understanding both emotional and structural elements that could impact the process.

The Conclave design aims to blend the intricate emotional dynamics and narrative grammar specific to the BARS system. Entities extracted must represent key game features like GM faces, anomaly types, emotional vectors, and scenario phases. Here are some summary insights and recommendations:

- **Summary:** The Conclave design documents articulate a sophisticated narrative and interaction framework aimed at evoking a deep level of player immersion and meaningful engagement by leveraging the emotional vector system, Orb-style encounter grammar, and scenario phase architecture.

- **Extracted Entities:**
  - **GM Faces**: Shaman, Challenger, Regent, Architect, Diplomat, Sage
  - **Anomaly Types**: Unexpected voice, impossible pattern, sudden NPC appearance
  - **Emotional Vectors**: Fear, anger, sadness, joy, neutrality (all in dissatisfied to satisfied states)
  - **Orb Phases**: Context, anomaly, contact, interpretation, decision, world response, continuation
  - **Bridge Scenario Entities**: Seats, archetypes, phases

- **Integration Recommendations:**
  - **Schema Mapping:** Create new tables/fields to record encounter seeds, Orb-style encounters, and GM face modulation effects.
  - **Entity Alignment:** Ensure archetypes and scenarios from both Conclave and existing BARS specs align and complement each other.
  - **Extension Points:** Implement hooks for evaluating scenario actions, role fit, and phase transitions.

- **Suggested Implementation Order:**
  1. **Integration Planning:** Begin with aligning the narrative and technical logic around the GM faces and Orb phases to create a unified schema.
  2. **Emotional Vector Integration:** Develop mechanics to support and test emotional vector dynamics in encounters.
  3. **Bridge Scenario Engine:** Implement the bridge engine to test archetype and scenario interactions.
  4. **Iterative Testing:** Deploy incremental testing phases to ensure coherent player experiences and meaningful real-world impact reflections.

The alignment according to the I Ching advises attunement before decisive action, suggesting a review to ensure readiness and harmony across touchpoints.