---
description: Sandbox mode — single-player version of bars-engine; Minecraft creative mode equivalent
---

# Sandbox Mode

Sandbox mode is the **single-player version of bars-engine**. It is not a reduced version of the game — it is the game played alone, with the full depth of the system available.

Analogy: Minecraft creative mode. Full access to all tools. No multiplayer required. Stakes are internal.

## What sandbox enables

- Player can run 3-2-1 shadow work on their own daemon without a GM present
- Player can generate quests, complete them, and receive moves — all solo
- Charge captures still count; BARs still accumulate; vibeulons still mint
- The daily check-in + emotional alchemy routing works in full
- No campaign required; no invitation required

## What sandbox lacks (by design)

- Shared gameboard — there is no collective map in single-player mode
- Rumor ecology — rumors have no one to spread to; the connective tissue of collaborative play is absent
- Role assignment — Roles are relational artifacts; they require other players
- Witnessed moves — Face moves that depend on an audience (Diplomat's "offer connection") have no receiver

## Entering sandbox

A player enters sandbox by default if they have no active campaign invitations. The invitation is the threshold crossing from sandbox to multiplayer. In Holacracy terms: the invitation is the first Governance move — a Role being filled by a new member.

## Inviting others in

When a player in sandbox mode forges an invitation, they are converting from single-player to multiplayer. This is a **narrative event** in the game — the moment the hermit decides to build something with others. The Invitation BAR is the artifact of that threshold crossing.

## Sandbox and Sandbox Isolation (Wikipedia-derived concept)

From the Wikipedia governance analysis: the Sandbox is explicitly a low-stakes experimentation space. Players in sandbox mode should feel free to try mechanics they don't fully understand yet. The game should be explicitly permissive here: "This is the safe space to break things and see what happens."

A sandbox character is marked by the absence of a `campaignId` on their active quests. The UI can make this explicit: "You are in creative mode. Your moves are yours alone."

## Implementation notes

- No schema migration needed for phase 1 — sandbox is the absence of a campaign
- A `PlayerMode` field on Player (`sandbox | campaign`) could make this explicit in phase 2
- The hand mechanics are identical in both modes; the campaign board is the only absent surface
- Sandbox characters should see a "Forge your first invitation" CTA prominently when they have completed at least one BAR cycle
