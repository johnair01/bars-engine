# Spec Kit Prompt: Onboarding Adventures Unification (Option C + D)

## Role

You are a Spec Kit agent implementing the full migration of Bruised Banana to Adventure + Passage with templates, so admins can edit onboarding pages via Admin Adventures. This is the shipping blocker for new users.

## Objective

The Admin Adventures pane shows only Wake-Up. Bruised Banana has no Adventure record — its nodes are hardcoded in the API. **Chosen approach: Option C (full migration) + Option D (campaignRef)** so admins can edit BB pages like Wake-Up.

**Goal**: Admin tools able to edit Bruised Banana pages → unblock shipping to new users.

## Requirements

1. **Schema**: Add `campaignRef String?` to Adventure. When `campaignRef=bruised-banana`, campaign page/API use this Adventure.
2. **Seed**: Create Adventure `bruised-banana` with Passages for BB nodes. Use template syntax: `{{instance.wakeUpContent}}`, `{{instance.showUpContent}}`, `{{instance.storyBridgeCopy}}`.
3. **Template resolver**: New lib to resolve `{{...}}` placeholders against Instance (and optionally Nation/Playbook).
4. **API**: When `slug=bruised-banana` (or ref=bruised-banana), load Passage by nodeId, resolve templates, return. Fallback to `getBruisedBananaNode()` for dynamic nodes (BB_NationInfo_*, etc.) during Phase 1.
5. **Campaign page**: Pass `adventureSlug=bruised-banana` when `campaignRef=bruised-banana` so API fetches from correct Adventure.

## Phased deliverables

- [ ] **Phase 1**: Schema + template resolver + seed (BB_Intro, BB_ShowUp, BB_LearnMore, BB_Developmental_*, BB_Moves_*, signup) + API prefers Passages
- [ ] **Phase 2** (optional): Migrate BB_ChooseNation, BB_ChoosePlaybook, BB_ChooseDomain, BB_NationInfo_*, BB_PlaybookInfo_*

## Verification

- [ ] Admin sees 2 adventures in `/admin/adventures`
- [ ] Admin edits Bruised Banana passage → save → `/campaign?ref=bruised-banana` shows updated content
- [ ] Campaign flows work unchanged

## Reference

- Spec: [.specify/specs/onboarding-adventures-unification/spec.md](../specs/onboarding-adventures-unification/spec.md)
- Plan: [.specify/specs/onboarding-adventures-unification/plan.md](../specs/onboarding-adventures-unification/plan.md)
- Tasks: [.specify/specs/onboarding-adventures-unification/tasks.md](../specs/onboarding-adventures-unification/tasks.md)
- Admin Adventures page: [src/app/admin/adventures/page.tsx](../src/app/admin/adventures/page.tsx)
- BB API: [src/app/api/adventures/[slug]/[nodeId]/route.ts](../src/app/api/adventures/[slug]/[nodeId]/route.ts)
- Event campaign editor: [.specify/specs/event-page-campaign-editor/spec.md](../.specify/specs/event-page-campaign-editor/spec.md)
