# Spec: 321 → BAR draft experience (tweet-like BARs)

## Purpose

Rework how **321 session data becomes a BAR** so the experience matches how players actually relate to BARs: **text-and-image surfaces** (tweet-like), not **database forms with mandatory headlines**. The database may still require a `title` (or equivalent) for lists, search, and joins; **players should not have to “name” a BAR** unless they choose to.

This spec **evolves** [321-shadow-process](../321-shadow-process/spec.md) metadata import and the current **`deriveMetadata321` → long labeled description** pattern. It aligns with **campaign milestone** needs (structured hooks, domain direction) and with [charge-capture-personal-move-commitment](../charge-capture-personal-move-commitment/spec.md) (move-aware threads).

**Practice:** Deftness — contract before UI; deterministic rules for draft derivation; dual-track (full BAR editor remains for power users).

---

## Problem statement (today)

| Area | Issue |
|------|--------|
| **Copy** | `deriveMetadata321` concatenates all answers into a **wall of labeled text** and builds a **title from two answer fragments** — feels like a DB export, not a BAR. |
| **Quick path** | “Create BAR from 321” reuses the **full** create-BAR surface: optional allyship domain, visible **nation/archetype gating**, no **image** affordance in the quick path — misaligned with **basic** players and tweet-like BARs. |
| **Title** | UI implies players must supply a **title**; product intent is **optional display title**, system-only default acceptable. |
| **Artifact step** | Choosing BAR **clears 321 session** before navigation; user **cannot return** to pick Quest / Daemon / Witness / Fuel without losing context. |
| **Tags** | Tags derived from free-text tokenization are **noisy**; milestones need **stable, intentional** keys where possible. |

---

## Design principles

1. **BAR = primary body + optional media** — Lead with **description/body** (and image when available). **Title** is **system sugar**: auto-generated, editable only where lists need a label or player explicitly wants one.
2. **321 supplies structure, not a dump** — Prefer **choices already made in 321** (e.g. aligned move, feeling tags, mask name) mapped into a **Bar draft**; full verbatim 321 remains **collapsible / “source”**, not the default body.
3. **Quick BAR from 321** — A **dedicated mode**: **allyship domain required** (player direction), **nation/archetype gating hidden** by default (Advanced), **image upload** available at parity with “real” BARs.
4. **Reversible dispatch** — Until a **terminal** outcome (BAR saved, quest created, daemon saved, witness/fuel committed), player can **return to the artifact grid** and choose a different path.

---

## User stories

### P1 — Bar draft contract (deterministic)

**As a** system, **I want** a **`BarDraftFrom321`** (or evolved `Metadata321`) that separates **display body**, **suggested system title**, **move**, **domain suggestion**, and **tag hooks**, **so** UI and milestones consume **structured** data.

**Acceptance:**

- New or extended type documented (see API section) with fields for at least: `body` (player-facing main text), `systemTitle` (optional auto label for DB/lists), `moveType` alignment when 321 provides aligned action, `allyshipDomainSuggested` or explicit `allyshipDomain` when collected in-flow, `tags` (curated list + optional `milestone:` namespace), `source` (embedded full export or snapshots refs).
- **`deriveBarDraftFrom321`** (or `deriveMetadata321` v2) implements **short, readable body** (e.g. 2–4 sentences or bullet summary from structured slots — rules in plan), **not** full concatenation of all Q&A as default body.
- Full verbatim export remains available as **`bodySource`** or `attachments.source321` for audit / “show original” — not default paragraph.

### P2 — Tweet-like create flow (from 321)

**As a** player finishing 321, **I want** to **compose my BAR like a post** (text + image first), **so** I don’t feel I’m filling a schema.

**Acceptance:**

- Quick path **does not** surface a required “Title” field above the fold; **body** (description) is primary; **system title** filled hidden or in advanced block with helper copy (“Used in lists — optional edit”).
- Image upload present when product supports images on `CustomBar` (or documented stub if schema work is phase 2).

### P3 — Domain is direction (required in quick path)

**As a** player, **I want** to **point my BAR** via **allyship domain** when creating from 321, **so** the BAR connects to campaigns and milestones meaningfully.

**Acceptance:**

- In **quick BAR from 321** mode, **allyship domain is required** before submit (with clear empty-state validation).
- Default may be **suggested** from 321 data where rules allow; player must **confirm or change**.

### P4 — Gating for power users only

**As a** basic player, **I want** **nation/archetype restrictions** out of the way, **so** I’m not confused during my first BAR.

**Acceptance:**

- In quick BAR from 321, **nation + archetype gating** are **hidden** behind **Advanced** (or removed from this mode entirely if product chooses single global visibility rule).
- Full `CreateBarForm` from other entry points may unchanged for power users.

### P5 — Reversible artifact choice

**As a** player, **I want** to **open “Create BAR”** and still **go back** to choose Quest, Daemon, Witness, or Fuel, **so** I’m not locked on first click.

**Acceptance:**

- Navigating to `/create-bar?from321=1` **does not** destroy recoverable 321 state until **BAR create succeeds** or user **explicitly discards**.
- **Back** from create-bar (or in-app back) returns to **artifact step** with **same session** where technically feasible (sessionStorage retained and/or **server `Shadow321Session` id** in URL).
- Document edge cases: new tab, refresh, logout.

### P6 — Tags and milestones

**As a** campaign designer, **I want** tags from 321→BAR to be **usable for milestone logic**, **so** we don’t rely on random word splits.

**Acceptance:**

- Tag strategy documented: e.g. **`move:*`**, **`domain:*`**, optional **`campaign:<ref>:<key>`** — deterministic where possible; free tags only as supplemental.
- No requirement to implement every milestone in v1; **contract** must support extension.

---

## Non-goals (v1)

- Replacing the entire `CreateBarForm` for non-321 entry.
- AI rewrite of 321 prose as default (optional later).
- Changing vibeulon mint rules (see 321-shadow-process).

---

## API / data contracts

### BarDraftFrom321 (conceptual)

```ts
/** Evolves Metadata321 from 321-shadow-process/spec.md */
type BarDraftFrom321 = {
  /** Primary player-facing text — short composed summary, not full Q&A dump */
  body: string
  /** Lists / DB / SEO — auto; optional player override in Advanced */
  systemTitle: string
  /** When 321 provides aligned action — maps to CustomBar move vocabulary */
  moveType?: 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp' | null
  /** Required in quick path — may equal allyshipDomainSuggested until user confirms */
  allyshipDomain?: string | null
  allyshipDomainSuggested?: string | null
  /** Curated + milestone-friendly; replaces noisy tokenization */
  tags: string[]
  /** Optional: full labeled export for “Show original 321” */
  source321FullText?: string
  linkedQuestId?: string
  /** Pass-through for persistence / metabolism */
  phase2Snapshot?: string
  phase3Snapshot?: string
  shadow321Name?: unknown
}
```

Server: `createCustomBar` accepts draft fields (FormData or JSON) consistent with existing `metadata321` / snapshot fields; migration path from old `Metadata321` prefill.

---

## Dependencies

| Spec | Relationship |
|------|----------------|
| [321-shadow-process](../321-shadow-process/spec.md) | Parent; metadata import rules superseded for **default body/title behavior** by this spec. |
| [charge-capture-personal-move-commitment](../charge-capture-personal-move-commitment/spec.md) | Move + campaign threads; Bar draft carries `moveType`. |
| [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md) | Optional: milestone tag consumption. |

---

## Acceptance (release gate)

- [ ] `deriveBarDraftFrom321` (or v2) produces **short body** + **systemTitle**; full dump **not** default body.
- [ ] Quick BAR from 321: **domain required**; gating **hidden** from default view.
- [ ] Create UI: **body-first**, **title non-prominent** (system default).
- [ ] **Image** upload on quick path when BAR model supports it (or documented deferral).
- [ ] **Artifact → BAR → back** preserves session per acceptance in P5.
- [ ] `npm run build` and `npm run check` pass.

---

## References

- `deriveMetadata321`: [packages/bars-core/src/quest-grammar/deriveMetadata321.ts](../../../packages/bars-core/src/quest-grammar/deriveMetadata321.ts)
- `CreateBarForm` / `CreateBarPageClient`: [src/components/CreateBarForm.tsx](../../../src/components/CreateBarForm.tsx), [src/components/CreateBarPageClient.tsx](../../../src/components/CreateBarPageClient.tsx)
- `Shadow321Runner`: [src/app/shadow/321/Shadow321Runner.tsx](../../../src/app/shadow/321/Shadow321Runner.tsx)
- `Shadow321Form` (embedded): [src/components/shadow/Shadow321Form.tsx](../../../src/components/shadow/Shadow321Form.tsx)
- Deftness: [.agents/skills/deftness-development/SKILL.md](../../../.agents/skills/deftness-development/SKILL.md)
