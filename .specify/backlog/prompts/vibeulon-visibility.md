# Spec Kit Prompt: Vibeulon Visibility (Movement Feed)

## Role

You are a Spec Kit agent implementing the movement feed that shows "who earned what, for what."

## Objective

Surface a movement feed on the dashboard and wallet so players see Energy (vibeulons) flowing through the space. Each feed item shows: player name, amount earned, and source (quest title or transfer).

## Requirements

- **Surfaces**: Dashboard (`/`), Wallet (`/wallet`)
- **Data**: VibulonEvent where amount > 0; include player, resolve quest title from questId or notes
- **Component**: MovementFeed — compact list, scrollable
- **Performance**: Limit 15–20 items; batch fetch quests by questId

## Deliverables

- [x] getMovementFeed() in src/actions/economy.ts
- [x] MovementFeed component
- [x] Feed on dashboard and wallet
- [ ] Verification: Complete quest, confirm feed shows event

## Reference

- Spec: [.specify/specs/vibeulon-visibility/spec.md](../specs/vibeulon-visibility/spec.md)
- Plan: [.specify/specs/vibeulon-visibility/plan.md](../specs/vibeulon-visibility/plan.md)
- Tasks: [.specify/specs/vibeulon-visibility/tasks.md](../specs/vibeulon-visibility/tasks.md)
