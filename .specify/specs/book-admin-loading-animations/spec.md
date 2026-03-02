# Spec: Book Admin — Loading Animations

## Purpose

Add visible loading/analyzing animations to the admin Books flow so users know long-running operations (upload, extract, analyze, publish) are in progress and can wait patiently instead of wondering if the feature is working.

## Problem

- **Extract Text**: Can take 10–30+ seconds for large PDFs; button shows "Extracting..." with no visual feedback.
- **Trigger Analysis**: Takes ~2–3 minutes (15 chunks, 6s delay between batches); button shows "Analyzing..." with no animation.
- **Analyze More**: Same duration as Trigger Analysis; "Analyzing..." text only.
- **Publish**: Creates thread from quests; "Publishing..." text only.
- **Upload PDF**: "Uploading..." text; typically faster but still benefits from feedback.

Users may think the app is stuck or broken when operations take minutes.

## User story

**As an admin**, I want clear visual feedback when running book operations (extract, analyze, publish), so I know the process is working and can wait without refreshing or re-clicking.

**Acceptance**: Each long-running action shows a spinner or animation alongside the loading text; users can distinguish "in progress" from "stuck."

## Functional requirements

- **FR1**: Extract Text button MUST show a spinner or animation when `extractingId` is set.
- **FR2**: Trigger Analysis button MUST show a spinner or animation when `analyzingId` is set.
- **FR3**: Analyze More button MUST show a spinner or animation when `analyzingMoreId` is set.
- **FR4**: Publish button MUST show a spinner or animation when `publishingId` is set.
- **FR5**: Upload PDF button MUST show a spinner or animation when `isPending` is true.
- **FR6**: Animation MUST be inline with the button text (e.g. spinner before/after "Analyzing...").

## Non-functional requirements

- Use existing Tailwind utilities (`animate-spin`, `animate-pulse`) or minimal custom CSS; no heavy dependencies.
- Animation should be subtle but visible; consistent with app dark theme (zinc/purple/blue accents).

## Out of scope

- Progress percentage or ETA (would require server-sent events or polling).
- Full-page overlay for analysis (keep inline with buttons).

## Reference

- [src/app/admin/books/BookList.tsx](../../src/app/admin/books/BookList.tsx)
- [src/app/admin/books/BookUploadForm.tsx](../../src/app/admin/books/BookUploadForm.tsx)
- Existing patterns: `animate-spin` in [AlchemyCaster.tsx](../../src/components/AlchemyCaster.tsx), [PassageRenderer.tsx](../../src/app/adventures/[id]/play/PassageRenderer.tsx)
