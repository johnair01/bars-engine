# Research: Task / Card Models (Trello, Asana, OSS) → Typed Quest (BAR)

**Purpose:** Inform a **well-typed, extensible quest object** where a Quest is a BAR specialized for *work that gets done*, with **building-block** semantics and **quality** that enables riffing and collaboration.

**Sources:** Public API docs, product documentation, and established OSS patterns (verified at research time). Implementation details in OSS repos vary by version; treat as **patterns**, not copy-paste schemas.

---

## 1. Cross-cutting patterns (what “good” systems share)

| Pattern | What it does | Why it matters for BARs |
|--------|----------------|-------------------------|
| **Thin core + typed extensions** | A small stable identity (card/task) plus **schema-defined** extra data | Quest = stable id; “what work means” lives in typed extensions, not ad-hoc JSON soup |
| **Scope hierarchy** | Workspace/board/project → container → work item | Maps to campaign / instance / thread / quest |
| **Typed custom fields** | Field **definitions** (name, type, options) at container scope; **values** on items | “Quality attributes” and domain tags can be first-class and queryable |
| **Graph edges beyond parent** | Subtasks, **dependencies**, blockers | Unblock / fork / merge need explicit edge types, not only `parentId` |
| **Metadata bag (escape hatch)** | Key-value metadata on tasks (plugins) | Kanboard-style: fast experiments; **must** be namespaced to avoid chaos |
| **Templates** | Card/task templates seed consistent structure | High-quality defaults → more riffing on sound scaffolding |
| **Membership / visibility** | Per-card assignees, subscribers, roles | Collaboration + “who can complete / fork” |

---

## 2. Trello (Atlassian)

**Mental model:** `Board → List → Card`. Cards are the unit of work; lists are columns/states.

**Extensibility:**

- **Custom Fields** are **board-scoped definitions** (dropdown, text, number, date, checkbox). Each card holds **at most one value per field** via `customFieldItems` (typed binding to the definition).
- **Power-Ups** extend behavior (integrations, automation); historically Custom Fields was a Power-Up, now core API.
- API exposes **nested resources** and object definitions (`idBoard`, `idList`, etc.).

**Relevance for BARs:**

- Strong precedent for **“definition at container scope, value on entity”** — fits **campaign-scoped quest templates** and **quality rubrics** as field definitions.
- Cards are **not** deeply nested by default (checklists are separate resources); **hierarchy** is flatter than Asana; dependency modeling is weaker in the base product (often via Power-Ups).

**Docs:** [Trello REST API – Custom fields](https://developer.atlassian.com/cloud/trello/rest/api-group-customfields/), [Object definitions](https://developer.atlassian.com/cloud/trello/guides/rest-api/object-definitions).

---

## 3. Asana

**Mental model:** **Task** is central; organized into **Projects**, **Sections**, **Workspaces**; tasks support **subtasks** and **dependencies** as first-class API concepts.

**Extensibility:**

- **Custom fields** are **workspace-scoped** (types: text, enum, multi_enum, number, date, people). Tasks expose `custom_fields` when requested (`opt_fields`).
- **Dependencies API** — tasks can depend on other tasks (blocking / waiting-on semantics in the product).
- **Subtasks** — separate resource; list children of a task.

**Relevance for BARs:**

- Strong precedent for **dependency graph** + **hierarchy** alongside a rich task object — aligns with **unblock-only placement** and **fork** as parallel dependency edges.
- **gid**-style global IDs — pattern for stable references across merges (conceptual parallel to **quest revision + lineage**).

**Docs:** [Tasks](https://developers.asana.com/reference/tasks), [Custom fields](https://developers.asana.com/reference/custom-fields), [Dependencies](https://developers.asana.com/reference/getdependenciesfortask).

---

## 4. Open-source clones & variants

### 4.1 Wekan (Trello-like, Meteor + MongoDB)

- **Cards** live in **lists** on **boards**; Mongo collections for cards, lists, checklists, etc.
- **Extensibility** is often **schema + migrations** in-repo; checklist items link to `cardId`.
- **Takeaway:** Similar UX to Trello; **typed extensions** are less central than in Asana’s API; good for **UI parity** research, less for **typed dependency graph** reference.

### 4.2 Kanboard (PHP, open source)

- **Task metadata** plugin model: **arbitrary key-value metadata** on tasks via **TaskMetadataModel** (JSON-RPC: `getTaskMetadata`, `saveTaskMetadata`, …).
- Docs stress **prefixing keys** with plugin name to avoid collisions.
- **Takeaway:** Proven **escape hatch** for extensions; BARs should **namespace** metadata keys (`bars.*`, `plugin.*`) if a bag is kept.

**Docs:** [Task metadata procedures](https://docs.kanboard.org/v1/api/task_metadata_procedures), [Metadata](https://docs.kanboard.org/v1/plugins/metadata).

### 4.3 Planka (PostgreSQL, Trello-style)

- Relational model: **`card`**, **`board`**, **`list`**, **`card_label`**, **`card_membership`**, **`attachment`**, etc.
- **Takeaway:** Clean **relational** decomposition of collaboration primitives (labels, members, subscriptions) — useful when splitting **Quest** vs **QuestParticipation** vs **QuestLabel** in Prisma.

### 4.4 Focalboard (Mattermost; block-based boards)

- **Board** → **cards** with **properties** (shared schema across board), **views** (kanban, table, calendar, gallery).
- Cards: **content** (markdown), **comments**, **properties** — user-facing model emphasizes **properties as first-class columns**.
- **Takeaway:** Aligns with **typed properties + views**; “block” internals in the codebase are more Notion-like — for BARs, the **property system** is the transferable idea, not necessarily block storage.

**Docs:** [Focalboard contributors](https://developers.mattermost.com/contribute/more-info/focalboard/).

---

## 5. Synthesis: “quality” and collaboration primitives

Commercial tools rarely expose a single **“quality score”** in the API. Instead they combine:

1. **Structure** — required fields, templates, custom fields that encode **definition of done**.
2. **Visibility** — who is assignee / member / subscriber.
3. **Process** — dependencies, sections, approvals (often in higher tiers).
4. **Governance** — workspace rules, field immutability after creation (Asana custom field names unique per workspace).

For **BARs / quests**, a practical mapping:

| Quality lever | Inspired by | BARs direction |
|---------------|-------------|----------------|
| **Typed acceptance** | Custom fields + task description | `acceptanceCriteria` / `doneSignal` as typed fields, not only prose |
| **Dependency clarity** | Asana dependencies | Explicit edges: `unblocks`, `requires`, `fork_of`, `merged_into` |
| **Template / exemplar** | Card templates, model quests | Versioned **QuestTemplate** + **quality tier** |
| **Riffing** | Comments, members, public boards | Fork + merge + **steward review** on campaign surfaces |
| **Anti-junk** | Stakes, moderation, duplicate detection | Economic + social + optional ML later |

---

## 6. Gaps vs “Quest is a BAR”

- **BAR** already carries narrative + game state; **work-management tools** separate **task** from **document**. Decision needed: **single `CustomBar` row** with typed JSON columns vs **normalized `QuestWork` / `QuestEdge` tables** — see `spec.md`.
- **Versioning:** OSS tools often **version cards** weakly; **git-like** or **revision** models are rare. BARs **explicitly** need **revision** for unblock + merge semantics.

---

## 7. Recommended reading order for implementers

1. Asana: task + dependencies + custom fields (graph + typing).
2. Trello: custom fields (definition/value split).
3. Kanboard: metadata (namespaced escape hatch).
4. Planka / Focalboard: relational cards + properties (schema decomposition).

---

## 8. Changelog

| Date | Note |
|------|------|
| 2026-03-21 | Initial research pass for typed-quest-bar-building-blocks spec kit. |
