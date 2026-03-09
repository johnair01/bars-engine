# Plan: K-Space Librarian — Report to Library Skill Link

## Architecture

- **Skill content**: Define "report to the library" skill page or modal content (what to report, when, how).
- **Quest flow**: In STEP_3, when directing to a doc, also link to the skill; or make the skill the primary destination.
- **UI**: Skill could be a wiki page, a modal, or an inline guide in the quest passage.

## File impacts

| Action | Path |
|--------|------|
| Add/Modify | K-Space Librarian quest STEP_3 passage content |
| Add | "Report to Library" skill page or guide content |
| Modify | Quest passage links (skill first, request second) |

## Implementation notes

- Skill content may live in wiki or content; ensure it's linked from the quest.
- Consider: skill page → "Request from Library" button → modal. Not: quest → modal directly.
