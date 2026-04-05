# Spec: Charge → Quest Generator v0

## Purpose

Convert charge capture BARs into structured quest opportunities. Analyze a charge BAR and propose 3–4 quests aligned with Wake Up, Clean Up, Grow Up, Show Up.

**Core principle**: Charge is raw narrative energy. The generator proposes possible transformations; it does not force action.

## Dependencies

- [Charge Capture UX + Micro-Interaction](../../../docs/architecture/charge-capture-ux-micro-interaction.md)
- [Charge Capture API](../../../docs/architecture/charge-capture-api.md)
- [Charge → Quest Generator](../../../docs/architecture/charge-quest-generator.md)
- [Charge → Quest Generator API](../../../docs/architecture/charge-quest-generator-api.md)
- CustomBar (sourceBarId for BAR → quest linking)
- Transformation Move Registry (WcgsStage)
- Nation/Archetype (nations.ts, Playbook)

## Deliverables

1. **Documentation** (done):
   - docs/architecture/charge-quest-generator.md
   - docs/architecture/charge-quest-generator-api.md
   - docs/examples/charge-quest-generator-example.md

2. **Implementation** (done):
   - generateQuestSuggestionsFromCharge(barId)
   - createQuestFromSuggestion(barId, suggestionIndex)
   - getQuestSuggestions(barId) — cached
   - linkBarToQuest(questId, barId)
   - Quest template library (research_exploration, reflection_process, skill_practice, event_hosting, conversation_invitation, collaboration_invitation)
   - Nation/archetype influence logic

3. **Integration**: Charge Capture "Explore" flow calls generator; dashboard "Turn into quest" uses createQuestFromSuggestion.

## Testing Requirements

- Quest suggestions generated (3–4)
- Emotion channel influences suggestions
- Nation/archetype overlays applied
- Templates populated correctly
- BAR linking preserved (sourceBarId)
- Deterministic when possible

## Constraints

- Template-based generation
- Explainable suggestions
- No opaque LLM scoring
- User consent for quest creation

## Future

- **Charge Pattern Recognition Engine v0**: Detect patterns (multiple people, similar charge) → suggest shared quests, campaign formation, collective events.
