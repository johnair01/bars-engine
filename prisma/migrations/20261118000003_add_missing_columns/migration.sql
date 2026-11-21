-- The migrations stopped tracking prisma/schema.prisma after 2026-03, so this table,
-- its columns, indexes and foreign keys reached deployed databases only through
-- `prisma db push`. Generated with `prisma migrate diff --from-url <migrated db>
-- --to-schema-datamodel prisma/schema.prisma --script` and filtered to additive,
-- idempotent statements, so a database that already has them from `db push` is
-- unchanged.

ALTER TABLE "app_config" ADD COLUMN IF NOT EXISTS "default_lobby_map_id" TEXT;

ALTER TABLE "app_config" ADD COLUMN IF NOT EXISTS "postSignupRedirect" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "allyshipDomain" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "archetype" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "backlogPromptPath" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "campaignGoal" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "campaignRef" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "creator_archetype_key" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "creator_nation_key" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "docQuestMetadata" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "emotionalAlchemyTag" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "evidenceKind" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "forkedFromId" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "gameMasterFace" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "grantsMoveId" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "inviteId" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "isKeyUnblocker" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "lockType" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "nation" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "questPool" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "questSource" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "source321SessionId" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "sourceBarId" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "stakedPool" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "strandMetadata" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "successCondition" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "wateringContent" TEXT;

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "wateringProgress" TEXT;

ALTER TABLE "instance_export_requests" ADD COLUMN IF NOT EXISTS "configBundle" TEXT;

ALTER TABLE "instance_export_requests" ADD COLUMN IF NOT EXISTS "instanceId" TEXT NOT NULL;

ALTER TABLE "instance_export_requests" ADD COLUMN IF NOT EXISTS "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "instance_export_requests" ADD COLUMN IF NOT EXISTS "requestedByPlayerId" TEXT NOT NULL;

ALTER TABLE "instance_export_requests" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "allyshipDomain" TEXT;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "campaignRef" TEXT;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "cashappUrl" TEXT;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "deckAuthoringIntake" JSONB;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "domainDeckCycles" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "donationPackRateCents" INTEGER DEFAULT 100;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "goalData" TEXT;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "kernelBarId" TEXT;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "kotterStage" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "narrativeKernel" TEXT;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "packConfig" TEXT;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "paypalUrl" TEXT;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "portalAdventureId" TEXT;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "primaryCampaignDomain" TEXT;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "schoolsAdventureId" TEXT;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "showUpContent" TEXT;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "sourceInstanceId" TEXT;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "storyBridgeCopy" TEXT;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "timezone" TEXT;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "venmoUrl" TEXT;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "vibeData" TEXT;

ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "wakeUpContent" TEXT;

ALTER TABLE "invites" ADD COLUMN IF NOT EXISTS "forgerId" TEXT;

ALTER TABLE "invites" ADD COLUMN IF NOT EXISTS "instanceId" TEXT;

ALTER TABLE "invites" ADD COLUMN IF NOT EXISTS "invitationBarId" TEXT;

ALTER TABLE "invites" ADD COLUMN IF NOT EXISTS "invitationMessage" TEXT;

ALTER TABLE "invites" ADD COLUMN IF NOT EXISTS "invitationTargetId" TEXT;

ALTER TABLE "invites" ADD COLUMN IF NOT EXISTS "invitationTargetType" TEXT;

ALTER TABLE "invites" ADD COLUMN IF NOT EXISTS "starterQuestId" TEXT;

ALTER TABLE "map_rooms" ADD COLUMN IF NOT EXISTS "background_url" TEXT;

ALTER TABLE "map_rooms" ADD COLUMN IF NOT EXISTS "channel_id" TEXT;

ALTER TABLE "map_rooms" ADD COLUMN IF NOT EXISTS "graph_node_id" TEXT;

ALTER TABLE "map_rooms" ADD COLUMN IF NOT EXISTS "map_id" TEXT NOT NULL;

ALTER TABLE "map_rooms" ADD COLUMN IF NOT EXISTS "nation_key" TEXT;

ALTER TABLE "map_rooms" ADD COLUMN IF NOT EXISTS "room_type" TEXT;

ALTER TABLE "map_rooms" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "nation_moves" ADD COLUMN IF NOT EXISTS "archetypeId" TEXT;

ALTER TABLE "nation_moves" ADD COLUMN IF NOT EXISTS "channel" TEXT;

ALTER TABLE "nation_moves" ADD COLUMN IF NOT EXISTS "deprecatedAt" TIMESTAMP(3);

ALTER TABLE "nation_moves" ADD COLUMN IF NOT EXISTS "moveFamilyId" TEXT;

ALTER TABLE "nation_moves" ADD COLUMN IF NOT EXISTS "origin" TEXT NOT NULL DEFAULT 'GM_AUTHORED';

ALTER TABLE "nation_moves" ADD COLUMN IF NOT EXISTS "parentMoveId" TEXT;

ALTER TABLE "nation_moves" ADD COLUMN IF NOT EXISTS "semanticEmbedding" TEXT;

ALTER TABLE "nation_moves" ADD COLUMN IF NOT EXISTS "sourceMetadata" TEXT;

ALTER TABLE "nation_moves" ADD COLUMN IF NOT EXISTS "supersededById" TEXT;

ALTER TABLE "nation_moves" ADD COLUMN IF NOT EXISTS "tier" TEXT NOT NULL DEFAULT 'CANONICAL';

ALTER TABLE "nation_moves" ADD COLUMN IF NOT EXISTS "usesPerPeriod" INTEGER NOT NULL DEFAULT 2;

ALTER TABLE "nations" ADD COLUMN IF NOT EXISTS "element" TEXT NOT NULL DEFAULT 'earth';

ALTER TABLE "nations" ADD COLUMN IF NOT EXISTS "instanceId" TEXT;

ALTER TABLE "player_roles" ADD COLUMN IF NOT EXISTS "focus" TEXT;

ALTER TABLE "player_roles" ADD COLUMN IF NOT EXISTS "grantedByBarId" TEXT;

ALTER TABLE "player_roles" ADD COLUMN IF NOT EXISTS "instanceId" TEXT;

ALTER TABLE "player_roles" ADD COLUMN IF NOT EXISTS "isFilledByNpc" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "player_roles" ADD COLUMN IF NOT EXISTS "nationId" TEXT;

ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "archetypeId" TEXT;

ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "avatarConfig" TEXT;

ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "avatarSpritePath" TEXT;

ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "campaignDomainPreference" TEXT;

ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "hasSeenCampaignEntry" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "invitedByPlayerId" TEXT;

ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "lastForgeTimestamp" TIMESTAMP(3);

ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "practiceOrientationComplete" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "practiceOrientationCompletedAt" TIMESTAMP(3);

ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "walkableSpritePath" TEXT;

ALTER TABLE "quest_move_logs" ADD COLUMN IF NOT EXISTS "outcome" TEXT;

ALTER TABLE "quest_packs" ADD COLUMN IF NOT EXISTS "allowedArchetypes" TEXT;

ALTER TABLE "quest_threads" ADD COLUMN IF NOT EXISTS "adventureId" TEXT;

ALTER TABLE "quest_threads" ADD COLUMN IF NOT EXISTS "allowedArchetypes" TEXT;

ALTER TABLE "quest_threads" ADD COLUMN IF NOT EXISTS "bookId" TEXT;

ALTER TABLE "quest_threads" ADD COLUMN IF NOT EXISTS "eventCampaignId" TEXT;

ALTER TABLE "quest_threads" ADD COLUMN IF NOT EXISTS "gateArchetypeId" TEXT;

ALTER TABLE "quest_threads" ADD COLUMN IF NOT EXISTS "sourceQuestId" TEXT;

ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "accountabilities" TEXT;

ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "npcFace" TEXT;

ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "npcTier" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "orientationTemplateId" TEXT;

ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "prerequisites" TEXT;

ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "purpose" TEXT;

ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "scope" TEXT NOT NULL DEFAULT 'instance';

ALTER TABLE "spec_kit_backlog_items" ADD COLUMN IF NOT EXISTS "ownerFace" TEXT, ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "twine_runs" ADD COLUMN IF NOT EXISTS "agentMetadata" TEXT;

ALTER TABLE "twine_runs" ADD COLUMN IF NOT EXISTS "diagnosticState" TEXT;

ALTER TABLE "twine_runs" ADD COLUMN IF NOT EXISTS "isCollaborative" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "twine_runs" ADD COLUMN IF NOT EXISTS "parentRunId" TEXT;

ALTER TABLE "twine_stories" ADD COLUMN IF NOT EXISTS "isTemplate" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "vibulons" ADD COLUMN IF NOT EXISTS "creatorId" TEXT;
