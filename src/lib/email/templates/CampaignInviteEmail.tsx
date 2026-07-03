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

export type CampaignInviteEmailProps = {
  inviterDisplayName: string
  eventTitle: string
  eventDescription: string
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
  color: '#a855f7',
  fontFamily: 'Helvetica, Arial, sans-serif',
  margin: '0 0 12px',
}
const heading = { fontSize: '24px', lineHeight: '1.3', color: '#ffffff', margin: '0 0 16px' }
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

export function CampaignInviteEmail({
  inviterDisplayName,
  eventTitle,
  eventDescription,
  ctaUrl,
  settingsUrl,
  unsubscribeUrl,
}: CampaignInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{inviterDisplayName} invited you — {eventTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>BARS Engine</Text>
          <Heading style={heading}>You&apos;re invited</Heading>

          <Text style={text}>
            <strong style={{ color: '#f4f2ec' }}>{inviterDisplayName}</strong> invited you to{' '}
            <strong style={{ color: '#f4f2ec' }}>{eventTitle}</strong>.
          </Text>

          {eventDescription ? <Text style={text}>{eventDescription}</Text> : null}

          <Section style={{ margin: '24px 0' }}>
            <Button href={ctaUrl} style={button}>
              View invitation →
            </Button>
          </Section>

          <Text style={text}>
            The invitation also lives in your Inspirations when you sign in — no rush to respond.
          </Text>

          <Hr style={hr} />

          <Text style={muted}>
            <Link href={settingsUrl} style={link}>
              Notification settings
            </Link>
            {' · '}
            <Link href={unsubscribeUrl} style={link}>
              Turn off invite emails
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export function campaignInviteText(props: CampaignInviteEmailProps): string {
  return [
    'BARS ENGINE — You are invited',
    '',
    `${props.inviterDisplayName} invited you to ${props.eventTitle}.`,
    '',
    props.eventDescription,
    '',
    `View invitation: ${props.ctaUrl}`,
    '',
    'The invitation also lives in your Inspirations when you sign in.',
    '',
    `Settings: ${props.settingsUrl}`,
    `Turn off invite emails: ${props.unsubscribeUrl}`,
  ]
    .filter(Boolean)
    .join('\n')
}

export default CampaignInviteEmail
