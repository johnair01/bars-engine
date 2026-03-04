# Plan: Cert Existing Players V1 Feedback

## Investigation

1. **Avatar**: Verify whether AW (avatar-visibility-and-cert-report-issue) is implemented. If not, implement FR1 from that spec: `autoCompleteQuestFromTwine` must call `processCompletionEffects` when the quest has `completionEffects`.
2. **Report redirect**: Trace Report Issue flow in cert-existing-players-character-v1: click Report Issue from STEP_4 → FEEDBACK passage → submit. Identify when/why navigation to dashboard occurs (submit handler, revalidatePath, auth redirect, or layout effect).
3. Reproduce: complete Build Your Character, observe avatar; click Report Issue from STEP_4, observe whether redirect occurs.

## File impacts

| Action | Path |
|--------|------|
| Modify | [src/actions/twine.ts](../../src/actions/twine.ts) — autoCompleteQuestFromTwine calls processCompletionEffects |
| Modify | [src/app/adventures/[id]/play/PassageRenderer.tsx](../../src/app/adventures/[id]/play/PassageRenderer.tsx) — if Report Issue redirect fix needed |
| Modify | [src/app/adventures/[id]/play/page.tsx](../../src/app/adventures/[id]/play/page.tsx) — if play page triggers redirect |

## Dependencies

- AV (Existing Players Character Generation) — provides Build Your Character quest
- L (Certification Quest UX) — provides Report Issue links and FEEDBACK passage
