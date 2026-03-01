# Spec: Certification Quest CYOA Slides (Chunk Long Text)

## Purpose

Break long certification quest passage text into slides or chunks to minimize scrolling and reduce intimidation. Reported in cert-two-minute-ride-v1 STEP_1: "huge wall of text that people have to scroll to digest" — desired: "story broken down into slides that people can click through."

## User story

**As a tester**, I want long passage content to be presented in digestible slides I can click through, so I'm not overwhelmed by a wall of text.

**Acceptance**: Passages above a character threshold render as slide-by-slide content with next/prev controls instead of a single scrollable block.

## Functional requirements

- **FR1**: Define threshold (e.g. >500 chars) for when to use slide mode. ✅ Implemented in `slide-chunker.ts`.
- **FR2**: Slide mode: split content into chunks, show one at a time with "Next" / "Prev". ✅ Implemented in CampaignReader and PassageRenderer.
- **FR3**: Preserve links and formatting within slides. ✅ ReactMarkdown with link components.

## Implementation

- `src/lib/slide-chunker.ts`: `chunkIntoSlides()` splits by paragraphs or sentences when >500 chars.
- `CampaignReader`: Long campaign nodes (BB_Intro, BB_ShowUp, etc.) render as slides with Prev/Next.
- `PassageRenderer`: Long certification quest passages render as slides.

## Reference

- Feedback source: .feedback/cert_feedback.jsonl (cert-two-minute-ride-v1 STEP_1)
- PassageRenderer: [src/app/adventures/[id]/play/PassageRenderer.tsx](../../src/app/adventures/[id]/play/PassageRenderer.tsx)
