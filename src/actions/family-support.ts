'use server'

import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { db } from '@/lib/db'
import { FAMILY_FINANCIAL_SNAPSHOT } from '@/lib/family-support/financial-snapshot'
import { FAMILY_ROOM_SLUG, grantFamilyRoomAccess, hashAccessIdentity, hashParticipantToken, isValidPassphrase, participantToken } from '@/lib/family-support/access'

const text = z.string().trim().min(2).max(4000)
const reflectionField = z.string().trim().max(4000).optional()
const reflectionSchema = z.object({
  chargeDescription: reflectionField, maskShape: reflectionField, maskName: reflectionField,
  desire: reflectionField, desireOutcome: reflectionField, lifeState: reflectionField,
  rootCause: reflectionField, fear: reflectionField, somaticEcho: reflectionField,
  interiorVoice: reflectionField, integrationShift: reflectionField, alignedAction: reflectionField,
})

type Serialized<T> = T extends Date ? string : T extends Array<infer Item> ? Serialized<Item>[] : T extends object ? { [Key in keyof T]: Serialized<T[Key]> } : T

function jsonClone<T>(value: T): Serialized<T> {
  return JSON.parse(JSON.stringify(value)) as Serialized<T>
}

async function participant() {
  const token = await participantToken()
  if (!token) throw new Error('This room session has ended. Please enter the room again.')
  const found = await db.familyParticipant.findUnique({ where: { tokenHash: hashParticipantToken(token) } })
  if (!found || found.roomId === '') throw new Error('This room session is not recognized.')
  await db.familyParticipant.update({ where: { id: found.id }, data: { lastSeenAt: new Date() } })
  return found
}

async function room() {
  return db.familyDecisionRoom.upsert({
    where: { slug: FAMILY_ROOM_SLUG },
    create: { slug: FAMILY_ROOM_SLUG, financialSnapshotVersion: FAMILY_FINANCIAL_SNAPSHOT.version },
    update: { financialSnapshotVersion: FAMILY_FINANCIAL_SNAPSHOT.version },
  })
}

async function passphraseAttemptAllowed() {
  const requestHeaders = await headers()
  // Vercel supplies x-forwarded-for; localhost gets an intentional shared key.
  const identity = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local-or-unknown'
  const identityHash = hashAccessIdentity(identity)
  const now = new Date()
  const record = await db.familyRoomAccessAttempt.findUnique({ where: { identityHash } })
  if (record?.lockedUntil && record.lockedUntil > now) return false
  const windowExpired = !record || now.getTime() - record.windowStartedAt.getTime() > 15 * 60 * 1000
  const count = windowExpired ? 1 : (record?.count ?? 0) + 1
  const lockedUntil = count >= 8 ? new Date(now.getTime() + 15 * 60 * 1000) : null
  await db.familyRoomAccessAttempt.upsert({
    where: { identityHash },
    create: { identityHash, count, windowStartedAt: now, lockedUntil },
    update: { count, windowStartedAt: windowExpired ? now : undefined, lockedUntil },
  })
  return !lockedUntil
}

async function clearPassphraseAttempts() {
  const requestHeaders = await headers()
  const identity = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local-or-unknown'
  await db.familyRoomAccessAttempt.delete({ where: { identityHash: hashAccessIdentity(identity) } }).catch(() => undefined)
}

export async function enterFamilyRoom(raw: FormData) {
  const passphrase = String(raw.get('passphrase') ?? '')
  const displayName = String(raw.get('displayName') ?? '').trim().slice(0, 80)
  if (!(await passphraseAttemptAllowed())) return { ok: false, error: 'Too many attempts. Please wait 15 minutes before trying again.' }
  if (!isValidPassphrase(passphrase)) return { ok: false, error: 'That passphrase does not match this room.' }
  await clearPassphraseAttempts()
  const currentRoom = await room()
  const token = crypto.randomBytes(32).toString('base64url')
  await db.familyParticipant.create({ data: { roomId: currentRoom.id, tokenHash: hashParticipantToken(token), displayName: displayName || undefined } })
  await grantFamilyRoomAccess(token)
  revalidatePath('/ally/mom')
  return { ok: true }
}

export async function submitFamilyFundingDecision(raw: unknown) {
  const input = z.object({ option: z.enum(['week', 'month', 'ninety', 'custom', 'no']), amountCents: z.number().int().min(0).max(2_000_000), terms: z.string().trim().max(2000).optional() }).safeParse(raw)
  if (!input.success) return { ok: false, error: 'Please choose a valid funding option.' }
  const person = await participant()
  const currentRoom = await room()
  const amount = input.data.option === 'week' ? FAMILY_FINANCIAL_SNAPSHOT.weeklyStabilizationCents : input.data.option === 'month' ? FAMILY_FINANCIAL_SNAPSHOT.monthRequestCents : input.data.option === 'ninety' ? FAMILY_FINANCIAL_SNAPSHOT.ninetyDayCeilingCents : input.data.amountCents
  await db.familyFundingDecision.create({ data: { roomId: currentRoom.id, participantId: person.id, fundingOption: input.data.option, amountCents: amount, terms: input.data.terms || undefined } })
  revalidatePath('/ally/mom')
  return { ok: true }
}

export async function saveVolunteerCfoAgreement() {
  const person = await participant()
  const currentRoom = await room()
  await db.volunteerCfoAgreement.upsert({
    where: { roomId_participantId: { roomId: currentRoom.id, participantId: person.id } },
    create: { roomId: currentRoom.id, participantId: person.id }, update: { status: 'proposed' },
  })
  revalidatePath('/ally/mom')
  return { ok: true }
}

export async function askBudgetLineQuestion(raw: unknown) {
  const input = z.object({ lineItemKey: z.string().regex(/^[a-z-]{2,40}$/), body: text }).safeParse(raw)
  if (!input.success) return { ok: false, error: 'Write a question before posting it.' }
  if (!FAMILY_FINANCIAL_SNAPSHOT.lines.some((line) => line.key === input.data.lineItemKey)) return { ok: false, error: 'That budget line is not available.' }
  const person = await participant()
  const currentRoom = await room()
  await db.budgetLineQuestion.create({ data: { roomId: currentRoom.id, participantId: person.id, lineItemKey: input.data.lineItemKey, budgetSnapshotVersion: FAMILY_FINANCIAL_SNAPSHOT.version, body: input.data.body } })
  revalidatePath('/ally/mom')
  return { ok: true }
}

/** Save a full 3·2·1 privately. This action never returns or queries another participant's source text. */
export async function savePrivateReflection(raw: unknown) {
  const input = reflectionSchema.safeParse(raw)
  if (!input.success) return { ok: false, error: 'Some reflection text was too long.' }
  const person = await participant()
  const currentRoom = await room()
  await db.familyReflection.upsert({
    where: { roomId_participantId: { roomId: currentRoom.id, participantId: person.id } },
    create: { roomId: currentRoom.id, participantId: person.id, ...input.data },
    update: input.data,
  })
  revalidatePath('/ally/mom')
  return { ok: true }
}

/** The only route by which reflection content becomes shared-room content. */
export async function publishReflectionSynthesis(raw: unknown) {
  const input = z.object({ synthesis: text }).safeParse(raw)
  if (!input.success) return { ok: false, error: 'Write a short synthesis before sharing it.' }
  const person = await participant()
  const currentRoom = await room()
  await db.familyReflection.upsert({
    where: { roomId_participantId: { roomId: currentRoom.id, participantId: person.id } },
    create: { roomId: currentRoom.id, participantId: person.id, publishedSynthesis: input.data.synthesis, publishedAt: new Date() },
    update: { publishedSynthesis: input.data.synthesis, publishedAt: new Date() },
  })
  revalidatePath('/ally/mom')
  return { ok: true }
}

export async function answerBudgetLineQuestion(raw: unknown) {
  const input = z.object({ questionId: z.string().min(1).max(120), body: text }).safeParse(raw)
  if (!input.success) return { ok: false, error: 'Write an answer before posting it.' }
  const person = await participant()
  const currentRoom = await room()
  const question = await db.budgetLineQuestion.findFirst({ where: { id: input.data.questionId, roomId: currentRoom.id }, select: { id: true } })
  if (!question) return { ok: false, error: 'That question is not available in this room.' }
  await db.budgetLineAnswer.create({ data: { questionId: question.id, participantId: person.id, body: input.data.body } })
  revalidatePath('/ally/mom')
  return { ok: true }
}

export async function saveBudgetScenario(raw: unknown) {
  const input = z.object({
    name: z.string().trim().max(100).optional(), horizonDays: z.union([z.literal(7), z.literal(30), z.literal(90)]),
    printBudgetCents: z.number().int().min(0).max(100_000), adTestBudgetCents: z.number().int().min(0).max(500_000),
    expectedIncomeCents: z.number().int().min(0).max(2_000_000), shared: z.boolean().optional(),
  }).safeParse(raw)
  if (!input.success) return { ok: false, error: 'That scenario has an invalid assumption.' }
  const person = await participant()
  const currentRoom = await room()
  const baseline = input.data.horizonDays === 7 ? FAMILY_FINANCIAL_SNAPSHOT.weeklyStabilizationCents : input.data.horizonDays === 30 ? FAMILY_FINANCIAL_SNAPSHOT.monthRequestCents : FAMILY_FINANCIAL_SNAPSHOT.ninetyDayCeilingCents
  const months = input.data.horizonDays / 30
  const printDelta = input.data.printBudgetCents * months - 10_000 * months
  const adBaseline = input.data.horizonDays === 90 ? 40_000 : 0
  const familyContributionCents = Math.max(0, Math.round(baseline + printDelta + input.data.adTestBudgetCents - adBaseline - input.data.expectedIncomeCents))
  await db.budgetScenario.create({ data: {
    roomId: currentRoom.id, participantId: person.id, name: input.data.name || undefined,
    snapshotVersion: FAMILY_FINANCIAL_SNAPSHOT.version, assumptionOverridesJson: JSON.stringify(input.data),
    calculatedTotalsJson: JSON.stringify({ baselineCents: baseline, familyContributionCents }), sharedAt: input.data.shared ? new Date() : undefined,
  } })
  revalidatePath('/ally/mom')
  return { ok: true, familyContributionCents }
}

export async function saveWeeklyReview(raw: unknown) {
  const input = z.object({
    weekOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    jobApplications: z.number().int().min(0).max(10_000), marketingActions: z.number().int().min(0).max(10_000),
    revenueCents: z.number().int().min(0).max(10_000_000), spendingCents: z.number().int().min(0).max(10_000_000),
    notes: z.string().trim().max(4000).optional(), decisions: z.string().trim().max(4000).optional(),
  }).safeParse(raw)
  if (!input.success) return { ok: false, error: 'Please check the weekly review values.' }
  const weekOf = new Date(`${input.data.weekOf}T00:00:00.000Z`)
  if (Number.isNaN(weekOf.getTime())) return { ok: false, error: 'Please choose a valid week.' }
  const { weekOf: _weekOf, ...reviewData } = input.data
  const person = await participant()
  const currentRoom = await room()
  await db.weeklyReview.upsert({
    where: { roomId_weekOf: { roomId: currentRoom.id, weekOf } },
    create: { roomId: currentRoom.id, participantId: person.id, weekOf, snapshotVersion: FAMILY_FINANCIAL_SNAPSHOT.version, ...reviewData },
    update: { participantId: person.id, snapshotVersion: FAMILY_FINANCIAL_SNAPSHOT.version, ...reviewData },
  })
  revalidatePath('/ally/mom')
  return { ok: true }
}

export async function saveAltitudeCommitment(raw: unknown) {
  const input = z.object({
    altitude: z.enum(['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']),
    handoffNote: z.string().trim().max(1000).optional(),
  }).safeParse(raw)
  if (!input.success) return { ok: false, error: 'Please choose one of the six roles.' }
  const person = await participant()
  const currentRoom = await room()
  await db.familyAltitudeCommitment.upsert({
    where: { roomId_participantId: { roomId: currentRoom.id, participantId: person.id } },
    create: { roomId: currentRoom.id, participantId: person.id, ...input.data },
    update: input.data,
  })
  revalidatePath('/ally/mom')
  return { ok: true }
}

export async function getFamilyRoomView() {
  const person = await participant()
  const currentRoom = await room()
  const [questions, decisions, agreements, myReflection, sharedSyntheses, scenarios, reviews, altitudeCommitments] = await Promise.all([
    db.budgetLineQuestion.findMany({ where: { roomId: currentRoom.id }, include: { answers: { include: { participant: { select: { displayName: true } } }, orderBy: { createdAt: 'asc' } }, participant: { select: { displayName: true } } }, orderBy: { createdAt: 'desc' } }),
    db.familyFundingDecision.findMany({ where: { roomId: currentRoom.id }, include: { participant: { select: { displayName: true } } }, orderBy: { updatedAt: 'desc' }, take: 10 }),
    db.volunteerCfoAgreement.findMany({ where: { roomId: currentRoom.id }, include: { participant: { select: { displayName: true } } } }),
    db.familyReflection.findUnique({ where: { roomId_participantId: { roomId: currentRoom.id, participantId: person.id } } }),
    db.familyReflection.findMany({ where: { roomId: currentRoom.id, publishedSynthesis: { not: null } }, select: { id: true, participantId: true, publishedSynthesis: true, publishedAt: true, participant: { select: { displayName: true } } }, orderBy: { publishedAt: 'desc' } }),
    db.budgetScenario.findMany({ where: { roomId: currentRoom.id, sharedAt: { not: null } }, select: { id: true, name: true, assumptionOverridesJson: true, calculatedTotalsJson: true, participant: { select: { displayName: true } } }, orderBy: { sharedAt: 'desc' }, take: 12 }),
    db.weeklyReview.findMany({ where: { roomId: currentRoom.id }, include: { participant: { select: { displayName: true } } }, orderBy: { weekOf: 'desc' }, take: 12 }),
    db.familyAltitudeCommitment.findMany({ where: { roomId: currentRoom.id }, include: { participant: { select: { displayName: true } } }, orderBy: { updatedAt: 'desc' } }),
  ])
  return { participantId: person.id, questions: jsonClone(questions), decisions: jsonClone(decisions), agreements: jsonClone(agreements), myReflection: jsonClone(myReflection), sharedSyntheses: jsonClone(sharedSyntheses), scenarios: jsonClone(scenarios), reviews: jsonClone(reviews), altitudeCommitments: jsonClone(altitudeCommitments) }
}
