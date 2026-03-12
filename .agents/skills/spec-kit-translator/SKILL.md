# Skill: Spec Kit Translator

A powerful bridge between "Vibe-Driven" natural language and "Spec-Driven" Engineering. Use this skill to translate user objectives and feature requests into high-fidelity Spec Kit compatible prompts and implementation plans.

## Purpose
Users often express complex requirements in relative, narrative, or abstract terms. The Spec Kit Translator formalizes these into:
1. **Specs**: Rules, mechanics, and acceptance criteria.
2. **Plans**: Architectural strategy and file impacts.
3. **Tasks**: Step-by-step implementation phases with bash commands and verification markers.

## Conceptual Model (Game Language)

Use this language when drafting specs and plans. It is the canonical ontology for the engine:

| Dimension | Meaning | Schema / Examples |
|-----------|---------|-------------------|
| **WHO** | Identity | Nation, Archetype (Playbook) |
| **WHAT** | The work | Quests (CustomBar) |
| **WHERE** | Context of work | Allyship domains: Gathering Resources, Direct Action, Raise Awareness, Skillful Organizing |
| **Energy** | What makes things happen | Vibeulons |
| **Personal throughput** | How people get things done | 4 moves: Wake Up, Clean Up, Grow Up, Show Up |

**4 moves (personal throughput)** — distinct from allyship domains:
- **Wake Up** — See more of what's available (who, what, where, how)
- **Clean Up** — Get more emotional energy; unblock vibeulon-generating actions
- **Grow Up** — Increase skill capacity through developmental lines
- **Show Up** — Do the work of completing quests

**Allyship domains** = WHERE the work happens. **Moves** = how the player gets it done. A quest in "Direct Action" (WHERE) might require Show Up (move); a quest in "Raise Awareness" might benefit from Wake Up.

When writing specs: tag quests with WHO (allowedNations, allowedTrigrams), WHAT (quest content), WHERE (allyshipDomain), and optionally which move (moveType) helps players complete it.

**Canonical reference**: [.specify/memory/conceptual-model.md](.specify/memory/conceptual-model.md)

## Protocol: The Interview
When a user provides a high-level request, follow this interaction protocol:
1. **Clarify Objects**: Ask what new models or fields are implied.
2. **Clarify Surface Area**: Ask what UI points are affected.
3. **Clarify Governance**: Ask how admins or systems control this feature.
4. **Draft the Spec**: Compile these into a `.specify/specs/` structure.

## Verification Quests (UX Features) — Required

When implementing a feature with **UX implications** (user-facing flows, pages, or components), a **verification quest is required** — not optional. Verification quests that affect UI must be implemented as part of the feature.

Verification quests:

1. **Validate the feature** — Step-by-step Twine story that walks a tester through the UX (each passage = one verification step; final passage has no link so completing the quest mints the reward).
2. **Advance the Bruised Banana Fundraiser** — Frame the narrative toward the fundraiser goal: preparing the party, improving the Bars Engine, or contributing to the residency. Examples:
   - "Verify the onboarding flow so guests can start quests at the party."
   - "Validate the campaign editor so we can tweak copy before the residency launch."
   - "Confirm the instance/fundraiser UI so admins can track progress."
3. **Structure** — TwineStory + CustomBar with `isSystem: true`, `visibility: 'public'`, deterministic id (e.g. `cert-<feature>-v1`), idempotent seed script.
4. **Reference** — Follow [.specify/specs/cyoa-certification-quests/](.specify/specs/cyoa-certification-quests/) and [scripts/seed-cyoa-certification-quests.ts](scripts/seed-cyoa-certification-quests.ts).

### Checklist for UX features (all required)
- [ ] Spec includes a "Verification quest" user story or FR.
- [ ] Plan includes: Twine passages (steps), seed script, npm script (e.g. `seed:cert:<feature>`).
- [ ] Quest narrative ties to Bruised Banana Fundraiser where relevant (party prep, engine improvement, residency support).
- [ ] Verification quest is implemented — do not mark a UI feature complete without its verification quest.

## Prompt Template: Natural Language to Spec
When generating a Spec Kit prompt for the agent itself, use this structure:
```markdown
# Spec Kit Prompt: [Feature Name]

## Role
You are a Spec Kit agent responsible for [Objective].

## Objective
[High-level summary of what to build and why.]

## Requirements
- **Surfaces**: [List of pages/components]
- **Mechanics**: [How it works]
- **Persistence**: [Database changes]
- **Verification**: [How to prove it works]

## Deliverables
- [ ] .specify/specs/[name]/spec.md
- [ ] .specify/specs/[name]/plan.md
- [ ] .specify/specs/[name]/tasks.md
```

## Example Translations
| User Says | Spec Kit Prompt Translates to... |
| :--- | :--- |
| "I want to move Vibeulons to instances" | "Implement an Attunement system with InstanceParticipation models and LedgerService atomic moves." |
| "We lost quest filtering!" | "Restore search-based and stage-pill filtering logic in Market page using client-side state." |
| "Add in-app CYOA editing" | "Implement passage edit + campaign DB preference; add verification quest 'cert-cyoa-editing-v1' that walks through editing a node and confirming it on /campaign — framed as preparing the party narrative for the Bruised Banana Fundraiser." |
| "Donation link for the residency" | "Surface /event from landing and campaign; configure Instance with Stripe URL; add vibeulon mint on donation (Energy flows when players support the cause)." |
| "Let players choose their campaign area" | "Add allyshipDomain (WHERE) to CustomBar, campaignDomainPreference to Player; multi-select + opt-out UX; persistent 'Update campaign path' on Market; filter Market by preference when set." |
| "Update lore to match the game" | "Add five dimensions (WHO, WHAT, WHERE, Energy, Personal throughput) to FOUNDATIONS.md and ARCHITECTURE.md; update narrative-mechanics.md move definitions; add terminology tables." |

## Spec Kit ↔ Cursor Plan (Operational Discipline)

**Spec Kit is the implementation authority.** Cursor plan and BACKLOG are strategic layers that select which spec to implement next.

- **Implementation rule:** Always implement from a Spec Kit spec → plan → tasks. Never implement from Cursor plan or backlog item alone.
- **Cursor plan:** Strategic overlay; can be larger than Spec Kit backlog. Points to specs. If it lists an item not yet spec'd, create the spec first, then implement.
- **BACKLOG.md:** Ledger of Spec Kit items; status, dependencies, campaign alignment. Synced via backlog API (DB + REST). See [Backlog Sync](#backlog-sync) below.
- **Spec Kit specs:** `.specify/specs/` — bruised-banana-*, lore-conceptual-model, etc. Use game language (WHO, WHAT, WHERE, Energy, moves) in all specs.

## Backlog Sync

When adding or editing backlog entries in BACKLOG.md:

1. **After editing BACKLOG.md**: Run `npm run backlog:seed` to push changes to the database.
2. **To refresh BACKLOG.md from DB**: Run `npm run backlog:regen`.
3. **When switching machines** (or before reading backlog): Run `npm run backlog:fetch -- --write-md` to fetch from API and update BACKLOG.md for file-reading agents.

## Build / Infra Blocker Protocol

**When build errors or infra blockers pop up during implementation** (e.g. "module not found", "Cannot find module pdf-child.js", bundling failures, package incompatibility with Next.js):

1. **Create a spec kit immediately** — do not leave the error unresolved.
2. **Add to backlog for immediate resolution** — Priority 0 (Urgent), mark as emergent.
3. **Artifacts**: `.specify/specs/[kebab-name]/spec.md`, `plan.md`, `tasks.md`, `.specify/backlog/prompts/[kebab-name].md`
4. **Backlog entry**: Assign next ID; link to spec; dependencies = blocked feature (e.g. AZ for Book-to-Quest).
5. **Sync**: Run `npm run backlog:seed` to push the new entry to the database.

Example: pdf-parse-new build failure → [pdf-parse-new-build-fix](.specify/specs/pdf-parse-new-build-fix/spec.md).

## Usage
1. Read the user's natural language request.
2. If ambiguous, initiate the **Interview Protocol**.
3. Generate the **Spec Kit Prompt** as an artifact or code block.
4. (Optional) Run `specify` CLI using the generated prompt.
5. **If a build/infra error blocks progress**: Execute the Build/Infra Blocker Protocol above.
