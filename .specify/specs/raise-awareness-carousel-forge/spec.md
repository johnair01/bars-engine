# Raise Awareness Carousel Forge

## Purpose

Provide authenticated MTGOA campaign stewards with a fast, private way to turn
approved teaching copy into a branded Instagram carousel. The tool makes the
Emotional Alchemy movement visible through a quiet colour transition and a
chaos-to-order texture transition; it does not claim that a post completes a
person's transformation.

## MVP boundary

- Route: `/admin/raise-awareness`.
- Access: signed-in global admins and global stewards only. No public route.
- Input: a steward pastes and edits already-approved text. The MVP does not
  generate copy, call an AI model, save drafts, schedule posts, or publish.
- Output: live in-app carousel preview and one downloaded 1080x1080 PNG per
  slide.
- Slide count: five to eight, with six supplied by the starter draft.

## Content contract

```ts
type Channel = 'fire' | 'water' | 'wood' | 'metal' | 'earth'
type TextRun = {
  text: string
  bold?: boolean
  italic?: boolean
  color?: 'ink' | 'accent' | 'ember' | 'teal' | 'jade' | 'silver' | 'ochre' | 'liminal'
}
type Slide = {
  kind: 'hook' | 'body' | 'steps' | 'cta'
  runs: TextRun[]
  ground?: string
  alignment: 'left' | 'center'
  fontRole: 'display' | 'body' | 'mono'
  scale: 'compact' | 'standard' | 'large'
}
type Post = {
  series: string
  from: Channel
  to: Channel
  caption: string
  slides: Slide[]
}
```

The editor keeps the paste-and-edit workflow light: each slide starts with one
text run and can be split into styled runs as needed. `steps` continues to use
newline-separated text within a run. This preserves the visual and editorial
structure without introducing a freeform canvas or raw HTML editor.

## Requirements

1. The composer must render an on-screen square preview with slide navigation,
   count, caption context, and one selected slide at a time.
2. It must allow a steward to edit the series label, transition channels,
   caption, slide type, slide copy, and grounding line.
3. It must add and remove slides while enforcing a five-to-eight slide limit.
4. The visual frame must use a dark-indigo ground, MTGOA type families, the
   selected channel palette, light-rain, corner brackets, grain, and a mark.
5. Slide progress `i / (N - 1)` must interpolate the channel palette and
   resolve the visual texture from chaos to book-cover order. Same-channel
   transitions must still resolve through that order axis.
6. Slide media must not expose channel names, move names, or lattice labels.
   A neutral series tag is the only label in the media.
7. The tool must provide a download action for the selected slide and an
   action to download every slide as individual PNG files.
8. Text needs a legible in-image hierarchy and all essential content must
   remain available as editable caption/copy, rather than colour alone.
9. Stewards must be able to compose a slide from structured text runs, choosing
   bold, italic, and a constrained MTGOA/Emotional Alchemy colour per run.
10. Stewards must be able to select left or centre alignment, an existing MTGOA
    type role (display, body, mono), and a compact/standard/large scale per slide.
11. A steward can restore the full starter draft after experimenting, and can
    select a word or phrase in a text field before applying emphasis; the editor
    may split that selection into text runs internally.

## Acceptance criteria

- An admin or steward can open the route; an unauthenticated or ordinary
  player is redirected away.
- A six-slide starter post visibly resolves from disorder to order and from
  `from` to `to` palette.
- A five- or eight-slide draft reaches fully ordered texture on its last slide.
- Downloaded images are 1080x1080 PNGs and use the current editor values.
- Rich-text emphasis and slide typography choices render identically in the
  preview and downloaded PNGs.
- Emphasis retains the default display weight while making the selected phrase
  visibly larger; it does not require a steward to create a separate text run.
- No data leaves the browser during composition or download.

## Non-goals

- AI copy generation, campaign/card provenance, draft persistence, image
  uploads, social API publishing, scheduling, bulk ZIP packaging, and
  campaign-specific steward membership checks.

## Future seam

The `Post` object is intentionally portable. A later campaign-aware version
can add campaign/card provenance, approval metadata, saved drafts, and a
reviewed copy-generation action without changing the renderer contract.
