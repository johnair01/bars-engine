# UI Style Guide

Design principles for the BARS Engine interface. Applies to dashboard, modals, lists, and user-generated content surfaces.

## Core Principle: Uncluttered by Default

**Keep the UI uncluttered, even when user-generated content is abundant.**

- User-generated content (quests, journeys, BARs, threads) can grow quickly and overwhelm the dashboard.
- The interface should remain calm and scannable regardless of content volume.
- Prefer progressive disclosure: show summaries and counts; let users expand to see detail.
- Collapsible sections, accordions, and "show more" patterns are preferred over always-visible long lists.

## Dashboard

- **Active Quests** and **Journeys** sections should be collapsible. Default state: collapsed when the player has many items; expanded when few.
- Section headers show a count badge (e.g., "Active Quests (5)") so users know what's inside without expanding.
- Collapsed state preserves a one-line summary or teaser when helpful.
- Graveyard and other secondary sections follow the same pattern when they grow large.

## Lists and Feeds

- Long lists use virtualization or pagination when appropriate.
- Avoid infinite scroll for dense, action-oriented content; prefer "Load more" or collapsible groups.
- User-generated titles and descriptions should truncate with expand-on-hover or expand-on-click when they exceed a reasonable length.

## Modals and Overlays

- Modals should not cascade; one modal at a time.
- Dense content inside modals should use tabs, accordions, or step wizards rather than a single long scroll.

## References

- [Voice Style Guide](/wiki/voice-style-guide) — Narrative and copy tone
- [Avatar Sprite Style Guide](.specify/specs/avatar-sprite-quality-process/STYLE_GUIDE.md) — Sprite assets
