# Plan: Quest Grammar Cert Feedback

## Investigation

1. **Report Issue redirect**: Cert quest opens in TwineQuestModal. FEEDBACK passage support was added; verify cert-quest-grammar-v1 uses same flow. Check if 4–5 second revert is revalidation, session check, or modal-specific.
2. **Unpacking form**: Audit UnpackingForm—which questions suit dropdowns vs short text? Define dropdown options per question. Apply mobile-first, CYOA layout.
3. **Node quality**: Trace compileQuest text generation; identify where templating produces nonsense. Design AI prompt that takes unpacking answers + aligned action → coherent node text while preserving beat structure.

## File impacts

| Action | Path |
|--------|------|
| Modify | [src/components/TwineQuestModal.tsx](../../src/components/TwineQuestModal.tsx) — if Report Issue fix needed for cert flow |
| Modify | [src/app/admin/quest-grammar/UnpackingForm.tsx](../../src/app/admin/quest-grammar/UnpackingForm.tsx) — dropdowns, short responses, mobile-first |
| Modify | [src/lib/quest-grammar/compileQuest.ts](../../src/lib/quest-grammar/compileQuest.ts) — AI prompt integration for node text |
| Create | Optional: `src/lib/quest-grammar/generateNodeText.ts` — AI prompt for node text |

## Dependencies

- BY (Quest Grammar Compiler)
- L (Certification Quest UX)
- cert-feedback-stability, cert-existing-players-v1-feedback (Report Issue fixes)
