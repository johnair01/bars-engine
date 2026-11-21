-- AddForeignKey
-- Foreign keys for tables that arrived through `prisma db push`.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'archetypes_instanceId_fkey') THEN
    ALTER TABLE "archetypes" ADD CONSTRAINT "archetypes_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'map_rooms_map_id_fkey') THEN
    ALTER TABLE "map_rooms" ADD CONSTRAINT "map_rooms_map_id_fkey" FOREIGN KEY ("mapId") REFERENCES "spatial_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shadow_321_sessions_playerId_fkey') THEN
    ALTER TABLE "shadow_321_sessions" ADD CONSTRAINT "shadow_321_sessions_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daemons_playerId_fkey') THEN
    ALTER TABLE "daemons" ADD CONSTRAINT "daemons_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_custom_bar_id_fkey') THEN
    ALTER TABLE "assets" ADD CONSTRAINT "assets_custom_bar_id_fkey" FOREIGN KEY ("custom_bar_id") REFERENCES "custom_bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assets_owner_id_fkey') THEN
    ALTER TABLE "assets" ADD CONSTRAINT "assets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bar_deck_cards_deckId_fkey') THEN
    ALTER TABLE "bar_deck_cards" ADD CONSTRAINT "bar_deck_cards_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "bar_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_artifacts_createdByActorId_fkey') THEN
    ALTER TABLE "event_artifacts" ADD CONSTRAINT "event_artifacts_createdByActorId_fkey" FOREIGN KEY ("createdByActorId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_invitations_instanceId_fkey') THEN
    ALTER TABLE "campaign_invitations" ADD CONSTRAINT "campaign_invitations_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alchemy_check_ins_playerId_fkey') THEN
    ALTER TABLE "alchemy_check_ins" ADD CONSTRAINT "alchemy_check_ins_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alchemy_player_states_playerId_fkey') THEN
    ALTER TABLE "alchemy_player_states" ADD CONSTRAINT "alchemy_player_states_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_milestones_approvedByPlayerId_fkey') THEN
    ALTER TABLE "campaign_milestones" ADD CONSTRAINT "campaign_milestones_approvedByPlayerId_fkey" FOREIGN KEY ("approvedByPlayerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_milestones_proposedByPlayerId_fkey') THEN
    ALTER TABLE "campaign_milestones" ADD CONSTRAINT "campaign_milestones_proposedByPlayerId_fkey" FOREIGN KEY ("proposedByPlayerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
