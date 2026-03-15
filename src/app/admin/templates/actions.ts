'use server'

import { generateFromTemplate } from '@/lib/template-library'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function generateFromTemplateAction(templateId: string) {
  const adventure = await generateFromTemplate(templateId)
  revalidatePath('/admin/adventures')
  revalidatePath('/admin/templates')
  redirect(`/admin/adventures/${adventure.id}`)
}
