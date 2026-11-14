# Spec: Nook Threshold Navigation

## Purpose

Make the existing Nook doorway a small, legible travel threshold without enlarging the Nook or adding competing doors.

## Decision

After the first-minute orientation, approaching the doorway beside the Hope Mirror opens a destination sheet. The doorway remains the physical portal; the sheet names where it can lead.

## Destinations

- **Triangle Workshop** — always available, private, and returns to the Nook.
- **Shared rooms / The Between** — available from the player's existing room list and retains its current membership/invitation rules.

## Requirements

- The Nook stays the current size and retains one physical doorway.
- The doorway stays unavailable during the first-minute orientation.
- The doorway visually signals an available threshold after orientation, even with no shared room selected.
- The destination sheet has a clear Triangle Workshop entry and the existing shared-room list.
- The Triangle Workshop target is authenticated and only permits return to `/ontology-game/between`.
- Existing shared-room navigation continues to use the physical doorway animation.

## Out of Scope

- Full Triangle Workshop practice state, triangle persistence, rewards, or multiplayer dojo presence.
- A new Nook shell or Blender asset.

