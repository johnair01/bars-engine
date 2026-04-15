# Spec: Dashboard Header Row + Play the Game Box

## Purpose

Fix the dashboard header layout so the player identity (avatar, name, email) and Vibeulon card sit in a single horizontal row with proper alignment. Add a labeled box around Explore, Character, and Campaign to create contrast and clarify the primary action area.

**Problem**: The Admin/player element and Vibeulon card are vertically offset rather than aligned in one row. The section buttons lack visual grouping and a clear label.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Header row | Single flex row: player identity (avatar + name + email) justified left; Vibeulon card justified right. Both aligned on same baseline. |
| Play the Game box | Wrap Explore, Character, Campaign in a bordered/background container with label "Play the Game" above the buttons. |
| Contrast | Box styling (border, subtle background) distinguishes the play area from the identity row. |

## Conceptual Model

```
┌─────────────────────────────────────────────────────────────────┐
│ [Avatar] Admin (God Mode)                    VIBEULONS           │
│          admin@admin.local                    37 ♦               │
└─────────────────────────────────────────────────────────────────┘

┌─ Play the Game ─────────────────────────────────────────────────┐
│  [ Explore ]  [ Character ]  [ Campaign ]                        │
└─────────────────────────────────────────────────────────────────┘
```

## User Stories

### P1: Single row alignment

**As a player**, I want my identity (avatar, name, email) and Vibeulon count in the same horizontal row, so the header feels cohesive and scannable.

**Acceptance**: One flex row; player identity left-aligned; Vibeulon card right-aligned; both share the same vertical center.

### P2: Play the Game box

**As a player**, I want Explore, Character, and Campaign grouped under a "Play the Game" label in a distinct box, so I know where to focus for primary actions.

**Acceptance**: Bordered/background container; "Play the Game" label visible; three buttons inside.

## Functional Requirements

### Phase 1: Header row

- **FR1**: Player identity (avatar, name, email) and Vibeulon card MUST be in a single flex row.
- **FR2**: Player identity MUST be left-aligned (`justify-start` or equivalent).
- **FR3**: Vibeulon card MUST be right-aligned (`justify-end` or `ml-auto`).
- **FR4**: Both elements MUST share the same vertical alignment (`items-center`).

### Phase 2: Play the Game box

- **FR5**: Create a container (border + optional background) around the Explore, Character, Campaign buttons.
- **FR6**: Add a label "Play the Game" above or as part of the container header.
- **FR7**: Preserve existing button behavior (open modals).

## Non-Functional Requirements

- Mobile: row may stack on small viewports; Play the Game box remains usable.
- No new API contracts.

## Dependencies

- [dashboard-section-modal-buttons](.specify/specs/dashboard-section-modal-buttons/spec.md)
- src/app/page.tsx, DashboardSectionButtons

## References

- [src/app/page.tsx](../../../src/app/page.tsx) — header layout
- [src/components/dashboard/DashboardSectionButtons.tsx](../../../src/components/dashboard/DashboardSectionButtons.tsx)
