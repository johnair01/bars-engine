-- The migrations stopped tracking prisma/schema.prisma after 2026-03, so this table,
-- its columns, indexes and foreign keys reached deployed databases only through
-- `prisma db push`. Generated with `prisma migrate diff --from-url <migrated db>
-- --to-schema-datamodel prisma/schema.prisma --script` and filtered to additive,
-- idempotent statements, so a database that already has them from `db push` is
-- unchanged.

CREATE TABLE IF NOT EXISTS "next_action_bridges" ( "id" TEXT NOT NULL, "questId" TEXT NOT NULL, "barId" TEXT, "nextAction" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "next_action_bridges_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "forge_sessions" ( "id" TEXT NOT NULL, "adminId" TEXT NOT NULL, "stage" TEXT NOT NULL, "partDescription" TEXT, "triggerContext" TEXT, "observedPattern" TEXT, "desiredExperience" TEXT, "desiredSatisfaction" TEXT, "currentGameState" TEXT, "currentDissatisfaction" TEXT, "underlyingBelief" TEXT, "sabotageBelief" TEXT, "firstPersonVoice" TEXT, "reclaimedIntent" TEXT, "alignedStep" TEXT, "mintedValues" TEXT DEFAULT '[]', "mintedConstraints" TEXT DEFAULT '[]', "frictionStart" INTEGER, "frictionEnd" INTEGER, "frictionDelta" INTEGER, "vibeulonMinted" BOOLEAN NOT NULL DEFAULT false, "outputType" TEXT, "routingTargetType" TEXT, "routingTargetId" TEXT, "allocationWeight" INTEGER, "agentSpecId" TEXT, "agentPatchId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3), CONSTRAINT "forge_sessions_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "agent_specs" ( "id" TEXT NOT NULL, "name" TEXT NOT NULL, "nationOrientation" TEXT, "distortionSignature" TEXT, "coreValues" TEXT NOT NULL DEFAULT '[]', "constraints" TEXT NOT NULL DEFAULT '[]', "beliefContext" TEXT, "sabotageSignature" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "agent_specs_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "agent_patches" ( "id" TEXT NOT NULL, "targetAgentId" TEXT NOT NULL, "addValues" TEXT NOT NULL DEFAULT '[]', "addConstraints" TEXT NOT NULL DEFAULT '[]', "updateDistortionSignature" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "agent_patches_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "daemon_summons" ( "id" TEXT NOT NULL, "daemonId" TEXT NOT NULL, "playerId" TEXT NOT NULL, "summonedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "expiresAt" TIMESTAMP(3) NOT NULL, "status" TEXT NOT NULL DEFAULT 'active', CONSTRAINT "daemon_summons_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "daemon_move_creations" ( "id" TEXT NOT NULL, "daemonId" TEXT NOT NULL, "rawEmbodyText" TEXT NOT NULL, "rawWitnessText" TEXT NOT NULL, "rawActionText" TEXT NOT NULL, "channel" TEXT, "moveId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "daemon_move_creations_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "blessed_objects_earned" ( "id" TEXT NOT NULL, "playerId" TEXT NOT NULL, "source" TEXT NOT NULL, "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "instanceId" TEXT, "kotterStage" INTEGER, "questId" TEXT, "metadata" JSONB, CONSTRAINT "blessed_objects_earned_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "quest_proposals" ( "id" TEXT NOT NULL, "barId" TEXT NOT NULL, "campaignRef" TEXT, "playerId" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL, "domain" TEXT, "questType" TEXT, "completionConditions" TEXT NOT NULL DEFAULT '[]', "emotionalAlchemy" TEXT NOT NULL DEFAULT '{}', "reviewStatus" TEXT NOT NULL DEFAULT 'pending', "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0, "publishedQuestId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "quest_proposals_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "bar_responses" ( "id" TEXT NOT NULL, "barId" TEXT NOT NULL, "responderId" TEXT NOT NULL, "responseType" TEXT NOT NULL, "intent" TEXT, "raciRole" TEXT, "parentResponseId" TEXT, "depth" INTEGER NOT NULL DEFAULT 0, "message" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "bar_responses_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "book_analysis_resume_logs" ( "id" TEXT NOT NULL, "adminId" TEXT NOT NULL, "bookId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "book_analysis_resume_logs_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "verification_completion_logs" ( "id" TEXT NOT NULL, "questId" TEXT NOT NULL, "playerId" TEXT NOT NULL, "backlogPromptPath" TEXT NOT NULL, "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "syncedAt" TIMESTAMP(3), CONSTRAINT "verification_completion_logs_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "player_move_equips" ( "id" TEXT NOT NULL, "playerId" TEXT NOT NULL, "slotIndex" INTEGER NOT NULL, "moveId" TEXT NOT NULL, "equippedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "player_move_equips_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "move_uses" ( "id" TEXT NOT NULL, "playerId" TEXT NOT NULL, "moveId" TEXT NOT NULL, "periodKey" TEXT NOT NULL, "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "questId" TEXT, CONSTRAINT "move_uses_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "bar_bindings" ( "id" TEXT NOT NULL, "cardId" TEXT NOT NULL, "barId" TEXT NOT NULL, "authorActorId" TEXT NOT NULL, "instanceId" TEXT, "status" TEXT NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "bar_bindings_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "scene_atlas_guided_drafts" ( "id" TEXT NOT NULL, "playerId" TEXT NOT NULL, "cardId" TEXT NOT NULL, "instanceId" TEXT NOT NULL, "payload" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "scene_atlas_guided_drafts_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "actor_deck_states" ( "id" TEXT NOT NULL, "actorId" TEXT NOT NULL, "instanceId" TEXT NOT NULL, "deckCardIds" TEXT NOT NULL DEFAULT '[]', "handCardIds" TEXT NOT NULL DEFAULT '[]', "discardCardIds" TEXT NOT NULL DEFAULT '[]', "lastDrawAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "actor_deck_states_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "campaign_playbooks" ( "id" TEXT NOT NULL, "instanceId" TEXT NOT NULL, "origin" TEXT NOT NULL DEFAULT '', "vision" TEXT NOT NULL DEFAULT '', "people" TEXT NOT NULL DEFAULT '', "invitations" TEXT NOT NULL DEFAULT '', "timeline" TEXT NOT NULL DEFAULT '', "kotterStages" JSONB NOT NULL DEFAULT '{}', "domainStrategy" JSONB NOT NULL DEFAULT '{}', "raciRoles" TEXT NOT NULL DEFAULT '', "recentUpdates" TEXT NOT NULL DEFAULT '', "generatedSummary" TEXT NOT NULL DEFAULT '', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "campaign_playbooks_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "event_campaigns" ( "id" TEXT NOT NULL, "campaignContext" TEXT NOT NULL, "topic" TEXT NOT NULL, "primaryDomain" TEXT NOT NULL, "productionGrammar" TEXT NOT NULL, "campaignType" TEXT NOT NULL DEFAULT 'event_production', "hostActorIds" TEXT NOT NULL DEFAULT '[]', "targetArchetypes" TEXT NOT NULL DEFAULT '[]', "targetMoves" TEXT NOT NULL DEFAULT '[]', "developmentalLens" TEXT, "status" TEXT NOT NULL DEFAULT 'proposed', "linkedEventIds" TEXT NOT NULL DEFAULT '[]', "instanceId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "event_campaigns_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "event_participants" ( "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "participantId" TEXT NOT NULL, "participantState" TEXT NOT NULL, "functionalRole" TEXT, "raciRole" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "event_invites" ( "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "actorId" TEXT NOT NULL, "invitedByActorId" TEXT NOT NULL, "inviteStatus" TEXT NOT NULL DEFAULT 'pending', "inviteSource" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "event_invites_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "gameboard_slots" ( "id" TEXT NOT NULL, "instanceId" TEXT NOT NULL, "campaignRef" TEXT NOT NULL, "period" INTEGER NOT NULL, "slotIndex" INTEGER NOT NULL, "hexagramId" INTEGER, "moveType" TEXT, "questId" TEXT, "drawnAt" TIMESTAMP(3), "stewardId" TEXT, "wakeUpAt" TIMESTAMP(3), "cleanUpAt" TIMESTAMP(3), "cleanUpReflection" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "gameboard_slots_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "gameboard_bids" ( "id" TEXT NOT NULL, "slotId" TEXT NOT NULL, "bidderId" TEXT NOT NULL, "amount" INTEGER NOT NULL, "status" TEXT NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "gameboard_bids_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "gameboard_aid_offers" ( "id" TEXT NOT NULL, "slotId" TEXT NOT NULL, "stewardId" TEXT NOT NULL, "offererId" TEXT NOT NULL, "message" TEXT NOT NULL, "type" TEXT NOT NULL DEFAULT 'direct', "linkedQuestId" TEXT, "status" TEXT NOT NULL DEFAULT 'pending', "expiresAt" TIMESTAMP(3), "forkedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "gameboard_aid_offers_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "bounty_stakes" ( "id" TEXT NOT NULL, "barId" TEXT NOT NULL, "vibulonId" TEXT NOT NULL, "playerId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "bounty_stakes_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "redemption_packs" ( "id" TEXT NOT NULL, "instanceId" TEXT NOT NULL, "playerId" TEXT NOT NULL, "donationId" TEXT, "packType" TEXT NOT NULL DEFAULT 'donation', "status" TEXT NOT NULL DEFAULT 'unredeemed', "vibeulonAmount" INTEGER NOT NULL, "metadata" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "redeemedAt" TIMESTAMP(3), CONSTRAINT "redemption_packs_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "gm_face_modifiers" ( "id" TEXT NOT NULL, "face" TEXT NOT NULL, "anomalyStyle" TEXT NOT NULL, "contactVoice" TEXT NOT NULL, "interpretationPressure" TEXT NOT NULL, "responseStyle" TEXT NOT NULL, "artifactAffinity" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "gm_face_modifiers_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "quest_adventure_links" ( "id" TEXT NOT NULL, "questId" TEXT NOT NULL, "adventureId" TEXT NOT NULL, "moveType" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "quest_adventure_links_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "cma_generator_drafts" ( "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "sourceBarId" TEXT, "templateId" TEXT, "campaignId" TEXT, "instanceId" TEXT, "emotionalCharge" TEXT, "gmId" TEXT, "status" TEXT NOT NULL DEFAULT 'draft', "rationale" TEXT, "graphJson" TEXT NOT NULL, "submittedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "cma_generator_drafts_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "passages" ( "id" TEXT NOT NULL, "adventureId" TEXT NOT NULL, "nodeId" TEXT NOT NULL, "text" TEXT NOT NULL, "choices" TEXT NOT NULL DEFAULT '[]', "linkedQuestId" TEXT, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "passages_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "player_adventure_progress" ( "id" TEXT NOT NULL, "playerId" TEXT NOT NULL, "adventureId" TEXT NOT NULL, "currentNodeId" TEXT, "stateData" TEXT NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "player_adventure_progress_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "library_requests" ( "id" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdById" TEXT NOT NULL, "instanceId" TEXT, "requestText" TEXT NOT NULL, "requestType" TEXT NOT NULL DEFAULT 'other', "privacy" TEXT NOT NULL DEFAULT 'anonymized', "contextJson" TEXT, "status" TEXT NOT NULL DEFAULT 'new', "resolvedDocNodeId" TEXT, "spawnedBacklogItemId" TEXT, "spawnedDocQuestId" TEXT, CONSTRAINT "library_requests_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "doc_nodes" ( "id" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, "nodeType" TEXT NOT NULL DEFAULT 'handbook', "title" TEXT NOT NULL, "slug" TEXT NOT NULL, "scope" TEXT NOT NULL DEFAULT 'experimental', "versionMin" TEXT, "versionMax" TEXT, "buildHash" TEXT, "tags" TEXT NOT NULL DEFAULT '[]', "bodyRst" TEXT, "bodySource" TEXT NOT NULL DEFAULT 'curated', "canonicalStatus" TEXT NOT NULL DEFAULT 'draft', "mergedIntoDocNodeId" TEXT, "provenanceJson" TEXT, CONSTRAINT "doc_nodes_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "doc_evidence_links" ( "id" TEXT NOT NULL, "docNodeId" TEXT NOT NULL, "customBarId" TEXT, "questId" TEXT, "playerQuestId" TEXT, "kind" TEXT NOT NULL DEFAULT 'observation', "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0, "confidence" DOUBLE PRECISION, CONSTRAINT "doc_evidence_links_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "schisms" ( "id" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "domain" TEXT NOT NULL DEFAULT 'other', "status" TEXT NOT NULL DEFAULT 'open', "conflictingDocNodeIds" TEXT NOT NULL DEFAULT '[]', "conflictingClaimsJson" TEXT, "evidenceBundleJson" TEXT, "resolutionDocNodeId" TEXT, CONSTRAINT "schisms_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "ai_response_cache" ( "id" TEXT NOT NULL, "inputHash" TEXT NOT NULL, "feature" TEXT NOT NULL, "model" TEXT NOT NULL, "outputJson" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "expiresAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ai_response_cache_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "alchemy_scene_events" ( "id" TEXT NOT NULL, "playerId" TEXT NOT NULL, "templateId" TEXT NOT NULL, "choiceKey" TEXT, "outcome" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "alchemy_scene_events_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "growth_scenes" ( "id" TEXT NOT NULL, "playerId" TEXT NOT NULL, "vector" TEXT NOT NULL, "templateId" TEXT NOT NULL, "sceneDsl" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'active', "choiceMade" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "resolvedAt" TIMESTAMP(3), CONSTRAINT "growth_scenes_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "growth_scene_artifacts" ( "id" TEXT NOT NULL, "sceneId" TEXT NOT NULL, "type" TEXT NOT NULL, "payload" TEXT NOT NULL, "emittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "growth_scene_artifacts_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "threshold_encounters" ( "id" TEXT NOT NULL, "playerId" TEXT NOT NULL, "vector" TEXT NOT NULL, "sceneType" TEXT NOT NULL, "gmFace" TEXT NOT NULL DEFAULT 'shaman', "hexagramId" INTEGER, "nationSlug" TEXT, "archetypeSlug" TEXT, "beatMode" TEXT NOT NULL DEFAULT 'canonical', "tweeSource" TEXT NOT NULL, "storyData" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'draft', "completedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "threshold_encounters_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "threshold_encounter_artifacts" ( "id" TEXT NOT NULL, "encounterId" TEXT NOT NULL, "type" TEXT NOT NULL, "payload" TEXT NOT NULL, "promoted" BOOLEAN NOT NULL DEFAULT false, "promotedAt" TIMESTAMP(3), "emittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "threshold_encounter_artifacts_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "npc_constitution_versions" ( "id" TEXT NOT NULL, "npcId" TEXT NOT NULL, "version" TEXT NOT NULL, "snapshot" TEXT NOT NULL, "changedBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "npc_constitution_versions_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "npc_memories" ( "id" TEXT NOT NULL, "npcId" TEXT NOT NULL, "playerId" TEXT, "campaignId" TEXT, "memoryType" TEXT NOT NULL, "summary" TEXT NOT NULL, "tags" TEXT NOT NULL DEFAULT '[]', "isCanon" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "npc_memories_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "npc_reflections" ( "id" TEXT NOT NULL, "npcId" TEXT NOT NULL, "campaignId" TEXT, "inputSummary" TEXT NOT NULL, "outputs" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'pending', "reviewedBy" TEXT, "reviewedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "npc_reflections_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "npc_actions" ( "id" TEXT NOT NULL, "npcId" TEXT NOT NULL, "sceneId" TEXT, "verb" TEXT NOT NULL, "payload" TEXT NOT NULL, "requiresRegentApproval" BOOLEAN NOT NULL DEFAULT false, "status" TEXT NOT NULL DEFAULT 'executed', "reason" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "npc_actions_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "npc_relationship_states" ( "id" TEXT NOT NULL, "npcId" TEXT NOT NULL, "playerId" TEXT NOT NULL, "campaignId" TEXT, "trust" INTEGER NOT NULL DEFAULT 0, "tension" INTEGER NOT NULL DEFAULT 0, "state" TEXT NOT NULL DEFAULT '{}', "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "npc_relationship_states_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "player_map_presences" ( "id" TEXT NOT NULL, "player_id" TEXT NOT NULL, "map_id" TEXT NOT NULL, "room_index" INTEGER NOT NULL, "x" INTEGER NOT NULL, "y" INTEGER NOT NULL, "direction" TEXT NOT NULL DEFAULT 'south', "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "player_map_presences_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "profile_spatial_maps" ( "id" TEXT NOT NULL, "player_id" TEXT NOT NULL, "name" TEXT NOT NULL DEFAULT 'Personal Space', "spawnpoint" TEXT NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "profile_spatial_maps_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "profile_map_rooms" ( "id" TEXT NOT NULL, "map_id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "tilemap" TEXT NOT NULL, "room_type" TEXT NOT NULL, "background_url" TEXT, "sort_order" INTEGER NOT NULL DEFAULT 0, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "profile_map_rooms_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "profile_map_anchors" ( "id" TEXT NOT NULL, "room_id" TEXT NOT NULL, "anchor_type" TEXT NOT NULL, "tile_x" INTEGER NOT NULL, "tile_y" INTEGER NOT NULL, "label" TEXT, "linked_id" TEXT, "linked_type" TEXT, "config" TEXT, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "profile_map_anchors_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "SpriteAuditLog" ( "id" TEXT NOT NULL, "playerId" TEXT NOT NULL, "pipeline" TEXT NOT NULL, "nationKey" TEXT NOT NULL, "archetypeKey" TEXT NOT NULL, "status" TEXT NOT NULL, "attempt" INTEGER NOT NULL DEFAULT 1, "promptUsed" TEXT, "sourceModel" TEXT, "reviewNote" TEXT, "lpcBaseAsset" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "SpriteAuditLog_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "npc_profiles" ( "id" TEXT NOT NULL, "playerId" TEXT NOT NULL, "constitutionId" TEXT, "altitude" TEXT NOT NULL, "tier" INTEGER NOT NULL DEFAULT 1, "weeklyBudget" INTEGER NOT NULL DEFAULT 10000, "tokensUsed" INTEGER NOT NULL DEFAULT 0, "budgetResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "dormantUntil" TIMESTAMP(3), "sourceInstanceId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "npc_profiles_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "trade_transactions" ( "id" TEXT NOT NULL, "initiator_id" TEXT NOT NULL, "agent_id" TEXT NOT NULL, "offered_bar_id" TEXT NOT NULL, "received_bar_id" TEXT NOT NULL, "room_id" TEXT NOT NULL, "room_slug" TEXT NOT NULL, "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "trade_transactions_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "starter_bars" ( "id" TEXT NOT NULL, "player_id" TEXT NOT NULL, "room_id" TEXT NOT NULL, "room_slug" TEXT NOT NULL, "bar_id" TEXT NOT NULL, "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "starter_bars_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "milestone_contributions" ( "id" TEXT NOT NULL, "milestoneId" TEXT NOT NULL, "playerId" TEXT NOT NULL, "barId" TEXT, "donationRef" TEXT, "value" DOUBLE PRECISION NOT NULL, "note" TEXT, "contributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "milestone_contributions_pkey" PRIMARY KEY ("id") );

CREATE TABLE IF NOT EXISTS "wiki_drafts" ( "id" TEXT NOT NULL, "artifactId" TEXT NOT NULL, "artifactType" TEXT NOT NULL, "title" TEXT NOT NULL, "summary" TEXT NOT NULL, "provenanceExplanation" TEXT NOT NULL, "relationshipDocumentation" TEXT NOT NULL, "usageExamples" TEXT NOT NULL, "metadata" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'pending', "reviewNotes" TEXT, "reviewedBy" TEXT, "reviewedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "wiki_drafts_pkey" PRIMARY KEY ("id") );
