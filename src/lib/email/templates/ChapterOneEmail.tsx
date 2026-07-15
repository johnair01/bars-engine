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

/**
 * Chapter One delivery email. This is the first contact inside the world —
 * a welcome over the threshold, not a download receipt (Shaman). We email a
 * link, never an attachment (Architect: swappable, trackable). Reply-to is a
 * human inbox, set by the email service (Diplomat).
 *
 * Authored copy, human voice — no AI-generated tone (Portland community).
 */

export type ChapterOneEmailProps = {
  /** Absolute URL to read/download Chapter One. */
  downloadUrl: string
  /** Optional first name for a warmer greeting. */
  firstName?: string | null
  /** Absolute URL back to the funnel (donate / events). */
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
const hr = { borderColor: '#26241f', margin: '28px 0' }
const muted = { fontSize: '13px', lineHeight: '1.6', color: '#8a877f', margin: '0 0 8px' }
const link = { color: '#34d399' }

export function ChapterOneEmail({ downloadUrl, firstName, homeUrl }: ChapterOneEmailProps) {
  const greeting = firstName ? `${firstName}, you're in.` : "You're in."
  return (
    <Html>
      <Head />
      <Preview>Chapter One is yours — start reading whenever you like.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Mastering Allyship</Text>
          <Heading style={heading}>{greeting}</Heading>

          <Text style={text}>
            Thank you for raising your hand. You just crossed from watching to walking — and the
            first chapter is ready for you.
          </Text>

          <Section style={{ margin: '24px 0' }}>
            <Button href={downloadUrl} style={button}>
              Read Chapter One →
            </Button>
          </Section>

          <Text style={text}>
            It opens the story we&apos;re all standing inside right now. Read it slowly. There&apos;s
            no rush and no test at the end.
          </Text>

          <Hr style={hr} />

          <Text style={muted}>
            When you&apos;re ready for the next step — the full book, the Allyship Deck, the Dojo,
            or direct practice work — it all lives here:{' '}
            <Link href={homeUrl} style={link}>
              everything you can do
            </Link>
            .
          </Text>
          <Text style={muted}>
            This isn&apos;t an automated list. Just reply to this email and it reaches a real person.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

/** Plain-text fallback — improves deliverability and serves text-only clients. */
export function chapterOneText({ downloadUrl, firstName, homeUrl }: ChapterOneEmailProps): string {
  const greeting = firstName ? `${firstName}, you're in.` : "You're in."
  return [
    'MASTERING ALLYSHIP',
    '',
    greeting,
    '',
    'Thank you for raising your hand. You just crossed from watching to walking,',
    'and the first chapter is ready for you.',
    '',
    `Read Chapter One: ${downloadUrl}`,
    '',
    'It opens the story we are all standing inside right now. Read it slowly.',
    'There is no rush and no test at the end.',
    '',
    `When you are ready for the next step — the full book, the Allyship Deck,`,
    `the Dojo, or direct practice work — it all lives here: ${homeUrl}`,
    '',
    'This is not an automated list. Just reply to this email and it reaches a real person.',
  ].join('\n')
}

export default ChapterOneEmail
