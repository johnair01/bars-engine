/**
 * BAR ↔ bars-engine charge_capture bridge helpers.
 * Manual export only: no network, no auth, no background sync.
 *
 * @see vault: `06 Specs/inner-garden-chapter1-bar-deck/BAR_CHARGE_BRIDGE.md`
 */

export const BRIDGE_SCHEMA_VERSION = 'ig-bar-charge-bridge.v0';

export const IG_TO_ENGINE_EMOTION = {
    anger: 'anger',
    joy: 'joy',
    sadness: 'sadness',
    fear: 'fear',
    anxiety: 'neutrality',
    shame: 'neutrality',
};

export function normalizeIntensityForBarsEngine(intensity) {
    if (intensity === null || intensity === undefined) return null;
    const n = Number(intensity);
    if (!Number.isFinite(n)) return null;
    if (n <= 20) return 1;
    if (n <= 40) return 2;
    if (n <= 60) return 3;
    if (n <= 80) return 4;
    return 5;
}

function truncateSummary(text) {
    const s = (text || '').trim();
    if (!s) return 'Untitled charge';
    return s.length > 160 ? `${s.slice(0, 157)}...` : s;
}

export function buildBridgeExport(bar, card) {
    const emotionChannel = IG_TO_ENGINE_EMOTION[bar.emotionTag] ?? null;
    const contextNote = [`B: ${bar.behavior}`, `A: ${bar.activation}`, `R: ${bar.result}`].join('\n');
    const lossNotes = [
        'satisfaction not captured in inner-garden Chapter 1',
        'personal_move not captured in inner-garden Chapter 1',
    ];

    if (bar.emotionTag && !emotionChannel) {
        lossNotes.push(`emotionTag "${bar.emotionTag}" has no bars-engine emotion_channel mapping`);
    } else if (['anxiety', 'shame'].includes(bar.emotionTag)) {
        lossNotes.push(`emotionTag "${bar.emotionTag}" normalized to bars-engine "neutrality"`);
    }

    const normalizedIntensity = normalizeIntensityForBarsEngine(bar.intensity);
    if (bar.intensity === undefined || bar.intensity === null) {
        lossNotes.push('intensity not stored on this BAR; export leaves bars-engine intensity null');
    }

    return {
        schemaVersion: BRIDGE_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        source: 'inner-garden',
        mode: 'manual_export',
        privacy: 'player_consented_copy',
        innerGarden: {
            bar: { ...bar },
            card: card
                ? {
                    id: card.id,
                    createdAt: card.createdAt,
                    provenanceBarId: card.provenanceBarId,
                    title: card.title,
                    kind: card.kind,
                    spent: !!card.spent,
                }
                : null,
        },
        barsEngine: {
            customBarType: 'charge_capture',
            createChargeBarPayload: {
                summary: truncateSummary(bar.result || bar.behavior),
                emotion_channel: emotionChannel,
                intensity: normalizedIntensity,
                satisfaction: null,
                context_note: contextNote,
                personal_move: null,
            },
        },
        lossNotes,
    };
}
