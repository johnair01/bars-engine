# Plan: Cert Quest Grammar Runtime Error

## Approach

### FR1: Strip telemetryHooks for client

**Option A**: Return serializable packet from compileQuestWithAI. Omit telemetryHooks when passing to client.

```ts
// In compileQuestWithAI, before return:
const { telemetryHooks, ...serializable } = packet
return { packet: serializable }
```

**Option B**: Make telemetryHooks optional in QuestPacket for admin preview. GenerationFlow only needs nodes, signature, startNodeId for display. publishQuestPacketToPassages does not use telemetryHooks.

**Chosen**: Option A — strip in compileQuestWithAI and in handleContinue (Compile & Preview) path. The client never needs telemetryHooks for admin preview.

### FR2: Report Issue

Cert quest opens in TwineQuestModal. Check if skipRevalidate / sessionStorage fixes from cert-existing-players-v1 apply. May need to pass threadId or ensure modal doesn't revalidate on FEEDBACK.

### FR3: Page layout

Quest Grammar page: add `mx-auto` or center the content container. Current: `max-w-2xl` with `ml-0 sm:ml-64`. May need `mx-auto` when sidebar is present, or adjust container.

## File impacts

| File | Change |
|------|--------|
| src/actions/quest-grammar.ts | compileQuestWithAI: return packet without telemetryHooks |
| src/app/admin/quest-grammar/GenerationFlow.tsx | handleContinue: strip telemetryHooks from packet before setPreview |
| src/app/admin/quest-grammar/page.tsx | Center content (mx-auto or similar) |
| TwineQuestModal / advanceRun | Verify Report Issue fix if cert uses modal |
