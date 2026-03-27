/** Certification CYOA quests use CustomBar ids prefixed with `cert-` (see seed-cyoa-certification-quests). */
export function isCertificationQuestId(questId: string | undefined | null): boolean {
  return typeof questId === 'string' && questId.startsWith('cert-')
}
