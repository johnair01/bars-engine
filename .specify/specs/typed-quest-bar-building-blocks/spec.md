# Spec: Typed Quest (BAR) — Building Blocks & Quality

## Purpose

Define a **well-typed, extensible quest model** where:

- A **Quest is a BAR** — same substrate as other BARs, but **specialized for work that completes**.
- **Work is composable** — placement, unblock, fork, and merge use **explicit types**, not only `parentId`.
- **Higher quality** quests are **more riffable** — templates, clear acceptance criteria, and governance so collaboration scales without junk.

**Research:** See [RESEARCH.md](./RESEARCH.md) (Trello, Asana, Wekan, Kanboard, Planka, Focalboard).

**Practice:** Deftness Development — spec kit first; degrade gracefully without LLMs.

---

## Problem

- Today, `CustomBar` + `parentId` / `status: blocked` / `isKeyUnblocker` cover **partial** nesting and Tetris-style unblock.
- **Placement rules** (“only if unblocks parent”, vault → unblock, race / fork / merge) need a **clear type system** and optional **versioning**.
- **Quality** is not a single flag: it is **structure + clarity + scope + governance** (see research synthesis).

---

## Design Principles

| Principle | Implication |
|-----------|-------------|
| **Thin identity, fat typed extensions** | Stable `questId` + `revision` or immutable snapshot for “what was agreed.” |
| **Container-scoped definitions** | Campaign / board / instance owns **field definitions** (rubric) and **templates** — Trello/Asana pattern. |
| **Edges are typed** | `parentId` alone is insufficient; **unblock**, `fork_of`, `merged_into`, `dependency` are distinct relations. |
| **Namespace metadata** | Any JSON bag uses `bars.*` or plugin prefixes — Kanboard lesson. |
| **Progressive disclosure** | Low-quality drafts stay private; **cleared** quests surface for collaboration. |

---

## Conceptual Model (target)

```
Quest (BAR subtype)
  ├── identity: id, lineage (rootId, fork_of?, merged_into?)
  ├── revision: content snapshot (title, description, inputs schema, acceptance)
  ├── work graph edges: typed links to other quests / BARs
  ├── quality signals: tier, rubric fields, template id, steward approval
  └── placement: where this revision may attach (campaign, parent quest, slot)
```

**BAR vs Quest:** Every Quest **is** a `CustomBar` with `type === 'quest'` (or equivalent); **Quest-specific** data may live in normalized tables or validated JSON columns — **decision in plan.md Phase 0**.

---

## Quality Attributes (v1 rubric)

Inspired by research (structure + templates + governance), not a single score:

| Attribute | Description | Enables |
|-----------|-------------|---------|
| **Scope clarity** | Bounded outcome (time, effort class, or explicit “not scoped”) | Fork / merge without ambiguity |
| **Acceptance signal** | Typed **definition of done** (checklist, enum, metric) | Completion + unblock rules |
| **Move alignment** | `moveType` / campaign alignment | Routing + riffing in right context |
| **Template linkage** | Spawned from a **QuestTemplate** or exemplar | Consistency + higher riff quality |
| **Steward / review** | Optional gate for campaign-visible placement | Anti-junk on shared surfaces |
| **Lineage** | `revision`, `fork_of`, `merged_into` | Audit + merge |
| **Participation clarity** | Who may complete / attach (roles, membership) | Race resolution |

---

## User Stories (summary)

1. **As a player**, I attach a quest from my hand to a **blocked** parent only when my quest **unblocks** that parent per rules.
2. **As a player**, I **fork** a parallel unblock path when another player’s path is already claimed or I disagree on scope.
3. **As a steward**, I **merge** two forks when they duplicate the same work, or reject junk.
4. **As a system**, I **version** quest content so completion references **what** was agreed.

---

## Non-goals (v1)

- Full Notion-style block editor inside every quest.
- Automatic ML quality scoring (defer; optional later).
- Parity with Asana’s full workflow automation suite.

---

## Acceptance criteria (spec kit)

- [ ] RESEARCH.md linked and kept as **historical** reference; product decisions in **spec** + **plan**.
- [ ] Typed edge model + quality rubric **named** in schema or ADR before wide implementation.
- [ ] Backward compatibility: existing quests **without** new fields still complete.

---

## References

- [RESEARCH.md](./RESEARCH.md)
- Codebase: `src/actions/quest-nesting.ts`, `quest-engine.ts`, `quest-placement.ts`, `gameboard.ts`
- Prisma: `CustomBar` / `PlayerQuest` / `GameboardSlot`
