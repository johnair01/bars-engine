-- Add proposedByAgentId to custom_bars (agent-proposed content; admin approval gate)
ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "proposedByAgentId" TEXT;
