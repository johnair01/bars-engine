/**
 * DeckSystem — owns BAR captures, deck cards, mint, and non-combat spend (Ch.1).
 * @see vault: `06 Specs/inner-garden-chapter1-bar-deck/SPEC.md`
 */

import { buildBridgeExport } from '../data/BarChargeBridge.js';
import { BAR_SOURCE, CARD_KIND, MAX_BARS_CHAPTER_1 } from '../data/BarDeckConstants.js';

function newId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeImportedIntensity(value) {
    if (value == null || value === '') return 55;
    const n = Number(value);
    if (Number.isFinite(n)) return Math.max(1, Math.min(100, Math.round(n)));

    const normalized = String(value).trim().toLowerCase();
    if (normalized === 'low') return 30;
    if (normalized === 'medium') return 55;
    if (normalized === 'high') return 80;
    if (normalized === 'critical') return 95;
    return 55;
}

export class DeckSystem {
    constructor() {
        /** @type {object[]} */
        this.bars = [];
        /** @type {object[]} */
        this.cards = [];
        /** @type {string[]} */
        this.order = [];
        /** @type {Set<string>} */
        this.mintedBarIds = new Set();
    }

    /**
     * @returns {{ bars: object[], deck: { cards: object[], order: string[], mintedBarIds: string[] } }}
     */
    toSaveSnapshot() {
        return {
            bars: this.bars.map((b) => ({ ...b })),
            deck: {
                cards: this.cards.map((c) => ({ ...c })),
                order: [...this.order],
                mintedBarIds: [...this.mintedBarIds],
            },
        };
    }

    /**
     * @param {{ bars?: object[], deck?: { cards?: object[], order?: string[], mintedBarIds?: string[] } }} data
     */
    loadFromSave(data) {
        const bars = data.bars ?? [];
        const deck = data.deck ?? {};
        this.bars = Array.isArray(bars) ? bars.map((b) => ({ ...b })) : [];
        this.cards = Array.isArray(deck.cards) ? deck.cards.map((c) => ({ ...c })) : [];
        this.order = Array.isArray(deck.order) ? [...deck.order] : this._defaultOrderFromCards();
        const mids = deck.mintedBarIds;
        if (Array.isArray(mids) && mids.length) {
            this.mintedBarIds = new Set(mids);
        } else {
            this.mintedBarIds = new Set(
                this.cards.map((c) => c.provenanceBarId).filter(Boolean)
            );
        }
    }

    _defaultOrderFromCards() {
        return this.cards.map((c) => c.id);
    }

    /**
     * @param {{ behavior: string, activation: string, result: string, emotionTag?: string|null }} fields
     */
    tryAddBar(fields) {
        const behavior = (fields.behavior || '').trim();
        const activation = (fields.activation || '').trim();
        const result = (fields.result || '').trim();
        if (!behavior || !activation || !result) {
            return { ok: false, reason: 'empty' };
        }
        if (this.bars.length >= MAX_BARS_CHAPTER_1) {
            return { ok: false, reason: 'limit' };
        }
        const bar = {
            id: newId(),
            createdAt: Date.now(),
            behavior,
            activation,
            result,
            emotionTag: fields.emotionTag ?? null,
            intensity: fields.intensity ?? null,
            source: BAR_SOURCE.PLAYER,
            sourceBarId: fields.sourceBarId ?? null,
            sourceBarTitle: fields.sourceBarTitle ?? null,
            externalSource: fields.externalSource ?? null,
            campaignRef: fields.campaignRef ?? null,
            gameMasterFace: fields.gameMasterFace ?? null,
            location: fields.location ?? null,
        };
        this.bars.unshift(bar);
        return { ok: true, bar };
    }

    importBarsEnginePayload(payload) {
        const sourceBarId = payload?.bar?.id;
        if (!sourceBarId) return { ok: false, reason: 'missing_source_bar' };

        const existingCard = this.cards.find((card) => card.sourceBarId === sourceBarId);
        if (existingCard) {
            const existingBar = this.bars.find((bar) => bar.sourceBarId === sourceBarId) ?? null;
            return { ok: true, bar: existingBar, card: existingCard, reason: 'already_imported' };
        }

        const title = payload.bar.title || 'Imported BAR';
        const description = payload.bar.description || 'No description was provided.';
        const emotionTag = payload.bar.emotionHint || 'fear';
        const intensity = normalizeImportedIntensity(payload.bar.intensity);
        const location = payload.location?.kind === 'hand'
            ? `hand:${payload.location.slotIndex + 1}${payload.location.isCarrying ? ':carrying' : ''}`
            : 'vault';

        const added = this.tryAddBar({
            behavior: title,
            activation: description,
            result: `Tend this charge as ${emotionTag}`,
            emotionTag,
            intensity,
            sourceBarId,
            sourceBarTitle: title,
            externalSource: 'bars-engine',
            campaignRef: payload.bar.campaignRef ?? null,
            gameMasterFace: payload.bar.gameMasterFace ?? null,
            location,
        });

        if (!added.ok) return added;

        const minted = this.mintFromBar(added.bar.id);
        if (!minted.ok) return minted;

        minted.card.sourceBarId = sourceBarId;
        minted.card.sourceBarTitle = title;
        minted.card.externalSource = 'bars-engine';
        minted.card.campaignRef = payload.bar.campaignRef ?? null;
        minted.card.gameMasterFace = payload.bar.gameMasterFace ?? null;
        minted.card.emotionId = emotionTag;
        minted.card.seedQuality = Math.max(20, Math.min(100, Math.round(20 + intensity * 0.4)));
        minted.card.location = location;

        return { ok: true, bar: added.bar, card: minted.card };
    }

    /**
     * @param {string} barId
     * @returns {{ ok: boolean, card?: object, reason?: string }}
     */
    mintFromBar(barId) {
        if (this.mintedBarIds.has(barId)) {
            const existing = this.cards.find((c) => c.provenanceBarId === barId);
            return existing ? { ok: true, card: existing, reason: 'already_minted' } : { ok: false, reason: 'already_minted' };
        }
        const bar = this.bars.find((b) => b.id === barId);
        if (!bar) return { ok: false, reason: 'no_bar' };

        const r = (bar.result || '').trim();
        const title = `Witness · ${r.length > 32 ? `${r.slice(0, 29)}…` : r}`;
        const body = [`B: ${bar.behavior}`, `A: ${bar.activation}`, `R: ${bar.result}`].join('\n');
        const card = {
            id: newId(),
            createdAt: Date.now(),
            provenanceBarId: barId,
            title,
            body,
            kind: CARD_KIND.WITNESS,
            tags: [],
            spent: false,
            sourceBarId: bar.sourceBarId ?? null,
            sourceBarTitle: bar.sourceBarTitle ?? null,
            externalSource: bar.externalSource ?? null,
            campaignRef: bar.campaignRef ?? null,
            gameMasterFace: bar.gameMasterFace ?? null,
            emotionId: bar.emotionTag ?? null,
            seedQuality: Math.max(20, Math.min(100, Math.round(20 + (Number(bar.intensity) || 55) * 0.4))),
        };
        this.cards.unshift(card);
        this.order = [card.id, ...this.order.filter((id) => id !== card.id)];
        this.mintedBarIds.add(barId);
        return { ok: true, card };
    }

    /**
     * @param {string} cardId
     * @param {import('./CultivationSystem.js').CultivationSystem} cultivation
     */
    trySpendCardForCultivationReflection(cardId, cultivation) {
        const card = this.cards.find((c) => c.id === cardId);
        if (!card || card.spent) {
            return { ok: false, reason: 'invalid' };
        }
        card.spent = true;

        const lines = (card.body || '').split('\n').filter(Boolean);
        const quoteLine = lines.find((l) => l.startsWith('R:')) || lines[0] || card.title;
        const snippet = quoteLine.length > 90 ? `${quoteLine.slice(0, 87)}…` : quoteLine;

        cultivation.addExp(12);

        return {
            ok: true,
            message: `You sit with: “${snippet}” — insight settles. (+12 cultivation XP)`,
        };
    }

    getPlayableCards() {
        return this.cards.filter((c) => !c.spent);
    }

    exportBridgePayloadForCard(cardId) {
        const card = this.cards.find((c) => c.id === cardId);
        if (!card) return { ok: false, reason: 'no_card' };
        const bar = this.bars.find((b) => b.id === card.provenanceBarId);
        if (!bar) return { ok: false, reason: 'no_bar' };
        return { ok: true, payload: buildBridgeExport(bar, card) };
    }
}
