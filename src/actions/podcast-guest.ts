'use server'

import { z } from 'zod'
import { sendEmail } from '@/lib/email/send'

const podcastGuestSchema = z.object({
  name: z.string().trim().min(1, 'Tell me the name you want said on air.').max(120),
  pronouns: z.string().trim().max(80).optional(),
  email: z.string().trim().email('Enter a working email address.').max(254),
  work: z.string().trim().min(1, 'Tell me where you work or what you do.').max(300),
  topic: z.string().trim().min(1, 'Tell me what you would want to talk about.').max(1500),
  situation: z.string().trim().max(1500).optional(),
  links: z.string().trim().max(1500).optional(),
  website: z.string().max(500).optional(),
})

export type PodcastGuestFormState =
  | { ok: true; message: string }
  | { ok: false; message: string }
  | null

function value(formData: FormData, key: string): string {
  const entry = formData.get(key)
  return typeof entry === 'string' ? entry : ''
}

export async function submitPodcastGuest(
  _previous: PodcastGuestFormState,
  formData: FormData,
): Promise<PodcastGuestFormState> {
  const parsed = podcastGuestSchema.safeParse({
    name: value(formData, 'name'),
    pronouns: value(formData, 'pronouns'),
    email: value(formData, 'email'),
    work: value(formData, 'work'),
    topic: value(formData, 'topic'),
    situation: value(formData, 'situation'),
    links: value(formData, 'links'),
    website: value(formData, 'website'),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Check the form and try again.',
    }
  }

  // A hidden field catches simple form bots without inconveniencing a guest.
  if (parsed.data.website) {
    return { ok: true, message: "Got it. You'll hear from me at the email you gave." }
  }

  const { name, pronouns, email, work, topic, situation, links } = parsed.data
  const safeName = name.replace(/[\r\n]+/g, ' ').trim()
  const text = [
    `Name: ${name}`,
    `Pronouns: ${pronouns || 'Not provided'}`,
    `Email: ${email}`,
    `Work: ${work}`,
    '',
    'What they want to talk about:',
    topic,
    '',
    'A situation the episode could work on:',
    situation || 'Not provided',
    '',
    'Links:',
    links || 'Not provided',
  ].join('\n')

  const result = await sendEmail({
    to: 'wendell@masteringallyship.com',
    subject: `Podcast guest: ${safeName}`,
    replyTo: email,
    text,
    tags: [{ name: 'form', value: 'podcast-guest' }],
  })

  if (!result.ok || result.skipped) {
    console.error('[podcast-guest] submission email was not sent', result)
    return {
      ok: false,
      message: 'That did not send. Email wendell@masteringallyship.com instead.',
    }
  }

  return { ok: true, message: "Got it. You'll hear from me at the email you gave." }
}
