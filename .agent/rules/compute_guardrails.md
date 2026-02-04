---
description: Compute resource guardrails to prevent unproductive loops
---

# Compute Guardrails

These rules prevent wasted cycles and ensure efficient problem-solving.

## Loop Prevention

| Situation | Action |
|-----------|--------|
| Browser automation fails **2x** | Switch to code-based verification |
| Build/test loop > **3 iterations** | Pause, document blocker, ask user |
| Same error repeated **2x** | Escalate immediately, don't retry blindly |
| External service wait > **60s** | Timeout and report status |

## Escalation Protocol

1. **Document** the blocker clearly
2. **Notify** user with options
3. **Don't** retry the same approach indefinitely

## Preferred Verification Order

1. **Scripts** (`validate-release.ts`) - fastest, most reliable
2. **curl/API calls** - quick health checks
3. **Browser automation** - only for visual/UX verification
