# Cursor Spec: Walkable Sprite Pipeline Demo

## Entry Points
- src/lib/spatial-world/pixi-room.ts
- src/lib/spatial-world/spatial-room-session.ts
- src/lib/avatar-utils.ts

## Changes

### 1. Ensure sprite URL is passed
- Verify getWalkableSpriteUrl is used
- Pass into RoomRenderer

### 2. Player sprite rendering
- Use playerSpriteUrl if present
- Fallback to default

### 3. Add sprite asset
/public/sprites/walkable/argyra-bold-heart.png

### 4. Demo config
Hardcode player avatar config:
{ nationKey: "argyra", archetypeKey: "bold-heart" }

### 5. Direction updates
Call setPlayerDirection on WASD input

### 6. Fallback handling
If load fails → default sprite → rect fallback

## Done When
- Non-default sprite renders
- Direction works
- No regression in maps
