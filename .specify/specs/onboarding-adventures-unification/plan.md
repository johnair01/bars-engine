# Plan: Onboarding Adventures Unification (Option C + D)

## Architecture

### Current state

```
Admin Adventures pane          Campaign page
       │                              │
       ▼                              ▼
db.adventure.findMany()    campaignRef? → startNodeId
       │                              │
       │  Wake-Up only                │  ref=bruised-banana → BB_Intro (getBruisedBananaNode)
       │                              │  no ref → Center_Witness (DB or file)
       ▼                              ▼
Adventure + Passage         /api/adventures/wake-up/[nodeId]?ref=...
       │                              │
       │                              └─ ref=bruised-banana → hardcoded API (no DB)
       └─ BB has no record
```

### Target state (Option C: Full migration + Option D: campaignRef)

1. **Schema**: Add `campaignRef` to `Adventure` (optional; e.g. `bruised-banana`).
2. **Adventure**: Create `bruised-banana` with `campaignRef: 'bruised-banana'`, status ACTIVE.
3. **Passages**: All BB nodes as Passages. Static nodes use template syntax: `{{instance.wakeUpContent}}`, `{{instance.showUpContent}}`, `{{instance.storyBridgeCopy}}`.
4. **API**: When request has `ref=bruised-banana` OR adventure has `campaignRef=bruised-banana`, load Passage by nodeId, resolve templates against Instance/Nation/Playbook, return node. Fallback to `getBruisedBananaNode()` during migration.
5. **Admin**: Edit Bruised Banana passages in Admin → Adventures → Edit, same as Wake-Up.
6. **Dynamic nodes**: BB_NationInfo_*, BB_PlaybookInfo_*, BB_ChooseNation, BB_ChoosePlaybook — Phase 1: keep in API. Phase 2: migrate to templates or hybrid.

### Template resolver

- Placeholders: `{{instance.wakeUpContent}}`, `{{instance.showUpContent}}`, `{{instance.storyBridgeCopy}}`
- Optional: `{{#if instance.storyBridgeCopy}}{{instance.storyBridgeCopy}}\n\n{{/if}}{{instance.wakeUpContent}}`
- Simple regex or a minimal mustache-like lib (e.g. `mustache` or custom `{{key.path}}` replacement).

### Phased implementation

| Phase | Scope | Deliverable |
|-------|-------|-------------|
| 1 | Schema + seed + BB_Intro, BB_ShowUp, BB_LearnMore, BB_Developmental_*, BB_Moves_*, signup | Adventure bruised-banana with Passages; API resolves templates for these nodes |
| 2 | BB_ChooseNation, BB_ChooseDomain, BB_SetNation_*, BB_SetDomain_* | Passages for choice/set nodes; choices may stay API-generated |
| 3 | BB_NationInfo_*, BB_PlaybookInfo_*, BB_ChoosePlaybook, BB_SetPlaybook_* | Full migration or hybrid (info nodes from API) |

## File impacts

| File | Change |
|------|--------|
| prisma/schema.prisma | Add `campaignRef String?` to Adventure |
| scripts/seed-bruised-banana-adventure.ts | New: create Adventure bruised-banana + Passages with templates |
| src/app/api/adventures/[slug]/[nodeId]/route.ts | When adventure.campaignRef=bruised-banana: load Passage, resolve templates, return. Else fallback to getBruisedBananaNode |
| src/lib/template-resolver.ts | New: resolve `{{instance.x}}` etc. |
| package.json | Add npm run seed:bruised-banana |
| admin/adventures/[id]/page.tsx | No special case; bruised-banana uses same passage edit flow |

## Verification

- Admin visits `/admin/adventures` → sees 2 rows: Wake-Up Campaign, Bruised Banana Campaign
- Admin edits Bruised Banana passage (e.g. BB_Intro) → change text → save
- Campaign `/campaign?ref=bruised-banana` shows updated content
