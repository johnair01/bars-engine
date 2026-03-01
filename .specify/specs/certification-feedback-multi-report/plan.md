# Plan: Certification Feedback Multi-Report

## Architecture

The fix is localized to `PassageRenderer.tsx`. Two mechanisms:

1. **Reset on new source step**: When `feedbackSourceStep` changes, the user has navigated to FEEDBACK from a different step → treat as a fresh visit, reset `feedbackSubmitted`.
2. **Report another issue**: In the thank-you UI, add a button that resets form state in-place.

## File impacts

| Action | Path |
|--------|------|
| Modify | `src/app/adventures/[id]/play/PassageRenderer.tsx` |

## Implementation notes

- Use `useEffect` to reset `feedbackSubmitted` when `feedbackSourceStep` changes (and we're on FEEDBACK).
- Add "Report another issue" button in the thank-you block; onClick: `setFeedbackSubmitted(false); setFeedbackText(''); setError(null)`.
- No changes to play page, certification-feedback action, or seed script.
