---
description: Data model for vibeulons provenance tracking
---

# Vibeulons Provenance Schema

Tracking where vibes come from and where they go.

> *"Every vibeulon carries its story."*

---

## Core Principle

A vibeulon is not just a currency—it's a **narrative token**. It carries:
1. **Origin**: Which quest birthed it, who earned it, what move created it
2. **Journey**: Every quest it passed through, every hand that held it
3. **Generation**: How many hops from the original creation

---

## Prisma Schema (Proposed)

```prisma
model Vibeulon {
  id              String   @id @default(cuid())
  
  // Origin
  sourceQuestId   String
  sourceQuest     CustomBar @relation("VibulonSource", fields: [sourceQuestId], references: [id])
  
  sourcePlayerId  String
  sourcePlayer    Player   @relation("VibulonCreator", fields: [sourcePlayerId], references: [id])
  
  sourceMoveType  String   // THUNDERCLAP, NURTURE, COMMAND, etc.
  
  // Current State
  currentOwnerId  String
  currentOwner    Player   @relation("VibulonHolder", fields: [currentOwnerId], references: [id])
  
  generation      Int      @default(1)  // Hops from origin
  
  // Journey
  events          VibulonEvent[]
  
  createdAt       DateTime @default(now())
  
  @@map("vibeulons")
}

model VibulonEvent {
  id          String   @id @default(cuid())
  
  vibulonId   String
  vibulon     Vibeulon @relation(fields: [vibulonId], references: [id])
  
  questId     String?
  quest       CustomBar? @relation(fields: [questId], references: [id])
  
  playerId    String
  player      Player   @relation(fields: [playerId], references: [id])
  
  action      String   // earned | spent | transferred | multiplied | anchored
  moveType    String?  // Which move caused this event
  
  timestamp   DateTime @default(now())
  
  @@map("vibulon_events")
}
```

---

## Event Types

| Action | Description | Generation Change |
|--------|-------------|-------------------|
| `earned` | Created from quest completion | Sets to 1 |
| `spent` | Used to unlock/power something | No change |
| `transferred` | Given to another player | +1 |
| `multiplied` | Split into multiple vibeulons | Sets children to parent+1 |
| `anchored` | Permanently locked to a quest | No further changes |

---

## Move Type → Vibeulon Generation

Each archetype move generates vibeulons with different characteristics:

| Move | Trigram | Vibeulon Trait |
|------|---------|----------------|
| `⚡ THUNDERCLAP` | Thunder | High initial energy, decays fast |
| `🤝 NURTURE` | Earth | Multiplies when shared |
| `👁 COMMAND` | Heaven | Stable, long-lasting |
| `🎭 EXPRESS` | Lake | Spreads easily, light |
| `💧 INFILTRATE` | Water | Finds paths, bypasses blocks |
| `🔥 IGNITE` | Fire | Bright burst, attracts more |
| `🌬 PERMEATE` | Wind | Spreads gradually, wide reach |
| `⛰ IMMOVABLE` | Mountain | Can be anchored permanently |

---

## Provenance Display Component

```tsx
// VibeulonHistory.tsx
interface Props {
  vibeulon: Vibeulon & { events: VibulonEvent[] }
}

function VibeulonHistory({ vibeulon }: Props) {
  return (
    <div className="vibeulon-history">
      <h3>🌟 Vibeulon #{vibeulon.id.slice(-6)}</h3>
      <p>Generation: {vibeulon.generation}</p>
      
      <ul className="journey">
        {vibeulon.events.map(event => (
          <li key={event.id}>
            {getMoveEmoji(event.moveType)} {event.action} by {event.player.name}
            {event.quest && ` on "${event.quest.title}"`}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## Query Examples

### Most Traveled Vibeulons
```typescript
const traveled = await db.vibeulon.findMany({
  orderBy: { generation: 'desc' },
  take: 10,
  include: { events: true }
})
```

### Vibeulons I Created
```typescript
const myVibes = await db.vibeulon.findMany({
  where: { sourcePlayerId: currentPlayer.id },
  include: { events: true }
})
```

### Quest Lineage (What quests did this vibe touch?)
```typescript
const lineage = await db.vibulonEvent.findMany({
  where: { vibulonId },
  include: { quest: true },
  orderBy: { timestamp: 'asc' }
})
```

---

## Implementation Priority

| Priority | Feature |
|----------|---------|
| **P0** | Basic Vibeulon model (id, owner) |
| **P1** | Source tracking (quest, player, move) |
| **P2** | Events table (journey) |
| **P3** | Generation tracking |
| **P4** | Provenance display UI |
