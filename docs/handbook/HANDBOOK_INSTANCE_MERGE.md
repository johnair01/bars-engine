# Instance handbook inheritance and campaign lore (spec)

**Status:** Design for a follow-on phase after `WikiPageContent` and handbook wiki pages are stable.

## Goal

- **Campaigns** inherit the Player’s Handbook baseline from their **Instance**.
- **Campaigns** may add **additive lore** (flavor, house rules, local safety agreements) that **merges** into the instance’s shared context for future play.

## Content resolution order

For each logical section key (e.g. `handbook/analog-play`, `handbook/safety`):

1. **Global default** — static wiki and/or `WikiPageContent` with slug `handbook/...` (no `instanceId`).
2. **Instance override** — optional row keyed by `(instanceId, sectionKey)` or merged Markdown fragment.
3. **Campaign addition** — optional additive block from the active campaign (append or labeled inset), not replacing (2) unless policy says “campaign wins.”

Exact merge rules (concat vs. replace vs. block quote) are a product decision; default additive for lore, replace only for explicit “house rules” blocks.

## Data model (options)

- **A.** Extend `WikiPageContent` with nullable `instanceId` and `campaignId`; filter by context at read time.
- **B.** New table `InstanceHandbookFragment` / `CampaignHandbookContribution` with `sectionKey`, `bodyMarkdown`, `mergeMode`.
- **C.** Store JSON in `Instance` / `CampaignDraft` metadata for small fragments only.

## API (future)

- `GET /api/wiki/handbook-context?instanceId=&campaignId=` — returns merged Markdown per section for GPT drafting.
- Writes restricted to admins or scoped keys (separate from global `WIKI_WRITE_API_KEY`).

## UI (future)

- `/wiki/handbook` with optional `?instance=` or `/world/[slug]/handbook` composing global + instance + campaign blocks.

## Relation to template resolver

Today, [`src/lib/template-resolver.ts`](../../src/lib/template-resolver.ts) resolves `{{instance.*}}` in CYOA/event copy. Handbook merge is the **same idea** at a larger grain: composed narrative for “what this table’s book says.”
