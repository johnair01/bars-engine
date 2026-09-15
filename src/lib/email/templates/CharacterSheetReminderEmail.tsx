import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'

/**
 * The character sheet's quarterly reminder, with a blank copy attached.
 *
 * The page promised "One reminder a quarter, with a blank copy attached.
 * Nothing else." So this carries the sheet, Appendix H's reason for re-filling
 * it, and the way out. Nothing is sold and nothing points at another list.
 *
 * The PDF travels as an attachment, set by the sender in `sheet-reminder.ts`.
 * Styling mirrors SuperpowerResultEmail so every send reads as one sender.
 */

export type CharacterSheetReminderEmailProps = {
  firstName?: string | null
  /** Absolute URL to the fillable PDF, for readers who would rather type. */
  fillableUrl: string
  /** Absolute URL to the unsubscribe page for this contact. */
  unsubscribeUrl: string
  /** The sender's postal address, which list mail is required to carry. */
  postalAddress: string
}

export const CHARACTER_SHEET_REMINDER_SUBJECT = "This quarter's blank character sheet"

const APPENDIX_H =
  'Date every version. Across a year of play you can watch your face, your shadow and your myths move.'

const main = { backgroundColor: '#0a0908', color: '#e8e6e0', fontFamily: 'Georgia, serif' }
const container = { margin: '0 auto', padding: '32px 24px', maxWidth: '560px' }
const eyebrow = {
  fontSize: '11px',
  letterSpacing: '3px',
  textTransform: 'uppercase' as const,
  color: '#34d399',
  fontFamily: 'Helvetica, Arial, sans-serif',
  margin: '0 0 12px',
}
const heading = { fontSize: '26px', lineHeight: '1.25', color: '#ffffff', margin: '0 0 16px' }
const text = { fontSize: '16px', lineHeight: '1.7', color: '#d6d3cd', margin: '0 0 16px' }
const quote = { ...text, fontStyle: 'italic' as const, borderLeft: '2px solid #34d399', paddingLeft: '14px' }
const hr = { borderColor: '#26241f', margin: '28px 0' }
const muted = { fontSize: '13px', lineHeight: '1.6', color: '#8a877f', margin: '0 0 8px' }
const link = { color: '#34d399' }

export function CharacterSheetReminderEmail({
  firstName,
  fillableUrl,
  unsubscribeUrl,
  postalAddress,
}: CharacterSheetReminderEmailProps) {
  const greeting = firstName ? `${firstName}, a blank sheet.` : 'A blank sheet.'
  return (
    <Html>
      <Head />
      <Preview>This quarter&apos;s character sheet is attached, ready to print.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Mastering Allyship</Text>
          <Heading style={heading}>{greeting}</Heading>

          <Text style={text}>
            This quarter&apos;s blank character sheet is attached, ready to print. If you would
            rather type,{' '}
            <Link href={fillableUrl} style={link}>
              the fillable version is on the site
            </Link>
            .
          </Text>

          <Text style={text}>Appendix H asks for this:</Text>
          <Text style={quote}>{APPENDIX_H}</Text>

          <Text style={text}>
            Fill this one in as you are now. Only then take out the last one and lay the two side
            by side.
          </Text>

          <Text style={text}>Wendell</Text>

          <Hr style={hr} />

          <Text style={muted}>
            This is the one reminder a quarter you asked for on the character sheet page.{' '}
            <Link href={unsubscribeUrl} style={link}>
              Unsubscribe
            </Link>{' '}
            to stop these and any other list email from me. Reply to this email and it reaches a
            real person.
          </Text>
          <Text style={muted}>{postalAddress}</Text>
        </Container>
      </Body>
    </Html>
  )
}

/** Plain-text fallback. Improves deliverability and serves text-only clients. */
export function characterSheetReminderText({
  firstName,
  fillableUrl,
  unsubscribeUrl,
  postalAddress,
}: CharacterSheetReminderEmailProps): string {
  const greeting = firstName ? `${firstName}, a blank sheet.` : 'A blank sheet.'
  return [
    'MASTERING ALLYSHIP',
    '',
    greeting,
    '',
    "This quarter's blank character sheet is attached, ready to print.",
    `If you would rather type, the fillable version is here: ${fillableUrl}`,
    '',
    'Appendix H asks for this:',
    `"${APPENDIX_H}"`,
    '',
    'Fill this one in as you are now. Only then take out the last one and lay the',
    'two side by side.',
    '',
    'Wendell',
    '',
    '---',
    'This is the one reminder a quarter you asked for on the character sheet page.',
    `Unsubscribe from these and any other list email from me: ${unsubscribeUrl}`,
    'Reply to this email and it reaches a real person.',
    '',
    postalAddress,
  ].join('\n')
}

export default CharacterSheetReminderEmail
