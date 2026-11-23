-- The migrations stopped tracking prisma/schema.prisma after 2026-03, so this table,
-- its columns, indexes and foreign keys reached deployed databases only through
-- `prisma db push`. Generated with `prisma migrate diff --from-url <migrated db>
-- --to-schema-datamodel prisma/schema.prisma --script` and filtered to additive,
-- idempotent statements, so a database that already has them from `db push` is
-- unchanged.

CREATE UNIQUE INDEX IF NOT EXISTS "next_action_bridges_questId_key" ON "next_action_bridges"("questId");

CREATE INDEX IF NOT EXISTS "next_action_bridges_questId_idx" ON "next_action_bridges"("questId");

CREATE INDEX IF NOT EXISTS "forge_sessions_adminId_idx" ON "forge_sessions"("adminId");

CREATE INDEX IF NOT EXISTS "forge_sessions_stage_idx" ON "forge_sessions"("stage");

CREATE INDEX IF NOT EXISTS "daemon_summons_daemonId_idx" ON "daemon_summons"("daemonId");

CREATE INDEX IF NOT EXISTS "daemon_summons_playerId_idx" ON "daemon_summons"("playerId");

CREATE INDEX IF NOT EXISTS "daemon_summons_status_expiresAt_idx" ON "daemon_summons"("status", "expiresAt");

CREATE INDEX IF NOT EXISTS "daemon_move_creations_daemonId_idx" ON "daemon_move_creations"("daemonId");

CREATE INDEX IF NOT EXISTS "daemon_move_creations_moveId_idx" ON "daemon_move_creations"("moveId");

CREATE INDEX IF NOT EXISTS "blessed_objects_earned_playerId_idx" ON "blessed_objects_earned"("playerId");

CREATE INDEX IF NOT EXISTS "blessed_objects_earned_playerId_source_instanceId_kotterSta_idx" ON "blessed_objects_earned"("playerId", "source", "instanceId", "kotterStage");

CREATE INDEX IF NOT EXISTS "quest_proposals_barId_idx" ON "quest_proposals"("barId");

CREATE INDEX IF NOT EXISTS "quest_proposals_reviewStatus_idx" ON "quest_proposals"("reviewStatus");

CREATE INDEX IF NOT EXISTS "quest_proposals_campaignRef_reviewStatus_idx" ON "quest_proposals"("campaignRef", "reviewStatus");

CREATE INDEX IF NOT EXISTS "bar_responses_barId_idx" ON "bar_responses"("barId");

CREATE INDEX IF NOT EXISTS "bar_responses_responderId_idx" ON "bar_responses"("responderId");

CREATE INDEX IF NOT EXISTS "bar_responses_parentResponseId_idx" ON "bar_responses"("parentResponseId");

CREATE UNIQUE INDEX IF NOT EXISTS "bar_responses_barId_responderId_key" ON "bar_responses"("barId", "responderId");

CREATE INDEX IF NOT EXISTS "book_analysis_resume_logs_adminId_createdAt_idx" ON "book_analysis_resume_logs"("adminId", "createdAt");

CREATE INDEX IF NOT EXISTS "verification_completion_logs_syncedAt_idx" ON "verification_completion_logs"("syncedAt");

CREATE INDEX IF NOT EXISTS "player_move_equips_playerId_idx" ON "player_move_equips"("playerId");

CREATE UNIQUE INDEX IF NOT EXISTS "player_move_equips_playerId_slotIndex_key" ON "player_move_equips"("playerId", "slotIndex");

CREATE UNIQUE INDEX IF NOT EXISTS "player_move_equips_playerId_moveId_key" ON "player_move_equips"("playerId", "moveId");

CREATE INDEX IF NOT EXISTS "move_uses_playerId_moveId_periodKey_idx" ON "move_uses"("playerId", "moveId", "periodKey");

CREATE INDEX IF NOT EXISTS "bar_bindings_cardId_idx" ON "bar_bindings"("cardId");

CREATE INDEX IF NOT EXISTS "bar_bindings_barId_idx" ON "bar_bindings"("barId");

CREATE INDEX IF NOT EXISTS "scene_atlas_guided_drafts_playerId_instanceId_idx" ON "scene_atlas_guided_drafts"("playerId", "instanceId");

CREATE UNIQUE INDEX IF NOT EXISTS "scene_atlas_guided_drafts_playerId_cardId_key" ON "scene_atlas_guided_drafts"("playerId", "cardId");

CREATE INDEX IF NOT EXISTS "actor_deck_states_actorId_idx" ON "actor_deck_states"("actorId");

CREATE INDEX IF NOT EXISTS "actor_deck_states_instanceId_idx" ON "actor_deck_states"("instanceId");

CREATE UNIQUE INDEX IF NOT EXISTS "actor_deck_states_actorId_instanceId_key" ON "actor_deck_states"("actorId", "instanceId");

CREATE UNIQUE INDEX IF NOT EXISTS "campaign_playbooks_instanceId_key" ON "campaign_playbooks"("instanceId");

CREATE INDEX IF NOT EXISTS "event_campaigns_instanceId_idx" ON "event_campaigns"("instanceId");

CREATE INDEX IF NOT EXISTS "event_campaigns_status_idx" ON "event_campaigns"("status");

CREATE INDEX IF NOT EXISTS "event_participants_participantId_idx" ON "event_participants"("participantId");

CREATE UNIQUE INDEX IF NOT EXISTS "event_participants_eventId_participantId_key" ON "event_participants"("eventId", "participantId");

CREATE INDEX IF NOT EXISTS "event_invites_actorId_idx" ON "event_invites"("actorId");

CREATE UNIQUE INDEX IF NOT EXISTS "event_invites_eventId_actorId_key" ON "event_invites"("eventId", "actorId");

CREATE INDEX IF NOT EXISTS "gameboard_slots_instanceId_campaignRef_period_moveType_idx" ON "gameboard_slots"("instanceId", "campaignRef", "period", "moveType");

CREATE INDEX IF NOT EXISTS "gameboard_slots_instanceId_campaignRef_period_idx" ON "gameboard_slots"("instanceId", "campaignRef", "period");

CREATE UNIQUE INDEX IF NOT EXISTS "gameboard_slots_instanceId_campaignRef_period_slotIndex_key" ON "gameboard_slots"("instanceId", "campaignRef", "period", "slotIndex");

CREATE INDEX IF NOT EXISTS "gameboard_bids_slotId_status_idx" ON "gameboard_bids"("slotId", "status");

CREATE INDEX IF NOT EXISTS "gameboard_bids_bidderId_idx" ON "gameboard_bids"("bidderId");

CREATE INDEX IF NOT EXISTS "gameboard_aid_offers_slotId_idx" ON "gameboard_aid_offers"("slotId");

CREATE INDEX IF NOT EXISTS "gameboard_aid_offers_stewardId_status_idx" ON "gameboard_aid_offers"("stewardId", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "bounty_stakes_vibulonId_key" ON "bounty_stakes"("vibulonId");

CREATE INDEX IF NOT EXISTS "bounty_stakes_barId_idx" ON "bounty_stakes"("barId");

CREATE INDEX IF NOT EXISTS "redemption_packs_playerId_status_idx" ON "redemption_packs"("playerId", "status");

CREATE INDEX IF NOT EXISTS "redemption_packs_instanceId_packType_idx" ON "redemption_packs"("instanceId", "packType");

CREATE UNIQUE INDEX IF NOT EXISTS "gm_face_modifiers_face_key" ON "gm_face_modifiers"("face");

CREATE INDEX IF NOT EXISTS "quest_adventure_links_questId_idx" ON "quest_adventure_links"("questId");

CREATE INDEX IF NOT EXISTS "quest_adventure_links_adventureId_idx" ON "quest_adventure_links"("adventureId");

CREATE UNIQUE INDEX IF NOT EXISTS "quest_adventure_links_questId_moveType_key" ON "quest_adventure_links"("questId", "moveType");

CREATE INDEX IF NOT EXISTS "cma_generator_drafts_userId_idx" ON "cma_generator_drafts"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "passages_adventureId_nodeId_key" ON "passages"("adventureId", "nodeId");

CREATE UNIQUE INDEX IF NOT EXISTS "player_adventure_progress_playerId_adventureId_key" ON "player_adventure_progress"("playerId", "adventureId");

CREATE UNIQUE INDEX IF NOT EXISTS "library_requests_spawnedBacklogItemId_key" ON "library_requests"("spawnedBacklogItemId");

CREATE UNIQUE INDEX IF NOT EXISTS "library_requests_spawnedDocQuestId_key" ON "library_requests"("spawnedDocQuestId");

CREATE INDEX IF NOT EXISTS "library_requests_status_createdAt_idx" ON "library_requests"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "library_requests_instanceId_createdAt_idx" ON "library_requests"("instanceId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "doc_nodes_slug_key" ON "doc_nodes"("slug");

CREATE INDEX IF NOT EXISTS "doc_nodes_canonicalStatus_scope_idx" ON "doc_nodes"("canonicalStatus", "scope");

CREATE INDEX IF NOT EXISTS "doc_nodes_slug_idx" ON "doc_nodes"("slug");

CREATE INDEX IF NOT EXISTS "doc_evidence_links_docNodeId_idx" ON "doc_evidence_links"("docNodeId");

CREATE INDEX IF NOT EXISTS "ai_response_cache_expiresAt_idx" ON "ai_response_cache"("expiresAt");

CREATE UNIQUE INDEX IF NOT EXISTS "ai_response_cache_inputHash_feature_key" ON "ai_response_cache"("inputHash", "feature");

CREATE INDEX IF NOT EXISTS "alchemy_scene_events_playerId_idx" ON "alchemy_scene_events"("playerId");

CREATE INDEX IF NOT EXISTS "growth_scenes_playerId_status_idx" ON "growth_scenes"("playerId", "status");

CREATE INDEX IF NOT EXISTS "growth_scene_artifacts_sceneId_idx" ON "growth_scene_artifacts"("sceneId");

CREATE INDEX IF NOT EXISTS "threshold_encounters_playerId_status_idx" ON "threshold_encounters"("playerId", "status");

CREATE INDEX IF NOT EXISTS "threshold_encounter_artifacts_encounterId_idx" ON "threshold_encounter_artifacts"("encounterId");

CREATE INDEX IF NOT EXISTS "threshold_encounter_artifacts_type_promoted_idx" ON "threshold_encounter_artifacts"("type", "promoted");

CREATE INDEX IF NOT EXISTS "npc_constitution_versions_npcId_idx" ON "npc_constitution_versions"("npcId");

CREATE INDEX IF NOT EXISTS "npc_memories_npcId_idx" ON "npc_memories"("npcId");

CREATE INDEX IF NOT EXISTS "npc_memories_npcId_playerId_idx" ON "npc_memories"("npcId", "playerId");

CREATE INDEX IF NOT EXISTS "npc_reflections_npcId_status_idx" ON "npc_reflections"("npcId", "status");

CREATE INDEX IF NOT EXISTS "npc_actions_npcId_idx" ON "npc_actions"("npcId");

CREATE UNIQUE INDEX IF NOT EXISTS "npc_relationship_states_npcId_playerId_key" ON "npc_relationship_states"("npcId", "playerId");

CREATE INDEX IF NOT EXISTS "player_map_presences_map_id_idx" ON "player_map_presences"("map_id");

CREATE UNIQUE INDEX IF NOT EXISTS "player_map_presences_player_id_map_id_key" ON "player_map_presences"("player_id", "map_id");

CREATE UNIQUE INDEX IF NOT EXISTS "profile_spatial_maps_player_id_key" ON "profile_spatial_maps"("player_id");

CREATE INDEX IF NOT EXISTS "profile_map_rooms_map_id_idx" ON "profile_map_rooms"("map_id");

CREATE UNIQUE INDEX IF NOT EXISTS "profile_map_rooms_map_id_slug_key" ON "profile_map_rooms"("map_id", "slug");

CREATE INDEX IF NOT EXISTS "profile_map_anchors_room_id_idx" ON "profile_map_anchors"("room_id");

CREATE UNIQUE INDEX IF NOT EXISTS "npc_profiles_playerId_key" ON "npc_profiles"("playerId");

CREATE UNIQUE INDEX IF NOT EXISTS "npc_profiles_constitutionId_key" ON "npc_profiles"("constitutionId");

CREATE INDEX IF NOT EXISTS "trade_transactions_initiator_id_completed_at_idx" ON "trade_transactions"("initiator_id", "completed_at");

CREATE INDEX IF NOT EXISTS "trade_transactions_room_id_completed_at_idx" ON "trade_transactions"("room_id", "completed_at");

CREATE INDEX IF NOT EXISTS "starter_bars_player_id_idx" ON "starter_bars"("player_id");

CREATE UNIQUE INDEX IF NOT EXISTS "starter_bars_player_id_room_id_key" ON "starter_bars"("player_id", "room_id");

CREATE INDEX IF NOT EXISTS "milestone_contributions_milestoneId_idx" ON "milestone_contributions"("milestoneId");

CREATE INDEX IF NOT EXISTS "milestone_contributions_playerId_idx" ON "milestone_contributions"("playerId");

CREATE INDEX IF NOT EXISTS "wiki_drafts_artifactId_idx" ON "wiki_drafts"("artifactId");

CREATE INDEX IF NOT EXISTS "wiki_drafts_status_idx" ON "wiki_drafts"("status");

CREATE INDEX IF NOT EXISTS "campaign_memberships_campaignId_idx" ON "campaign_memberships"("campaignId");

CREATE INDEX IF NOT EXISTS "instance_export_requests_instanceId_status_idx" ON "instance_export_requests"("instanceId", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "instances_kernelBarId_key" ON "instances"("kernelBarId");

CREATE INDEX IF NOT EXISTS "map_rooms_map_id_idx" ON "map_rooms"("map_id");

CREATE UNIQUE INDEX IF NOT EXISTS "map_rooms_map_id_slug_key" ON "map_rooms"("map_id", "slug");

CREATE INDEX IF NOT EXISTS "nations_instanceId_idx" ON "nations"("instanceId");

CREATE INDEX IF NOT EXISTS "player_bars_playerId_source_idx" ON "player_bars"("playerId", "source");

CREATE UNIQUE INDEX IF NOT EXISTS "quest_threads_bookId_key" ON "quest_threads"("bookId");

CREATE UNIQUE INDEX IF NOT EXISTS "quest_threads_adventureId_key" ON "quest_threads"("adventureId");

CREATE UNIQUE INDEX IF NOT EXISTS "quest_threads_eventCampaignId_key" ON "quest_threads"("eventCampaignId");
