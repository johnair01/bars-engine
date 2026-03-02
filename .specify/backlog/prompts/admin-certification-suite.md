# Prompt: Admin Certification Suite

**Use this prompt when implementing or verifying the Admin Certification Suite (I 1.5).**

## Context

Certification quests serve as a "final gate" for admins: unified discovery (Market + Adventures), 1 Vibeulon on completion, Graveyard lifecycle with hard-lock and Restore. This prompt completes the gaps: filter completed from Available, prevent launch from Adventures, clear pickup error, revalidate on Restore.

## Prompt text

> Implement the Admin Certification Suite per [.specify/specs/admin-certification-suite/spec.md](../specs/admin-certification-suite/spec.md). (1) Filter getMarketContent so system quests with completed PlayerQuest for current player do not appear in available list (exclude graveyardIds). (2) pickupMarketQuest: return "Quest completed. Restore from Graveyard to re-run." when existing assignment is completed and quest is system. (3) Adventures page: for completed certification quests, link to /bars/available with "Restore in Market to re-run" instead of linking to play. (4) restoreCertificationQuest: add revalidatePath('/adventures').

## Reference

- Spec: [.specify/specs/admin-certification-suite/spec.md](../specs/admin-certification-suite/spec.md)
- Backlog: I (1.5)
