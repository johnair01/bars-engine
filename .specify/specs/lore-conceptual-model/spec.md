# Spec: Lore and Documentation — Conceptual Model

## Purpose
Update FOUNDATIONS.md, ARCHITECTURE.md, and related docs so the conceptual model (WHO, WHAT, WHERE, Energy, Personal throughput) is canonical across the codebase. Agents and developers use the game's language when writing specs and code.

## Conceptual model (canonical)

| Dimension | Meaning | Examples |
|-----------|---------|----------|
| **WHO** | Identity | Nation, Archetype |
| **WHAT** | The work | Quests |
| **WHERE** | Context of work | Allyship domains (Gathering Resources, Direct Action, Raise Awareness, Skillful Organizing) |
| **Energy** | What makes things happen | Vibeulons |
| **Personal throughput** | How people get things done | 4 moves: Wake Up, Clean Up, Grow Up, Show Up |

**4 moves (personal throughput)**:
- **Wake Up** — See more of what's available (who, what, where, how)
- **Clean Up** — Get more emotional energy; unblock vibeulon-generating actions
- **Grow Up** — Increase skill capacity through developmental lines
- **Show Up** — Do the work of completing quests

## User stories

### P1: FOUNDATIONS.md reflects five dimensions
**As a developer**, I want FOUNDATIONS.md to document the five dimensions, so the ontology is clear and canonical.

**Acceptance**: FOUNDATIONS.md has "The Five Dimensions" section: WHO, WHAT, WHERE, Energy, Personal throughput. Moves are described as personal throughput, not allyship domains.

### P2: ARCHITECTURE.md maps model to schema
**As a developer**, I want ARCHITECTURE.md to map the conceptual model to schema, so implementation stays aligned.

**Acceptance**: ARCHITECTURE.md has "Conceptual Model" section. Documents allyship domains as WHERE, moveType as personal throughput, allyshipDomain (when implemented).

### P3: terminology.md has canonical tables
**As an agent**, I want terminology.md to have tables for the 4 moves and allyship domains, so I use consistent language.

**Acceptance**: terminology.md has "The 4 Moves (Personal Throughput)" table and "Allyship Domains (WHERE)" table.

### P4: narrative-mechanics.md move definitions
**As a content creator**, I want narrative-mechanics.md to define the 4 moves correctly, so quest and story content aligns.

**Acceptance**: Lifecycle Triggers / 4 moves: Wake Up = see more, Clean Up = emotional energy/unblocking, Grow Up = skill capacity, Show Up = completing quests. Allyship domains as campaign context.

### P5: README and handbook reference
**As a newcomer**, I want README and handbook to reference the conceptual model, so I understand the game's structure.

**Acceptance**: README Key Concepts mentions WHO, WHAT, WHERE, Energy, moves. Handbook README has brief conceptual model reference.

### P6: Framework influences documented
**As a developer or wiki reader**, I want the frameworks that inform the app's design to be documented, so I understand the theoretical foundations and can reference them when generating content or building wikis.

**Acceptance**: A "Framework Influences" section exists (in FOUNDATIONS.md or docs/framework-influences.md) with a table: Framework, Author(s), Influence on the app. Includes: Integral Theory (Ken Wilber), Octalysis Framework (Yu-Kai Chou), I Ching interpretation (Carol K. Anthony, Hannah Moog), Mastering the Game of Life (Wendell Britt), Mastering the Game of Allyship (Wendell Britt).

## Functional requirements

- **FR1**: FOUNDATIONS.md MUST include "The Five Dimensions" section.
- **FR2**: ARCHITECTURE.md MUST include "Conceptual Model" section mapping to schema.
- **FR3**: terminology.md MUST include 4 moves and allyship domains tables.
- **FR4**: narrative-mechanics.md MUST update move definitions to match personal throughput.
- **FR5**: README MUST update Key Concepts. Handbook README MUST add conceptual model reference.
- **FR6**: player_archetypes.md (if applicable) MUST align move descriptions.
- **FR7**: Framework influences MUST be documented in a table (Framework, Author(s), Influence). Location: FOUNDATIONS.md section or docs/framework-influences.md linked from FOUNDATIONS.

## Files to update

| File | Changes |
|------|---------|
| FOUNDATIONS.md | Add five dimensions; add Framework Influences section or link to docs/framework-influences.md |
| docs/framework-influences.md | (Optional) New file with framework table; link from FOUNDATIONS |
| ARCHITECTURE.md | Add conceptual model, allyship domains |
| content/narrative-mechanics.md | Update move definitions |
| .agent/context/terminology.md | Add moves and allyship domains tables |
| README.md | Update Key Concepts |
| docs/handbook/README.md | Add conceptual model reference |
| .agent/context/player_archetypes.md | Align move descriptions |

## Reference

- Cursor plan: Lore and Documentation Update section
- Spec Kit Translator: [.agents/skills/spec-kit-translator/SKILL.md](.agents/skills/spec-kit-translator/SKILL.md)
