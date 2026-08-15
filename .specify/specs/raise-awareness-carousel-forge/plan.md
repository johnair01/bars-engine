# Plan — Raise Awareness Carousel Forge

## Phase 1 — Bound the launch tool

1. Protect the admin route with the existing session and global `admin` /
   `steward` roles.
2. Keep all draft state in the client; no database or schema change.
3. Define the portable `Post` and `Slide` contract in the client renderer.

## Phase 2 — Build the frame

1. Create a native SVG 1080x1080 slide renderer so preview and PNG export
   share exactly the same source.
2. Implement palette interpolation and deterministic light-rain positions.
3. Implement per-slide order treatment: scattered bars, faded scratch marks,
   bracket ghost, grain, and mark focus.

## Phase 3 — Compose and compile

1. Provide paste/edit controls for series, channels, caption, slide text,
   grounding line, and slide type.
2. Add five-to-eight slide controls and preview navigation.
3. Serialize each rendered SVG to a canvas and download an individual PNG.

## Phase 4 — Verify

1. Type-check the new client/server component boundary.
2. Manually verify the protected route with an admin development session.
3. Verify preview and a downloaded slide are square and use current text.

## File impacts

- `src/app/admin/raise-awareness/page.tsx`: protected server route.
- `src/components/raise-awareness/CarouselComposer.tsx`: client editor,
  renderer, preview, and browser-only PNG compiler.
- `.specify/specs/raise-awareness-carousel-forge/*`: implementation authority.
