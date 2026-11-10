import type { Tx } from '../bar-mint'

export type V = {
    id: string; ownerId: string | null; creatorId: string | null; originSource: string; originId: string; originTitle: string
    stakedOnBarId: string | null; createdAt: Date; energy?: unknown; generation: number
}
export type Bar = { id: string; visibility: string; archivedAt: Date | null; mergedIntoId: string | null; status: string; creatorId?: string }
export type Ev = { playerId: string; source: string; amount: number; questId?: string | null }
export type Mark = { vibulonId: string; act: string; playerId: string; place: string; barId: string | null; toId: string | null; note: string | null; originSource: string; originId: string; originTitle: string; energy?: unknown; createdAt?: Date }
export type Share = { barId: string; fromUserId: string; toUserId: string }

const isPlain = (w: unknown): w is { in?: unknown[]; not?: unknown } => !!w && typeof w === 'object' && !(w instanceof Date)

/** An in-memory stand-in for the Prisma calls the economy modules make, shared by the economy tests. */
export function fakeDb(opts: { bars?: Bar[]; shares?: Share[]; names?: Record<string, string>; homes?: Record<string, string> } = {}) {
    const bars = opts.bars ?? []
    const shares = opts.shares ?? []
    const vibulons: V[] = []
    const marks: Mark[] = []
    const events: Ev[] = []
    const pouches = new Map<string, unknown>()
    let n = 0
    const match = (v: object, w: Record<string, unknown> = {}) =>
        Object.entries(w).every(([k, want]) => {
            const got = (v as Record<string, unknown>)[k]
            if (isPlain(want)) {
                if (want.in) return want.in.includes(got)
                if ('not' in want) return got !== want.not
            }
            return got === want
        })
    const sorted = () => [...vibulons].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    const db = {
        vibulon: {
            create: async ({ data }: { data: Partial<V> }) => {
                const v = { id: `v${++n}`, stakedOnBarId: null, generation: 0, createdAt: new Date(1000 + n), ...data } as V
                vibulons.push(v)
                return v
            },
            createMany: async ({ data }: { data: Array<Partial<V>> }) => {
                data.forEach((d) => vibulons.push({ stakedOnBarId: null, generation: 0, createdAt: new Date(1000 + ++n), ...d } as V))
                return { count: data.length }
            },
            findFirst: async ({ where }: { where: Record<string, unknown> }) => sorted().find((v) => match(v, where)) ?? null,
            findMany: async ({ where, take }: { where: Record<string, unknown>; take?: number }) =>
                sorted().filter((v) => match(v, where)).slice(0, take ?? Infinity),
            count: async ({ where }: { where: Record<string, unknown> }) => vibulons.filter((v) => match(v, where)).length,
            update: async ({ where, data }: { where: { id: string }; data: Partial<V> }) => {
                const v = vibulons.find((x) => x.id === where.id)!
                Object.assign(v, data)
                return v
            },
            updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Partial<V> }) => {
                const hit = vibulons.filter((v) => match(v, where))
                hit.forEach((v) => Object.assign(v, data))
                return { count: hit.length }
            },
            delete: async ({ where }: { where: { id: string } }) => {
                const i = vibulons.findIndex((v) => v.id === where.id)
                return vibulons.splice(i, 1)[0]
            },
            deleteMany: async ({ where }: { where: Record<string, unknown> }) => {
                const hit = vibulons.filter((v) => match(v, where))
                hit.forEach((v) => vibulons.splice(vibulons.indexOf(v), 1))
                return { count: hit.length }
            },
        },
        vibulonMark: {
            createMany: async ({ data }: { data: Mark[] }) => {
                data.forEach((d) => marks.push({ ...d, createdAt: new Date(2000 + marks.length) }))
                return { count: data.length }
            },
            findMany: async ({ where }: { where: Record<string, unknown> }) => marks.filter((m) => match(m, where)),
        },
        vibulonEvent: { create: async ({ data }: { data: Ev }) => (events.push(data), data) },
        customBar: {
            findMany: async ({ where }: { where: { id: { in: string[] }; status: { not: string } } }) =>
                bars.filter((b) => where.id.in.includes(b.id) && b.archivedAt === null && b.mergedIntoId === null && b.status !== where.status.not),
            findUnique: async ({ where }: { where: { id: string } }) => bars.find((b) => b.id === where.id) ?? null,
        },
        barShare: {
            findMany: async ({ where }: { where: { barId: string | { in: string[] } } }) =>
                shares.filter((s) => (typeof where.barId === 'string' ? s.barId === where.barId : where.barId.in.includes(s.barId))),
        },
        player: {
            findMany: async ({ where }: { where: { id: { in: string[] } } }) =>
                where.id.in.map((id) => ({ id, name: opts.names?.[id] ?? 'a friend' })),
        },
        betweenMember: {
            findMany: async ({ where }: { where: { playerId: string } }) =>
                opts.homes?.[where.playerId] ? [{ gardenId: opts.homes[where.playerId], garden: { data: { kind: 'home' } } }] : [],
        },
        betweenPrivate: {
            findUnique: async ({ where }: { where: { gardenId_playerId_key: { gardenId: string; playerId: string } } }) => {
                const k = `${where.gardenId_playerId_key.gardenId}|${where.gardenId_playerId_key.playerId}`
                return pouches.has(k) ? { data: pouches.get(k) } : null
            },
            upsert: async ({ where, create }: { where: { gardenId_playerId_key: { gardenId: string; playerId: string } }; create: { data: unknown } }) => {
                pouches.set(`${where.gardenId_playerId_key.gardenId}|${where.gardenId_playerId_key.playerId}`, create.data)
            },
        },
    }
    return { tx: db as unknown as Tx, vibulons, marks, events, bars, pouches }
}
