# Spec: NPC Agent Game Loop Simulation

## Purpose

Simulate the full game loop for AI agents (NPCs): sign in → pick quest → complete → mint vibeulons. API-first; no UI required for v1. Agents appear as Players; reuse existing completeQuestForPlayer.

## Conceptual Model

- **WHO**: Agent = Player record (creatorType: 'agent' or isAgent when schema supports)
- **WHAT**: Game loop: pick quest, complete, mint
- **WHERE**: Market, threads, gameboard
- **Energy**: Vibeulons minted on completion
- **Personal throughput**: completeQuestForPlayer(agentPlayerId, ...)

## API Contracts

### pickQuestForAgent

```ts
interface PickQuestOptions {
  threadId?: string
  campaignRef?: string
  source?: 'thread' | 'market' | 'gameboard'
}

function pickQuestForAgent(
  playerId: string,
  options?: PickQuestOptions
): Promise<{ questId: string; threadId?: string; inputs?: Record<string, string> } | { error: string }>
```

### simulateAgentGameLoop

```ts
interface SimulationReport {
  iterations: number
  completed: number
  failed: number
  vibeulonsEarned: number
  errors: string[]
}

function simulateAgentGameLoop(
  playerId: string,
  iterations?: number
): Promise<SimulationReport>
```

## Functional Requirements

- **FR1**: pickQuestForAgent returns a quest the agent can complete (from threads with progress, or market).
- **FR2**: simulateAgentGameLoop runs N iterations: pick → completeQuestForPlayer → repeat.
- **FR3**: Agents use existing Player records; completeQuestForPlayer(playerId, ...) works for any playerId.
- **FR4**: Schema: optional creatorType or isAgent on Player (deferred; agents work as regular players for v1).

## Reference

- [sustainability-onboarding-lore](../sustainability-onboarding-lore/spec.md) — AI agents as NPCs
- [completeQuestForPlayer](../../src/actions/quest-engine.ts)
- [getPlayerThreads](../../src/actions/quest-thread.ts), [getMarketQuests](../../src/actions/market.ts)
