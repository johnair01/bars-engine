# Prompt: Admin Onboarding Graph View

**Use this prompt when implementing the graph view for the admin onboarding template.**

## Prompt text

> Implement the Admin Onboarding Graph View per [.specify/specs/admin-onboarding-graph-view/spec.md](../specs/admin-onboarding-graph-view/spec.md). Replace linear display with graph: choice nodes show branches (e.g. The Invitation → Aligned, Curious, Skeptical) and convergence. Add "Play draft" and "View API" links. Deterministic from flow API; no new API. Run `npm run build` and `npm run check`.

## Checklist

- [ ] buildFlowGraph derives ChoiceGroup (parent + branches + convergence) from flow
- [ ] LinearNode and ChoiceGroup render with indentation for branches
- [ ] Play draft and View API links in header
- [ ] npm run build and npm run check pass

## Reference

- Spec: [.specify/specs/admin-onboarding-graph-view/spec.md](../specs/admin-onboarding-graph-view/spec.md)
- Plan: [.specify/specs/admin-onboarding-graph-view/plan.md](../specs/admin-onboarding-graph-view/plan.md)
