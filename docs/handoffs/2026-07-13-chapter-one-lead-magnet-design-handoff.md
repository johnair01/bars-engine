# Claude Design Handoff: Chapter 1 Lead Magnet

Date: 2026-07-13
Project: Mastering the Game of Allyship
Artifact: Chapter 1 lead magnet
App route: `/mastering-allyship/chapter-1`
Temporary delivery route: `/mastering-allyship/chapter-1/read`
Final delivery target: replace the temporary route link with a polished PDF or final in-app reader once exported.

## Goal

Design Chapter 1 as a polished, trust-building sample that makes allyship feel like a learnable practice. The reader should finish with a clear sense that the full book gives the map, the Allyship Deck gives the next move, and the Dojo/cohort path gives live practice.

The artifact must feel like the beginning of a book, not a generic lead magnet worksheet.

## Layout Direction

- Format as a short book chapter sample with a cover/title page, chapter opener, body sections, one reflection/practice page, and a final next-step page.
- Keep the first page visually quiet and confident: title, subtitle, author, small Mastering Allyship mark, and one strong threshold image.
- Use wide-enough margins for a print/PDF feel; avoid cramped web spacing.
- Preserve a clear reading rhythm: short paragraphs, generous leading, and section breaks that feel like breaths.
- End with a practical bridge: read the full book, add the $22 Allyship Deck, join the Dojo/live practice path, or continue in BARs Engine.

## Typography

- Body: warm serif, readable at PDF scale, approximately 10.5-12 pt with generous line height.
- Headings: restrained sans or small-cap treatment; do not make it feel like a sales page.
- Pull quotes: one or two per chapter max, set as quiet emphasis, not decorative noise.
- Practice prompt: visually distinct from body prose, using a bordered or shaded field that can survive grayscale printing.

## Page Rhythm

- Page 1: cover/title.
- Page 2: chapter opener, "The Call to Play."
- Pages 3-N: main chapter copy with section breaks every 600-900 words.
- Near end: one "Make your first move" reflection prompt.
- Final page: next steps and links.

## Visuals Needed

- One threshold/call-to-play hero image for the opener.
- One small diagram or visual metaphor showing the funnel of practice:
  Chapter 1 -> Book -> Deck -> Dojo/cohort -> BARs Engine practice.
- Optional small spot illustration for the reflection prompt.
- Avoid stock-photo vagueness. The visuals should point to actual practice, choice, threshold, conversation, or game pieces.

## Export Requirements

- Primary export: web-optimized PDF suitable for email delivery and browser reading.
- Target app path for a checked-in static V1 PDF, if used: `public/chapter-one.pdf`.
- If using the app reader instead of a PDF, preserve the current canonical route: `/mastering-allyship/chapter-1/read`.
- Final artifact must not require authentication.

## App Wiring Notes

- The app currently captures leads in `FunnelSignup` with source `mastering-allyship-chapter-1`.
- V1 delivery uses Resend through `sendChapterOneEmail`.
- Until `public/chapter-one.pdf` exists, email and post-submit CTAs must point to `/mastering-allyship/chapter-1/read`.
- Once the PDF is exported, update the shared Chapter 1 lead constant so the form and email switch together.

## Acceptance Check

The chapter succeeds when a new reader can say:

- "I understand allyship as a practice, not a personality badge."
- "I know the book is the map."
- "I know the deck gives me a concrete move."
- "I know the Dojo/cohort is where practice becomes social."
- "I know what I can do next today."
