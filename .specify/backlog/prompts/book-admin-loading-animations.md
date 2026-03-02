# Spec Kit Prompt: Book Admin — Loading Animations

## Role

Add loading/analyzing animations to the admin Books flow so users see clear visual feedback during long-running operations.

## Objective

Implement per [.specify/specs/book-admin-loading-animations/spec.md](../specs/book-admin-loading-animations/spec.md). Add inline spinners to Extract Text, Trigger Analysis, Analyze More, Publish, and Upload PDF buttons when they are in a loading state.

## Requirements

- **FR1–FR5**: Each button shows a spinner (Tailwind `animate-spin`) next to loading text when in progress.
- **Pattern**: Use `w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin` inline with text.
- **Layout**: Buttons use `inline-flex items-center gap-2` so spinner and text align.

## Deliverables

- [ ] BookList.tsx: spinner on Extract Text, Trigger Analysis, Analyze More, Publish
- [ ] BookUploadForm.tsx: spinner on Upload PDF
- [ ] Manual test: trigger each action, confirm spinner appears during loading

## Reference

- Spec: [.specify/specs/book-admin-loading-animations/spec.md](../specs/book-admin-loading-animations/spec.md)
- Plan: [.specify/specs/book-admin-loading-animations/plan.md](../specs/book-admin-loading-animations/plan.md)
