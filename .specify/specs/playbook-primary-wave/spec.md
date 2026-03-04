# Playbook Primary WAVE Spec

## Summary

Add `primaryWaveStage` to Playbook so choice privileging can favor moves that match the player's archetype. Enables nation/playbook choice privileging in CYOA quests (CE).

## Implementation (Done)

- **Schema**: `Playbook.primaryWaveStage` (String?, values: wakeUp | cleanUp | growUp | showUp)
- **Seed**: All 8 playbooks populated (Heaven/Earth/Thunder/Wind→showUp, Water→cleanUp, Fire→wakeUp, Mountain/Lake→showUp)
- **Lookup**: `getPlaybookPrimaryWave(playbookId): Promise<PersonalMoveType>` — async DB lookup, fallback `'showUp'`
- **Integration**: `buildQuestPromptContext` awaits lookup when `targetPlaybookId` present

## Reference

- [playbook-primary-wave-spec prompt](../../backlog/prompts/playbook-primary-wave-spec.md)
- [nation-playbook-choice-privileging plan](nation-playbook-choice-privileging/plan.md)
