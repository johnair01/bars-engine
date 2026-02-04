# B0: Repo Recon Notes

## Current Data Model (`prisma/schema.prisma`)
- **Player**: Auth + Identity combined (email, name, roles, stats).
- **Bar**: 
  - `CustomBar`: User-created bars.
  - `PlayerBar`: Instance of a bar assigned to a player.
- **Quest**: `Quest` (def) + `PlayerQuest` (instance). Logic handled in `src/actions/quest.ts`.

## Key Components & Paths
- **Auth/Entry**: 
  - `src/app/conclave/page.tsx` (Entry wizard)
  - `src/app/page.tsx` (Landing/Login)
  - `src/actions/auth.ts` (Form handlers)
- **Dashboard**:
  - `src/app/page.tsx` (Main dashboard logic)
  - `src/components/StarterQuestBoard.tsx` (Displays Active/Available/Completed bars)
- **Bar Activation**:
  - `src/actions/pick-up-bar.ts` (Moves bar from available to active)
- **Commission Flow**:
  - `src/components/CreateBarForm.tsx` (UI)
  - `src/actions/create-bar.ts` (Handler)

## State Logic
- Bar state changes happen via Server Actions (`src/actions/*`).
- `StarterQuestBoard` uses optimistic updates but relies on `router.refresh()` for sync.

## Behavior Locations
- **Login Check**: `src/lib/auth.ts` -> `getCurrentPlayer`
- **Bar Activation**: `src/actions/pick-up-bar.ts`
- **Commission Submit**: `src/actions/create-bar.ts`
