-- CreateTable
CREATE TABLE "party_experiences" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "invitationText" TEXT NOT NULL DEFAULT '',
    "hostNote" TEXT NOT NULL DEFAULT '',
    "storyJson" JSONB NOT NULL DEFAULT '{}',
    "themeJson" JSONB NOT NULL DEFAULT '{}',
    "party_date_label" TEXT,
    "location" TEXT,
    "schedule_json" JSONB NOT NULL DEFAULT '[]',
    "created_by_player_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "party_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_participants" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "player_id" TEXT,
    "client_session_id" TEXT,
    "display_name" TEXT NOT NULL,
    "email" TEXT,
    "keep_party_data" BOOLEAN NOT NULL DEFAULT true,
    "wants_full_signup" BOOLEAN NOT NULL DEFAULT false,
    "is_host" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "party_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_oracle_discoveries" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "base_card_id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'draw',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "party_oracle_discoveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_oracle_answers" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "base_card_id" TEXT NOT NULL,
    "depth" TEXT NOT NULL DEFAULT 'hard',
    "scope" TEXT NOT NULL DEFAULT 'private',
    "answer_text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "party_oracle_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_card_threads" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "base_card_id" TEXT NOT NULL,
    "sender_player_id" TEXT NOT NULL,
    "recipient_player_id" TEXT NOT NULL,
    "sender_note" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'sent',
    "answer_text" TEXT,
    "answer_private_note" TEXT,
    "answered_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "party_card_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_player_cards" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "author_player_id" TEXT NOT NULL,
    "base_card_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "flavor" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "party_player_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_quest_cards" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "author_player_id" TEXT,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'treasure',
    "kind" TEXT NOT NULL DEFAULT 'ask',
    "face" TEXT,
    "wave_mode" TEXT,
    "materials" TEXT NOT NULL DEFAULT '',
    "wave_json" JSONB NOT NULL DEFAULT '{}',
    "game_master_json" JSONB NOT NULL DEFAULT '{}',
    "seed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "party_quest_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_quest_completions" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "quest_card_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "asset_id" TEXT,
    "caption" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "party_quest_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_altar_posts" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "author_player_id" TEXT,
    "client_session_id" TEXT,
    "display_name" TEXT NOT NULL,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL DEFAULT 'other',
    "tags_json" JSONB NOT NULL DEFAULT '[]',
    "title" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL,
    "source_json" JSONB NOT NULL DEFAULT '{}',
    "asset_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "party_altar_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_altar_replies" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "author_player_id" TEXT,
    "client_session_id" TEXT,
    "display_name" TEXT NOT NULL,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "party_altar_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_altar_reactions" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "party_altar_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_keepsakes" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "artifact_type" TEXT NOT NULL,
    "artifact_id" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "snapshot_json" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "party_keepsakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_oracle_card_overrides" (
    "id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "title" TEXT,
    "prompts_json" JSONB,
    "flavor_json" JSONB,
    "image_asset_id" TEXT,
    "crop_json" JSONB,
    "updated_by_player_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "party_oracle_card_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "party_experiences_slug_key" ON "party_experiences"("slug");
CREATE INDEX "party_participants_party_id_display_name_idx" ON "party_participants"("party_id", "display_name");
CREATE INDEX "party_participants_party_id_player_id_idx" ON "party_participants"("party_id", "player_id");
CREATE INDEX "party_participants_party_id_client_session_id_idx" ON "party_participants"("party_id", "client_session_id");
CREATE INDEX "party_oracle_discoveries_party_id_player_id_idx" ON "party_oracle_discoveries"("party_id", "player_id");
CREATE INDEX "party_oracle_discoveries_party_id_base_card_id_idx" ON "party_oracle_discoveries"("party_id", "base_card_id");
CREATE INDEX "party_oracle_answers_party_id_player_id_idx" ON "party_oracle_answers"("party_id", "player_id");
CREATE INDEX "party_oracle_answers_party_id_base_card_id_idx" ON "party_oracle_answers"("party_id", "base_card_id");
CREATE INDEX "party_card_threads_party_id_sender_player_id_status_idx" ON "party_card_threads"("party_id", "sender_player_id", "status");
CREATE INDEX "party_card_threads_party_id_recipient_player_id_status_idx" ON "party_card_threads"("party_id", "recipient_player_id", "status");
CREATE INDEX "party_card_threads_party_id_base_card_id_idx" ON "party_card_threads"("party_id", "base_card_id");
CREATE INDEX "party_player_cards_party_id_base_card_id_idx" ON "party_player_cards"("party_id", "base_card_id");
CREATE INDEX "party_player_cards_party_id_author_player_id_idx" ON "party_player_cards"("party_id", "author_player_id");
CREATE INDEX "party_quest_cards_party_id_createdAt_idx" ON "party_quest_cards"("party_id", "createdAt");
CREATE INDEX "party_quest_cards_party_id_seed_idx" ON "party_quest_cards"("party_id", "seed");
CREATE INDEX "party_quest_completions_party_id_quest_card_id_idx" ON "party_quest_completions"("party_id", "quest_card_id");
CREATE INDEX "party_quest_completions_party_id_player_id_idx" ON "party_quest_completions"("party_id", "player_id");
CREATE INDEX "party_altar_posts_party_id_category_createdAt_idx" ON "party_altar_posts"("party_id", "category", "createdAt");
CREATE INDEX "party_altar_posts_party_id_author_player_id_idx" ON "party_altar_posts"("party_id", "author_player_id");
CREATE INDEX "party_altar_posts_party_id_client_session_id_idx" ON "party_altar_posts"("party_id", "client_session_id");
CREATE INDEX "party_altar_replies_party_id_post_id_createdAt_idx" ON "party_altar_replies"("party_id", "post_id", "createdAt");
CREATE INDEX "party_altar_replies_party_id_author_player_id_idx" ON "party_altar_replies"("party_id", "author_player_id");
CREATE INDEX "party_altar_replies_party_id_client_session_id_idx" ON "party_altar_replies"("party_id", "client_session_id");
CREATE UNIQUE INDEX "party_altar_reactions_post_id_player_id_reaction_key" ON "party_altar_reactions"("post_id", "player_id", "reaction");
CREATE INDEX "party_altar_reactions_party_id_post_id_idx" ON "party_altar_reactions"("party_id", "post_id");
CREATE INDEX "party_altar_reactions_party_id_player_id_idx" ON "party_altar_reactions"("party_id", "player_id");
CREATE UNIQUE INDEX "party_keepsakes_party_id_player_id_artifact_type_artifact_id_key" ON "party_keepsakes"("party_id", "player_id", "artifact_type", "artifact_id");
CREATE INDEX "party_keepsakes_party_id_player_id_createdAt_idx" ON "party_keepsakes"("party_id", "player_id", "createdAt");
CREATE UNIQUE INDEX "party_oracle_card_overrides_party_id_card_id_key" ON "party_oracle_card_overrides"("party_id", "card_id");
CREATE INDEX "party_oracle_card_overrides_party_id_updatedAt_idx" ON "party_oracle_card_overrides"("party_id", "updatedAt");
