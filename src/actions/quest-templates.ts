'use server'

import { QUEST_TEMPLATES } from '@/lib/quest-templates'

const DEPRECATED_TEMPLATE_IDS = ['party-logistics', 'connection', 'inner-external']

export async function getQuestTemplates() {
    return QUEST_TEMPLATES
}

export async function validateQuestData(templateId: string, data: any) {
    if (DEPRECATED_TEMPLATE_IDS.includes(templateId)) {
        return { valid: false, error: 'Template deprecated' }
    }
    const template = QUEST_TEMPLATES.find(t => t.id === templateId)
    if (!template) return { valid: false, error: 'Invalid template' }

    if (!data.title || data.title.length < 3) return { valid: false, error: 'Title required (min 3 chars)' }
    if (!data.description || data.description.length < 10) return { valid: false, error: 'Description required (min 10 chars)' }

    return { valid: true }
}
