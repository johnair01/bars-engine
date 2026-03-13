# Tasks: Agent ↔ Admin Wiring

## Phase 1: Agent Client + IChingContext on Backend

- [ ] Add `iching_context` field to `AgentDeps` (optional dict with hexagramId, trigrams, tone, text, activeFace, kotterStage, nationName)
- [ ] Architect agent: inject IChingContext into system prompt (hexagram tone informs quest imagery; activeFace selects Game Master lens; kotterStage scopes quest difficulty)
- [ ] Define `QuestCompilation` output type (node_text, overview, twee_source, emotional_alchemy_tag, confidence, reasoning)
- [ ] Add `ArchitectCompileRequest` schema (unpacking_answers, emotional_signature, iching_context, player_id, instance_id)
- [ ] Add `POST /api/agents/architect/compile` endpoint
- [ ] Test: compile with IChingContext produces hexagram-aligned quest prose
- [ ] Test: compile without IChingContext still works (backward compat)
- [ ] Test: deterministic fallback when no API key

## Phase 2: Server Action Routing (Architect)

- [ ] Create `src/lib/agent-client.ts` with typed fetch helpers (`postAgent<Req, Res>(path, body)`)
- [ ] Add `NEXT_PUBLIC_BACKEND_URL` to `.env.example` and document
- [ ] Modify `compileQuestNodeText()` in quest-grammar.ts: try agent → direct OpenAI → deterministic
- [ ] Modify `compileDepthPassage()`: route through agent with Game Master face context
- [ ] Modify `compileQuestOverview()`: route through agent
- [ ] Verify cache layer still works (same input hash → skip agent call)
- [ ] Integration test: quest grammar compilation end-to-end through agent
- [ ] Verify Makefile `up` starts both backend and frontend with correct env vars

## Phase 3: Fan Out to Other Agents

- [ ] Diplomat: `POST /api/agents/diplomat/bridge` for storyteller bridge generation
- [ ] Sage: route quest bridge crystallization through `POST /api/agents/sage/consult`
- [ ] Architect: `POST /api/agents/architect/analyze-chunk` for book analysis chunks
- [ ] Diplomat: `POST /api/agents/diplomat/refine-copy` for campaign copy improvement
- [ ] Shaman: `POST /api/agents/shaman/identify` for nation/archetype taxonomy extraction
- [ ] Update `src/actions/book-analyze.ts` to route through Architect agent
- [ ] Update `src/actions/copy-improvement.ts` to route through Diplomat agent
- [ ] Update `src/actions/extract-321-taxonomy.ts` to route through Shaman agent
- [ ] Test each routing with three-tier fallback

## Phase 4: Admin Agent Insights

- [ ] Add `agentMetadata String?` to CustomBar in `prisma/schema.prisma`
- [ ] Add `agent_metadata` column to CustomBar in `backend/app/models/quest.py`
- [ ] Run `npm run db:sync` to push schema
- [ ] Store agent response metadata when quest is created via agent (agent name, deterministic flag, confidence, reasoning)
- [ ] Create `AgentInsightsPanel` component for `/admin/quests/[id]`
- [ ] Show provenance badge in admin quest list (Architect / Deterministic / Direct AI)
- [ ] Display: agent name, WAVE move, legibility note, token usage, generative deps

## Phase 5: I Ching Learning Infrastructure

- [ ] Add `HexagramEncounterLog` model to Prisma schema (agentName, hexagramId, upperTrigram, lowerTrigram, isHomeTrigram, trigramPosition, interpretationSummary, archetypesInvolved, questOutcome, emotionalAlchemyTag)
- [ ] Add `AgentInterpretiveProfile` model to Prisma schema (agentName, hexagramId optional, profileText, encounterCount, lastSynthesizedAt)
- [ ] Mirror both models in SQLAlchemy (`backend/app/models/knowledge.py`)
- [ ] Run `npm run db:sync` to push schema
- [ ] Extend agent response handling: after every agent call with IChingContext, log a `HexagramEncounterLog` entry
- [ ] Compute `isHomeTrigram` and `trigramPosition` using `FACE_TRIGRAM` mapping at log time
- [ ] Agent self-interpretation: extract a short "what this hexagram meant for this quest" from the agent's response (inline or one extra call)
- [ ] System prompt augmentation: before each agent call, query last N encounters for this agent (optionally filtered by hexagram) and inject as "Your I Ching Journal" section
- [ ] Home trigram awareness: when agent's trigram appears in the hexagram, add a resonance/tension note to the prompt
- [ ] Test: encounter logging works for Architect with IChingContext
- [ ] Test: system prompt includes encounter history on subsequent calls
- [ ] Test: home trigram detection correct for all six agents

## Phase 6: Sage Orchestration

- [ ] Define multi-agent compilation trigger (cross-domain quest, multiple WAVE stages)
- [ ] Wire Sage as orchestrator: consult Architect → Shaman → Challenger → synthesize
- [ ] Sage uses its own encounter history to decide which agents to consult per hexagram
- [ ] Add "Sage Review" button to admin quest editor
- [ ] Test: Sage orchestration produces richer output than single-agent

## Phase 7: Admin I Ching Learning Dashboard

- [ ] Create encounter log viewer per agent (filterable by hexagram, trigram, date range)
- [ ] Pattern visualization: hexagram frequency + quality distribution per agent
- [ ] Interpretive profile viewer/editor: admin can view, annotate, or reset agent profiles
- [ ] Emergence timeline: show how agent's interpretation of a hexagram shifts over time
- [ ] Admin-triggered profile synthesis: button to ask an agent to review its encounter log and update its profile
- [ ] Periodic synthesis job: scheduled task that synthesizes profiles for all agents
