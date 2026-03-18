# INV-4: Forger Notification (Quest Wallet)

## User Story

**As a player who forged an invitation**, I want to see a status update in my Quest Wallet when my invitee signs up and completes their first step, so that I experience the invitation as a completed ritual act rather than a message sent into the void.

## Acceptance Criteria

- When invitee creates their character, forger's Quest Wallet shows a "Your invitation was accepted by [name]" event
- Notification persists; does not require the forger to be online

## Implementation (No Notification System Required)

Uses existing data: `Invite` where `forgerId = playerId` and `status = 'used'`, with `players` (invitees). Quest Wallet (/hand) displays an "Invitations Accepted" section derived from this. No new schema, no push/email notifications.

## Source

GAP_ANALYSIS.md — canonical user story INV-4.
