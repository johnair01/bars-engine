# Teal-Level Backlog Merge Analysis

## Teal Lens (Laloux / Reinventing Organizations)

| Principle | Application to Spec Design |
|-----------|----------------------------|
| **Self-managing** | Specs as coherent wholes; avoid fragmentation. One spec owns one journey. |
| **Evolutionary purpose** | What serves the player's journey? Prioritize coherence and completion over feature count. |
| **Wholeness** | Game world + real world as one system. The Conclave IS the birthday party. |

---

## Merge Recommendations

| Backlog Item | Recommendation | Rationale |
|--------------|----------------|------------|
| **T** (Landing + Invitation Throughput) | **Mark superseded** | [fundraiser-landing-refactor](../fundraiser-landing-refactor/spec.md) is the T revision: event as primary, no moves grid. T's "4 moves + sign-up" is explicitly replaced. |
| **AG** (Lore CYOA Onboarding) | **Keep as-is** | Done. Source of truth for wiki, BB flow, personalization. |
| **2-Minute Ride (AH)** | **New spec** | Extends AG with story bridge + UX expansion. Distinct scope: coherence and abandonment reduction. |
| **Campaign BB flow fix** | **Merge into 2-Minute Ride** | `Instance.campaignRef` + default ref is the fix. Same user journey (Dashboard → BB flow). No separate spec. |
| **bruised-banana-onboarding-flow** | **Reference, don't merge** | Master flow spec. 2-Minute Ride adds Phase 3.1 (story bridge + UX). Flow spec stays as source of truth. |
| **AE** (Story/Quest Map Exploration) | **Keep separate** | Different scope: exploration UI, not onboarding. Link in "Future" if relevant. |
| **AD** (Avatar from CYOA) | **Keep separate** | Already depends on AG. Avatar is post-signup; 2-Minute Ride is pre-signup. |

---

## Teal Synthesis

### Wholeness

The 2-minute ride should feel like one journey — "invite → learn → choose → play → arrive." Fragmented specs (T vs fundraiser, campaignRef fix vs flow) create implementation drift. Merging campaignRef into 2-Minute Ride and marking T superseded reduces fragmentation.

### Evolutionary Purpose

The player's purpose is "get to the party" (Conclave). The story bridge makes that explicit. UX expansion (progress, vibeulon preview) reduces abandonment so more players complete the journey.

### Self-managing

One spec (AH) owns "make the 2-minute ride coherent and completable." Developers and testers have a single place to look.

---

## Dependency Graph (After Merge)

```
AG (Lore CYOA) [done]
    ├── AD (Avatar) [ready]
    └── AH (2-Minute Ride) [ready]
            └── campaignRef default
            └── story bridge
            └── progress + vibeulon preview

T [superseded by fundraiser-landing-refactor]
bruised-banana-onboarding-flow [master flow; reference only]
```

---

## Reference

- [BACKLOG.md](../../backlog/BACKLOG.md)
- [bruised-banana-onboarding-flow](../bruised-banana-onboarding-flow/spec.md)
- [fundraiser-landing-refactor](../fundraiser-landing-refactor/spec.md)
- [cyoa-invitation-throughput](../cyoa-invitation-throughput/spec.md) (T)
