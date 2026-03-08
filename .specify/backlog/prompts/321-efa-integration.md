# Spec Kit Prompt: 321 EFA Integration

## Role

Integrate the 321 Shadow Process into the Emotional First Aid kit. Players who use 321 as first aid get a gold star vibeulon for completing the process, separate from the delta-based mint and the BAR creator mint.

## Objective

Implement per [.specify/specs/321-efa-integration/spec.md](../specs/321-efa-integration/spec.md). 321 becomes an EFA protocol; completing it always mints 1 vibeulon (gold star); delta mint unchanged; BAR creator mint unchanged.

## Requirements

- **321 as EFA tool**: Replace placeholder with `shadow-321`; render Shadow321Form when selected
- **Gold star mint**: When EFA session completes with 321 tool, mint 1 vibeulon (source: `shadow_321_completion`)
- **Shadow321Form EFA mode**: Accept `onComplete`, `embedded` props for use inside EFA flow
- **Post-321 prompt**: Create BAR / Import metadata / Skip — same as standalone

## Deliverables

- [ ] shadow-321 tool in emotional-first-aid lib
- [ ] EmotionalFirstAidKit branches to Shadow321Form for 321 tool
- [ ] Shadow321Form EFA mode (onComplete, embedded)
- [ ] Gold star mint in completeEmotionalFirstAidSession

## Reference

- Spec: [.specify/specs/321-efa-integration/spec.md](../specs/321-efa-integration/spec.md)
- Plan: [.specify/specs/321-efa-integration/plan.md](../specs/321-efa-integration/plan.md)
- Tasks: [.specify/specs/321-efa-integration/tasks.md](../specs/321-efa-integration/tasks.md)
- 321 Shadow Process: [.specify/specs/321-shadow-process/spec.md](../specs/321-shadow-process/spec.md)
