# Six Faces — Quest Metabolism, Wizard, Subquests & Agents

**Context:** Players must learn to create **high-quality, metabolizable** quests. The **Quest Wizard** (`/quest/create`, `QuestWizard.tsx`) must only emit quests the **quest engine** can complete and attribute. **BARs for inspiration** ≠ **subquests for collective blockers**. **Fork** exists because public subquest proposals may be wrong. **System / AI-generated** quests must allow **self-unblock** and **collective needle** movement. **AI agents** will eventually call a move: **add subquest** — the game needs a **standardized inventory of legal moves**.

This document is **Game Master guidance** (Six Faces). Implementation follows spec kits: `typed-quest-bar-building-blocks`, `quest-wizard-template-alignment`, future `quest-agent-moves`.

---

## Shaman — *What is actually stuck?*

- **Read the signal before the story.** A metabolizable quest names the **block** (charge) and a **next physical or social action** — not only a mood label.
- **Personal blocker** → quest is **for the self**: scope = `personal_self`, visibility usually private; completion metabolizes *their* resistance.
- **Collective blocker** → subquest is **for the we-space**: must name **who** is blocked together and **what observable outcome** unblocks the parent — even if the proposal is later forked.
- **Wizard fix:** First step after template = **blocker type** (personal vs collective) + **one sentence “done means”** — block publish if empty.

---

## Regent — *What does the system law allow?*

- **Regent assesses fit to rules.** Only quests that satisfy `completeQuestForPlayer` + placement rules + campaign gates are “legal.”
- **Metabolizable** = has **typed inputs**, **completionEffects** the engine understands, and **moveType** / **campaignRef** coherence when on the board.
- **Subquest** attaching to a parent must **respect unblock graph** (future typed edges); until then, **document** minimum: parent exists, campaign matches, key/Tetris rules honored.
- **Wizard fix:** **Server-side validation** mirroring wizard steps — no raw “free text only” quests without schema. **Templates** are the regent-approved list.

---

## Challenger — *Where is this naive or gaming the system?*

- **Fork exists because the first public subquest can be wrong** — emotionally appealing but not actually unblocking.
- **Challenge junk:** vague titles, no acceptance signal, “awareness” quests with no observable action — these **clog** collective view.
- **Wizard fix:** Force **acceptance criteria** (even a single checkbox or metric). **Reject** or downgrade to draft if player bypasses.
- **Agents:** If “add subquest” has no **challenger pass** (scope too big, duplicates existing fork), **deny** or require **steward review**.

---

## Architect — *What are the building blocks?*

- **Quest = BAR + work schema.** Separate:
  - **Inspiration BAR** (color, note, link) — does not need engine completion.
  - **Work quest** — has **inputs JSON**, **completion path**, optional **parentId** / **unblock role**.
- **Standardize the game:** enumerate **moves** in one registry: e.g. `complete_quest`, `add_subquest`, `fork_subquest`, `merge_subquests`, `attach_to_slot`, `place_on_thread` — each with **preconditions** and **effects** (for humans + agents).
- **Wizard fix:** Emit only **template-bound** payloads; extend **QuestTemplate** with `metabolizable: true` and `engineContract` version.
- **System quests:** Design with **escape hatches** — smaller subquests or **personal** unblock path so one player isn’t soft-locked.

---

## Diplomat — *How do we say this without shame?*

- **Copy matters.** “Collective blocker” vs “I’m stuck” should feel like **invitation**, not accusation. Fork is **disagreement with care**, not attack.
- **Wizard fix:** Microcopy on **personal vs collective** scope; explain **fork** in one line when visibility is public.
- **Onboarding:** Short line: **BAR = compost / inspiration; Quest = committed work the system can score.**

---

## Sage — *What integrates across all of this?*

- **Single thread:** *Quality = metabolizable + scoped + forkable when collective.* The Wizard is the **pedagogy**; the engine is the **truth**; forks are the **we-space learning loop**.
- **Order of operations for the codebase:**
  1. **Discoverability** — link `/quest/create` from hand, adventures, wiki.
  2. **Validation** — wizard + `createQuestFromWizard` only allow **template-locked** metabolizable quests; expand templates.
  3. **Typed edges** — `typed-quest-bar-building-blocks` spec (unblock vs inspiration).
  4. **Move registry** — one module listing **player + agent** moves with shared preconditions.
  5. **Agent move `add_subquest`** — calls same server action as UI; tests with dry-run flag.

---

## Quick reference — three kinds of “thing”

| Kind | Purpose | Typical visibility | Metabolizable? |
|------|---------|-------------------|----------------|
| **Inspiration BAR** | Capture, color, link to quest | Private / diary | No — not a commitment |
| **Personal unblock quest** | Solve *my* blocker to advance *my* work | Private | Yes — engine completes |
| **Public collective subquest** | Propose work that unblocks **us** | Public / campaign | Yes — fork if wrong |

---

## Where in code

| Piece | Location |
|-------|----------|
| Quest Wizard UI | `src/components/quest-creation/QuestWizard.tsx` |
| Route | `src/app/quest/create/page.tsx` → `/quest/create` |
| Create action | `src/actions/create-bar.ts` → `createQuestFromWizard` |
| Engine | `src/actions/quest-engine.ts` |
| Subquest create | `src/actions/quest-nesting.ts` → `createSubQuest` |
| Emotional alchemy / wizard alignment | `src/lib/bar-quest-generation/emotional-alchemy.ts` |

---

## Changelog

| Date | |
|------|--|
| 2026-03-21 | Initial Six Faces guidance for metabolism, wizard, forks, agents. |
