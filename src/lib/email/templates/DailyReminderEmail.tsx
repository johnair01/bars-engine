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

export type DailyReminderEmailProps = {
  playerFirstName?: string | null
  ctaUrl: string
  settingsUrl: string
  unsubscribeUrl: string
}

const main = { backgroundColor: '#0a0908', color: '#e8e6e0', fontFamily: 'Georgia, serif' }
const container = { margin: '0 auto', padding: '32px 24px', maxWidth: '560px' }
const eyebrow = {
  fontSize: '11px',
  letterSpacing: '3px',
  textTransform: 'uppercase' as const,
  color: '#7c3aed',
  fontFamily: 'Helvetica, Arial, sans-serif',
  margin: '0 0 12px',
}
const heading = { fontSize: '22px', lineHeight: '1.3', color: '#ffffff', margin: '0 0 16px' }
const text = { fontSize: '16px', lineHeight: '1.7', color: '#d6d3cd', margin: '0 0 16px' }
const button = {
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontWeight: 'bold',
  fontSize: '15px',
  borderRadius: '10px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const hr = { borderColor: '#26241f', margin: '28px 0' }
const muted = { fontSize: '13px', lineHeight: '1.6', color: '#8a877f', margin: '0 0 8px' }
const link = { color: '#a855f7' }

export function DailyReminderEmail({
  playerFirstName,
  ctaUrl,
  settingsUrl,
  unsubscribeUrl,
}: DailyReminderEmailProps) {
  const greeting = playerFirstName ? `${playerFirstName}, a gentle nudge.` : 'A gentle nudge.'
  return (
    <Html>
      <Head />
      <Preview>Open Tap the Vein when you are ready — no rush.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Your practice</Text>
          <Heading style={heading}>{greeting}</Heading>

          <Text style={text}>
            When you have a few minutes, Tap the Vein is open. Name up to five honest moves for
            today — or skip entirely. Resting is allowed.
          </Text>

          <Section style={{ margin: '24px 0' }}>
            <Button href={ctaUrl} style={button}>
              Open Tap the Vein →
            </Button>
          </Section>

          <Text style={text}>
            You asked for this reminder. We will not count streaks or tell you that you are behind.
          </Text>

          <Hr style={hr} />

          <Text style={muted}>
            <Link href={settingsUrl} style={link}>
              Notification settings
            </Link>
            {' · '}
            <Link href={unsubscribeUrl} style={link}>
              Turn off daily reminders
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export function dailyReminderText(props: DailyReminderEmailProps): string {
  const greeting = props.playerFirstName ? `${props.playerFirstName}, a gentle nudge.` : 'A gentle nudge.'
  return [
    'YOUR PRACTICE',
    '',
    greeting,
    '',
    'When you have a few minutes, Tap the Vein is open. Name up to five honest moves for today — or skip entirely.',
    '',
    `Open Tap the Vein: ${props.ctaUrl}`,
    '',
    'You asked for this reminder. We will not count streaks or tell you that you are behind.',
    '',
    `Settings: ${props.settingsUrl}`,
    `Turn off daily reminders: ${props.unsubscribeUrl}`,
  ].join('\n')
}

export default DailyReminderEmail
