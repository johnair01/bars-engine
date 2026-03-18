# Spec Kit Prompt: Template Library Game Master Placeholders

## Role

You are a Spec Kit agent implementing face-specific placeholder text for the Template Library. Certification feedback (cert-template-library-v1 STEP_2): "There wasn't any placeholder text when I generated text." Fix from the Game Master agents perspective: each passage slot gets guidance from the appropriate face (Shaman, Challenger, Diplomat, Regent, Architect).

## Objective

Extend `generateFromTemplate` so generated passages display visible, meaningful placeholder text that scaffolds admins and future Game Master agents. Slot-to-face mapping: context_* → Shaman, anomaly_* → Challenger, choice → Diplomat, response → Regent, artifact → Architect.

## Prompt (API-First)

> Implement per [.specify/specs/template-library-gm-placeholders/spec.md](../specs/template-library-gm-placeholders/spec.md). Add `getPlaceholderForSlot(nodeId)` in `src/lib/template-library/index.ts`; use it in `generateFromTemplate` instead of `[Edit: ${slot.nodeId}]`. No schema change.

## Requirements

- **Surfaces**: Passage text in generated Adventures (admin edit UI).
- **Mechanics**: Deterministic slot→face mapping; face-specific guidance string per passage.
- **Persistence**: None (Passage.text only).
- **API**: `generateFromTemplate` unchanged signature; internal implementation change.
- **Verification**: cert-template-library-v1 STEP_2 — tester sees placeholders when generating.

## Checklist

- [ ] `getPlaceholderForSlot(nodeId)` returns face-specific guidance
- [ ] `generateFromTemplate` uses it for each passage
- [ ] Run `npm run build` and `npm run check` — fail-fix
- [ ] Manual: generate from template; confirm placeholders visible

## Deliverables

- [ ] `src/lib/template-library/index.ts` — getPlaceholderForSlot + generateFromTemplate update
