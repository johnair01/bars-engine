# Backlog Audit: Deftness & API-First Development

**Date**: 2025-03-05  
**Scope**: All specs and backlog prompts in `.specify/specs/` and `.specify/backlog/prompts/`  
**Reference**: [Deftness Development Skill](../../.agents/skills/deftness-development/SKILL.md), [AI Deftness Token Strategy](../specs/ai-deftness-token-strategy/spec.md)

---

## Executive Summary

The backlog has **strong examples** of deftness and API-first design (prisma-client-browser-fix, admin-cyoa-preview-draft-wizard, creation-quest-bootstrap, iching-alignment, 321-shadow-process). However, **most Ready specs lack explicit API contracts** and **backlog prompts rarely enforce API-first**. This audit recommends a spec template, backlog prompt template, and targeted improvements so all specs align with deftness and API-first development.

---

## Definitions (Canonical)

| Term | Definition |
|------|------------|
| **Deftness** | Intentional, controlled use of AI; deterministic over AI when possible; spec kit first; scaling robustness |
| **API-First** | Define data shape and route/action signature **before** building UI. Contract before implementation. |
| **Route Handler** | `/api/*` — external consumers, webhooks, non-React callers → `NextResponse.json()` |
| **Server Action** | `'use server'` — form submissions, React `useTransition` → `{ success, error, data }` |

---

## Specs with Strong Deftness / API-First

| Spec | API Contracts | Practice | Notes |
|------|----------------|----------|-------|
| prisma-client-browser-fix | ✅ Explicit "API Contract (API-First)" | — | Server action signature before UI |
| admin-cyoa-preview-draft-wizard | ✅ "API Contracts (API-First)" (3 contracts) | — | Preview, Status, Create Passage |
| creation-quest-bootstrap | ✅ API Contracts section | ✅ "Deftness Development" | extractCreationIntent, generateCreationQuest, assembleArtifact |
| iching-alignment-game-master-sects | ✅ API Contracts | ✅ "Deftness Development" | getAlignmentContext, drawAlignedHexagram |
| 321-shadow-process | ✅ API Contracts | ✅ "Deftness Development" | Deterministic over AI |
| iching-unplayed-preference | ✅ API Contracts | — | IChingAlignmentContext extended, drawAlignedHexagram |
| iching-grammatic-quests | ✅ API Contracts | — | IChingContext, generateRandomUnpacking |
| random-unpacking-canonical-kernel | ✅ API Contracts | — | getLabelsForMove, pickExperienceForPlayer |
| 321-efa-integration | ✅ API Contract in plan | — | Gold star mint logic |

---

## Specs Lacking API Contracts (Ready / High Priority)

| Spec | Category | Gap | Status |
|------|----------|-----|--------|
| offers-bounty-donation-packs | Economy | — | ✅ **Resolved** — API Contracts added |
| k-space-librarian | Docs/UI | — | ✅ **Resolved** — API Contracts added |
| book-to-quest-library | Infra/UI | — | ✅ **Resolved** — API Contracts added |
| iching-grammatic-quests | Infra | Has API Contracts; backlog prompt lacks "API-first" instruction |
| random-unpacking-canonical-kernel | Infra | Has API Contracts; no "Practice" or scaling checklist |
| avatar-visibility-and-cert-report-issue | UI (bug fix) | No API surface; acceptable for pure bug fix |
| admin-agent-forge | Infra | Complex state machine; no explicit API contract section |
| story-quest-map-exploration | UI | No spec yet; prompt-only |
| Appreciation Mechanic (W) | Economy | No spec; backlog entry only |
| Signature Vibeulons (X) | Economy | No spec; backlog entry only |
| Bruised Banana House (Y) | UI/Infra | No spec; backlog entry only |

---

## Backlog Prompts: API-First Compliance

| Prompt | API-First? | Notes |
|--------|------------|-------|
| prisma-client-browser-fix | ✅ Explicit "## Prompt (API-First)" | Defines action before implementation |
| admin-cyoa-preview-draft-wizard | ✅ "API-first, deft" in prompt | Contract-first |
| creation-quest-bootstrap | ✅ "API-first contracts" in prompt | extractCreationIntent, etc. |
| offers-bounty-donation-packs | ❌ | Checklist only; no contract-first |
| k-space-librarian | ❌ | Deliverables list; no API contract |
| iching-grammatic-quests | ❌ | Checklist; no API-first instruction |
| iching-unplayed-preference | ❌ | No prompt; spec-only |
| random-unpacking-canonical-kernel | ❌ | No prompt; spec-only |
| 321-shadow-process | ✅ "API-first, deterministic over AI" | — |

---

## Recommendations

### 1. Spec Template (Add to Spec Kit Translator)

Add a **Required Sections** checklist for specs with persistence, UI, or external surface:

```markdown
## Required Sections (Deftness)

- [ ] **Practice** (if applicable): "Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI."
- [ ] **API Contracts**: Define method/path, input shape, output shape before FRs.
- [ ] **Route vs Action**: Document which surfaces use Route Handler vs Server Action.
- [ ] **Scaling Checklist** (if AI, upload, filesystem): Reference [deftness-development/reference.md](../../.agents/skills/deftness-development/reference.md).
```

### 2. Backlog Prompt Template (Add API-First Block)

For prompts that implement features with API surface:

```markdown
## Prompt (API-First)

> Implement [Feature] per [spec]. **API-first**: define [action/route] signature and data shapes before UI. [Specific action/route]. Spec: [path].

## Checklist
- [ ] API contract (input/output) defined in spec or plan
- [ ] Server Action or Route Handler implemented first
- [ ] UI wired to action/route
```

### 3. Targeted Spec Improvements

| Spec | Suggested Addition |
|------|--------------------|
| offers-bounty-donation-packs | Add "## API Contracts" with `createBountyAction`, `redeemPackAction`, `POST /api/donation/webhook` |
| k-space-librarian | Add "## API Contracts" with `resolveOrSpawn(input)`, `GET /library/search` |
| book-to-quest-library | Add "## API Contracts" with `getQuestLibraryContent(playerId)`, `pullFromLibrary(threadId \| questId)` |
| admin-agent-forge | Add "## API Contracts" with `createForgeSession`, `forgeStateTransition` |
| iching-grammatic-quests | Add "**Practice**: Deftness Development" to spec header |

### 4. Backlog Prompt Improvements

| Prompt | Suggested Addition |
|--------|--------------------|
| offers-bounty-donation-packs | Add "## Prompt (API-First)" block; define `createBountyAction`, `redeemPackAction` before checklist |
| k-space-librarian | Add "API-first: define resolveOrSpawn, /library/search contract before UI" |
| iching-grammatic-quests | Add "API-first: IChingContext, generateRandomUnpacking, publishIChingQuestToPlayer contracts before UI" |
| iching-unplayed-preference | Create backlog prompt with API-first block (spec exists; prompt missing) |

### 5. Spec Kit Translator Skill Update

Extend the Spec Kit Translator protocol (Clarify Objects, Surfaces, Governance) with:

- **Clarify API Surface**: What actions or routes does this feature expose? Route Handler (external) or Server Action (internal)?
- **Draft API Contract**: Before FRs, add a section with type signatures and response shapes.

### 6. Deftness Checklist in reference.md

Add a "Spec Checklist" to [deftness-development/reference.md](../../.agents/skills/deftness-development/reference.md):

```markdown
## Spec Checklist (Before Implementation)

- [ ] API Contracts section exists (for persistence/UI/API features)
- [ ] Route vs Action documented
- [ ] Practice: Deftness Development (when applicable)
- [ ] Scaling checklist (when AI, upload, filesystem)
```

---

## Summary

| Category | Count | Action |
|----------|-------|--------|
| Specs with API Contracts | ~9 | Use as reference |
| Specs lacking API Contracts (Ready) | ~8 | Add API Contracts section |
| Prompts with API-First | ~4 | Use as reference |
| Prompts lacking API-First | ~15+ | Add API-First block |

---

## Completion Status (2025-03-05)

| Item | Status |
|------|--------|
| Spec Template | ✅ Done — `.specify/spec-template.md` |
| Backlog Prompt Template (API-First block) | ✅ Done — Spec Kit Translator |
| Spec Kit Translator protocol (Clarify API Surface) | ✅ Done |
| Deftness reference (Spec Checklist) | ✅ Done |
| Targeted spec improvements (offers, k-space, book-library) | ✅ Done — API Contracts added |

**API-first audit complete.** New specs use the template; new prompts use the API-First block; three targeted specs now have API Contracts. Ready to explore backlog items for implementation.
