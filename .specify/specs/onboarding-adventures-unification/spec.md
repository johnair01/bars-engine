# Spec: Onboarding Adventures Unification (Investigation)

## Purpose

Investigate why the Bruised Banana campaign does not appear in the Admin Adventures pane and propose how to unify onboarding so both Wake-Up and Bruised Banana are visible and manageable in one place.

## Observed behavior

- **Admin Adventures pane** (`/admin/adventures`): Shows only **Wake-Up Campaign** (1 adventure).
- **Expected**: Both Wake-Up and Bruised Banana should appear as adventures.
- **Impact**: Onboarding is developed on separate processes; Bruised Banana cannot be edited via Admin Adventures.

## Root cause (investigation findings)

### Two distinct architectures

| Aspect | Wake-Up Campaign | Bruised Banana |
|--------|------------------|----------------|
| **Data model** | `Adventure` + `Passage` (DB) | None — nodes generated in code |
| **Source** | `content/campaigns/wake_up/` → `seed-wake-up-adventure.ts` | `getBruisedBananaNode()` in `src/app/api/adventures/[slug]/[nodeId]/route.ts` |
| **Admin visibility** | Yes — appears in Admin Adventures | No — no Adventure record |
| **Edit surface** | Admin → Adventures → Edit passages | Event page campaign editor (Instance.wakeUpContent, showUpContent, storyBridgeCopy) |
| **Campaign page** | `/campaign` (no ref) → DB or file | `/campaign?ref=bruised-banana` → API dynamic nodes |

### Why Bruised Banana is missing

1. **Admin Adventures pane** queries `db.adventure.findMany()` — only `Adventure` records are listed.
2. **Bruised Banana** has no `Adventure` record. Its nodes (BB_Intro, BB_ShowUp, BB_Developmental_Q1, BB_ChooseNation, BB_NationInfo_*, etc.) are generated on-the-fly by `getBruisedBananaNode()` when the API receives `ref=bruised-banana` and `slug=wake-up`.
3. BB content is **dynamic**: Instance (wakeUpContent, showUpContent, storyBridgeCopy), Nation, Playbook, ALLYSHIP_DOMAINS. It cannot be represented as static Passages without a different model.

## Functional requirements (proposed)

- **FR1**: Bruised Banana MUST appear in the Admin Adventures pane so admins can discover and manage it.
- **FR2**: Admins MUST have a single surface (or clearly linked surfaces) to edit both Wake-Up and Bruised Banana onboarding content.
- **FR3**: The unification approach MUST not break existing campaign flows (`/campaign`, `/campaign?ref=bruised-banana`).

## Options for unification

### Option A: Synthetic Adventure row

Add a "Bruised Banana" row to the Admin Adventures list that does not correspond to an `Adventure` record. Clicking it navigates to a dedicated editor (e.g. `/admin/adventures/bruised-banana` or `/admin/instances/[id]/campaign`) that edits Instance fields and documents the BB node graph.

- **Pros**: Minimal schema change; BB stays dynamic.
- **Cons**: Different edit UX than Wake-Up; list mixes DB records with synthetic rows.

### Option B: Adventure record + dynamic passage resolution

Create an `Adventure` with slug `bruised-banana`, status ACTIVE, and Passages that describe the BB graph (e.g. BB_Intro, BB_ShowUp as placeholder passages). The campaign API continues to serve dynamic content; Admin shows the adventure and links each "passage" to the appropriate edit surface (Instance fields, or a BB-specific editor).

- **Pros**: Both appear in Admin Adventures; consistent list.
- **Cons**: Passages may be stubs; edit flow differs from Wake-Up.

### Option C: Migrate BB to Adventure + Passage with templates

Create full Passages for BB nodes, with template syntax (e.g. `{{instance.wakeUpContent}}`) that the API resolves at runtime. Admin edits Passages; API interpolates Instance/Nation/Playbook data.

- **Pros**: Single model; Admin edits passages like Wake-Up.
- **Cons**: Significant refactor; template system needed; Nation/Playbook info nodes are dynamic lists.

### Option D: Unified campaign ref in Adventure

Add `campaignRef` (or similar) to `Adventure`. When `campaignRef=bruised-banana`, the campaign page uses that Adventure's slug for API calls but the API serves BB dynamic nodes. The Adventure record exists for Admin visibility; Passages are optional stubs.

- **Pros**: Clear mapping; both in list.
- **Cons**: Adventure record is mostly metadata; edit flow still split.

## Recommendation (chosen)

**Option C: Full migration to Adventure + Passage with templates** — This is the chosen approach because having admin tools able to edit pages is the current blocker for shipping to new users. Admins must be able to edit Bruised Banana content via Admin → Adventures, same as Wake-Up.

**Supporting: Option D** — Add `campaignRef` to `Adventure` so the campaign page can resolve which flow to serve. When `adventure.campaignRef === 'bruised-banana'`, the API serves from that Adventure's Passages (with template resolution) instead of hardcoded `getBruisedBananaNode()`.

### Option C implementation outline

1. **Schema**: Add `campaignRef` to `Adventure` (optional; e.g. `bruised-banana`).
2. **Seed**: Create Adventure `bruised-banana` with Passages for all BB nodes. Use template syntax for dynamic content:
   - `{{instance.wakeUpContent}}`, `{{instance.storyBridgeCopy}}`, `{{instance.showUpContent}}` for intro/showup
   - `{{#each nations}}...{{/each}}` or JSON-in-Passage for nation/playbook choice lists (or keep those as API-generated; see below)
3. **Template resolver**: API route, when serving `adventure.slug === 'bruised-banana'` (or `campaignRef` match), loads Passage by nodeId, resolves `{{...}}` placeholders against Instance/Nation/Playbook, returns node.
4. **Dynamic nodes**: BB_NationInfo_*, BB_PlaybookInfo_*, BB_ChooseNation, BB_ChoosePlaybook — these depend on DB (Nation, Playbook). Options: (a) Keep API-generated for choice lists; Passages only for static nodes. (b) Passage stores template; resolver fetches Nations/Playbooks and renders. (c) Hybrid: static nodes in Passages; dynamic nodes (nation/playbook lists) remain in API.
5. **Admin**: Same edit flow as Wake-Up — Edit passage, change text. Template vars documented in passage help text.

### Phased approach

- **Phase 1**: Create Adventure + Passages for BB_Intro, BB_ShowUp, BB_LearnMore, BB_Developmental_Q1, BB_Moves_*, signup. Use templates for Instance content. API: when `slug=bruised-banana`, prefer Passage over `getBruisedBananaNode()`.
- **Phase 2**: Migrate BB_ChooseNation, BB_ChoosePlaybook, BB_ChooseDomain — choices can be template or API-generated.
- **Phase 3**: Migrate BB_NationInfo_*, BB_PlaybookInfo_* — template `{{nation.description}}` etc., or keep API for these (they're fully dynamic per id).

## Reference

- Admin Adventures: [src/app/admin/adventures/page.tsx](../../src/app/admin/adventures/page.tsx)
- Campaign API (BB nodes): [src/app/api/adventures/[slug]/[nodeId]/route.ts](../../src/app/api/adventures/[slug]/[nodeId]/route.ts)
- Wake-Up seed: [scripts/seed-wake-up-adventure.ts](../../scripts/seed-wake-up-adventure.ts)
- Campaign page: [src/app/campaign/page.tsx](../../src/app/campaign/page.tsx)
- Event campaign editor: [.specify/specs/event-page-campaign-editor/spec.md](../event-page-campaign-editor/spec.md)
