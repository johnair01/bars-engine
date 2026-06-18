import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SimpleCaptureForm } from '@/components/bars/SimpleCaptureForm'

/**
 * @page /bars/create
 * @description Screen A — simple text capture. Low-friction entry point for the
 * Capture → Keep → Tune intake flow. For the full Stories canvas, use /bars/capture.
 */
export default async function CreateBarPage(props: {
    searchParams: Promise<{ text?: string; prefill?: string; ref?: string }>
}) {
    const [player, searchParams] = await Promise.all([
        getCurrentPlayer(),
        props.searchParams,
    ])
    if (!player) redirect('/login')

    const rawText = searchParams.prefill ?? searchParams.text
    const defaultText = rawText ? decodeURIComponent(rawText) : undefined

    return (
        <SimpleCaptureForm
            defaultText={defaultText}
            campaignRef={searchParams.ref}
        />
    )
}
