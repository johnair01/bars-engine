import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import {
    parseSeedMetabolization,
    effectiveMaturity,
} from '@/lib/bar-seed-metabolization/parse'
import { TuneBarClient } from '@/components/bars/TuneBarClient'

interface TunePageProps {
    params: Promise<{ id: string }>
}

export default async function TunePage({ params }: TunePageProps) {
    const { id: barId } = await params

    const cookieStore = await cookies()
    const playerId =
        cookieStore.get('bars_player_id')?.value ||
        (process.env.NODE_ENV === 'development' ? process.env.DEV_PLAYER_ID : null)

    if (!playerId) redirect('/login')

    const bar = await db.customBar.findUnique({
        where: { id: barId },
        select: {
            id: true,
            title: true,
            description: true,
            creatorId: true,
            type: true,
            nation: true,
            intensity: true,
            emotionalAlchemyTag: true,
            moveType: true,
            seedMetabolization: true,
        },
    })

    if (!bar) notFound()
    if (bar.creatorId !== playerId) notFound()
    if (!['bar', 'charge_capture'].includes(bar.type)) redirect(`/bars/${barId}`)

    const maturity = effectiveMaturity(parseSeedMetabolization(bar.seedMetabolization))

    return (
        <TuneBarClient
            barId={bar.id}
            title={bar.title}
            description={bar.description || ''}
            initialNation={bar.nation ?? null}
            initialIntensity={bar.intensity ?? null}
            initialAlchemyTag={bar.emotionalAlchemyTag ?? null}
            initialMoveType={bar.moveType ?? null}
            initialMaturity={maturity}
        />
    )
}
