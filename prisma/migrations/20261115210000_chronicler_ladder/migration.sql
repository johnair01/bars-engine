-- Chronicler story ladder (council chronicler-ladder): cards on six rungs, links that run only downward, flag queue.
CREATE TABLE "chronicler_nodes" (
    "bar_id" TEXT NOT NULL,
    "rung" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chronicler_nodes_pkey" PRIMARY KEY ("bar_id")
);
CREATE INDEX "chronicler_nodes_rung_idx" ON "chronicler_nodes"("rung");

CREATE TABLE "chronicler_links" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chronicler_links_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "chronicler_links_parent_id_child_id_key" ON "chronicler_links"("parent_id", "child_id");
CREATE INDEX "chronicler_links_child_id_idx" ON "chronicler_links"("child_id");

CREATE TABLE "chronicler_flags" (
    "id" TEXT NOT NULL,
    "bar_id" TEXT NOT NULL,
    "caused_by_bar_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "ask" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "answer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answered_at" TIMESTAMP(3),
    CONSTRAINT "chronicler_flags_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "chronicler_flags_status_created_at_idx" ON "chronicler_flags"("status", "created_at");
CREATE INDEX "chronicler_flags_bar_id_idx" ON "chronicler_flags"("bar_id");
