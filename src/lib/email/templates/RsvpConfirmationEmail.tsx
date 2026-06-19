import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { AwakenEvent } from '@/lib/awaken/content'
import { googleCalendarUrl } from '@/lib/awaken/calendar'

/**
 * RSVP confirmation for the July 17–19 weekend. Confirms what they signed up
 * for, hands them add-to-calendar links so the commitment sticks (Diplomat:
 * connect onward, screen → in-person), and keeps a human reply-to.
 *
 * Authored copy, human voice — no AI-generated tone (Portland community).
 */

export type RsvpConfirmationEmailProps = {
  /** The events the visitor actually RSVP'd to (already filtered/validated). */
  events: AwakenEvent[]
  firstName?: string | null
  /** Absolute URL back to the funnel. */
  homeUrl: string
}

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
const card = {
  border: '1px solid #26241f',
  borderRadius: '12px',
  padding: '16px 18px',
  margin: '0 0 12px',
}
const eventWhen = {
  fontSize: '12px',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  color: '#34d399',
  fontFamily: 'Helvetica, Arial, sans-serif',
  margin: '0 0 4px',
}
const eventTitle = { fontSize: '18px', color: '#ffffff', margin: '0 0 4px' }
const eventMeta = { fontSize: '13px', color: '#8a877f', margin: '0 0 10px' }
const calLink = {
  fontSize: '13px',
  fontFamily: 'Helvetica, Arial, sans-serif',
  color: '#34d399',
  textDecoration: 'none',
}
const hr = { borderColor: '#26241f', margin: '28px 0' }
const muted = { fontSize: '13px', lineHeight: '1.6', color: '#8a877f', margin: '0 0 8px' }
const button = {
  backgroundColor: '#059669',
  color: '#ffffff',
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontWeight: 'bold',
  fontSize: '15px',
  borderRadius: '10px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}

export function RsvpConfirmationEmail({ events, firstName, homeUrl }: RsvpConfirmationEmailProps) {
  const greeting = firstName ? `${firstName}, you're on the list.` : "You're on the list."
  const count = events.length
  return (
    <Html>
      <Head />
      <Preview>{`You're confirmed for ${count} event${count === 1 ? '' : 's'} the weekend of July 18th.`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Mastering Allyship · Jul 17–19</Text>
          <Heading style={heading}>{greeting}</Heading>

          <Text style={text}>
            Thank you for showing up — really. Here&apos;s what you&apos;re in for. Add each one to
            your calendar so the weekend stays real between now and then.
          </Text>

          {events.map((ev) => (
            <Section key={ev.key} style={card}>
              <Text style={eventWhen}>{ev.when}</Text>
              <Text style={eventTitle}>{ev.title}</Text>
              <Text style={eventMeta}>{ev.where}</Text>
              <Link href={googleCalendarUrl(ev)} style={calLink}>
                + Add to calendar
              </Link>
            </Section>
          ))}

          <Hr style={hr} />

          <Section style={{ margin: '8px 0 20px' }}>
            <Button href={homeUrl} style={button}>
              See everything for the weekend →
            </Button>
          </Section>

          <Text style={muted}>
            Plans change — if you can&apos;t make one, no guilt. Just reply to this email and let us
            know. It reaches a real person.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

/** Plain-text fallback — improves deliverability and serves text-only clients. */
export function rsvpConfirmationText({
  events,
  firstName,
  homeUrl,
}: RsvpConfirmationEmailProps): string {
  const greeting = firstName ? `${firstName}, you're on the list.` : "You're on the list."
  const lines = [
    'MASTERING ALLYSHIP · JUL 17–19',
    '',
    greeting,
    '',
    'Thank you for showing up. Here is what you are in for — add each one to your',
    'calendar so the weekend stays real between now and then.',
    '',
  ]
  for (const ev of events) {
    lines.push(`${ev.when} — ${ev.title}`)
    lines.push(`  ${ev.where}`)
    lines.push(`  Add to calendar: ${googleCalendarUrl(ev)}`)
    lines.push('')
  }
  lines.push(`See everything for the weekend: ${homeUrl}`)
  lines.push('')
  lines.push('Plans change — if you cannot make one, no guilt. Just reply to this email.')
  return lines.join('\n')
}

export default RsvpConfirmationEmail
