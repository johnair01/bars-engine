'use server'

import { generateFromTemplate } from '@/lib/template-library'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function generateFromTemplateAction(
  templateId: string,
  options?: { campaignRef?: string; subcampaignDomain?: string }
) {
  const adventure = await generateFromTemplate(templateId, options)
  revalidatePath('/admin/adventures')
  revalidatePath('/admin/templates')
  redirect(`/admin/adventures/${adventure.id}`)
}
