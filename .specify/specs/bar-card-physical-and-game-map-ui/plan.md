# Plan: BAR Card Physical Feel + Attachments + Game Map UI

## Architecture

### BAR Card

- **BarCard** stays the canonical component. Add `reception` prop for animation.
- **BarCardData** extended with `attachments?: { url: string; kind: 'image' | 'file'; name?: string }[]` when BarMedia exists.
- **BarMedia** (new): `barId`, `blobUrl`, `kind`, `sortOrder`, `createdAt`. Vercel Blob for storage.

### Game Map

- **Game map page**: CSS changes only for Phase 3. No new components until WASD.
- **VirtualWASD**: Future component. Interface: `onMove(direction: 'up'|'down'|'left'|'right')`, `onSelect?()`.

### File Impact

| Phase | Files |
|-------|-------|
| 1 | `src/components/bar-card/BarCard.tsx`, `src/app/bars/[id]/page.tsx` |
| 2 | `prisma/schema.prisma`, `src/actions/bars.ts`, new `src/actions/bar-media.ts`, `src/app/bars/create/`, `src/app/api/bar-media/` |
| 3 | `src/app/game-map/page.tsx` |
| 4 | New `src/components/VirtualWASD.tsx`, `src/hooks/useKeyboardNav.ts` |
