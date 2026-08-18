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
 * The Superpower quiz result, delivered.
 *
 * This template exists because the reveal made a promise the action could not
 * keep: `captureSuperpowerLead` returned "your result is on its way to your
 * inbox" while importing no send path at all. The address was stored and tagged
 * and the person received nothing.
 *
 * So the copy here is scoped to exactly what was promised on the page — the
 * home Face, the Face ranked last, and Chapter 9's reason the second one is
 * worth more. Nothing is sold. The reveal already stated the terms before the
 * address was asked for, and an email that arrives carrying a pitch instead of
 * the result is the same broken promise wearing a nicer suit.
 *
 * Styling mirrors ChapterOneEmail so the two sends read as one sender.
 */

export type SuperpowerResultEmailProps = {
  /** Display label, e.g. "Connector". Comes from SUPERPOWER_DEFS[x].label. */
  homeFace: string
  /** The Face ranked last. Null when the quiz did not produce one. */
  avoidedFace?: string | null
  /** Optional first name for a warmer greeting. */
  firstName?: string | null
  /** Absolute URL to the character sheet. */
  sheetUrl: string
  /** Absolute URL back to the quiz, for a retake. */
  quizUrl: string
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

export function SuperpowerResultEmail({
  homeFace,
  avoidedFace,
  firstName,
  sheetUrl,
  quizUrl,
}: SuperpowerResultEmailProps) {
  const greeting = firstName ? `${firstName}, here it is.` : 'Here it is.'
  return (
    <Html>
      <Head />
      <Preview>{`You run on ${homeFace}. Keeping a copy, as promised.`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>Mastering Allyship</Text>
          <Heading style={heading}>{greeting}</Heading>

          <Text style={text}>
            You run on <strong>{homeFace}</strong>. Under pressure that is the move your hands
            reach for first, before you have decided anything.
          </Text>

          {avoidedFace ? (
            <Text style={text}>
              You ranked <strong>{avoidedFace}</strong> last, and that is the more useful half of
              this result. Chapter 9 argues the Face you avoid is the one holding the part of the
              work you have been going around, and going around it costs more every year.
            </Text>
          ) : null}

          <Text style={text}>
            Treat it as a lens rather than a verdict. Take it again in a few months and watch it
            move.
          </Text>

          <Section style={{ margin: '24px 0' }}>
            <Button href={sheetUrl} style={button}>
              See the rest of your sheet →
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={muted}>
            That was one line of thirteen. The character sheet has the other twelve, and it is
            ungated —{' '}
            <Link href={sheetUrl} style={link}>
              fill it in whenever you like
            </Link>
            . To run the quiz again,{' '}
            <Link href={quizUrl} style={link}>
              it is here
            </Link>
            .
          </Text>
          <Text style={muted}>
            This is not an automated list. Reply to this email and it reaches a real person.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

/** Plain-text fallback — improves deliverability and serves text-only clients. */
export function superpowerResultText({
  homeFace,
  avoidedFace,
  firstName,
  sheetUrl,
  quizUrl,
}: SuperpowerResultEmailProps): string {
  const greeting = firstName ? `${firstName}, here it is.` : 'Here it is.'
  return [
    'MASTERING ALLYSHIP',
    '',
    greeting,
    '',
    `You run on ${homeFace}. Under pressure that is the move your hands reach for`,
    'first, before you have decided anything.',
    ...(avoidedFace
      ? [
          '',
          `You ranked ${avoidedFace} last, and that is the more useful half of this`,
          'result. Chapter 9 argues the Face you avoid is the one holding the part of',
          'the work you have been going around, and going around it costs more every year.',
        ]
      : []),
    '',
    'Treat it as a lens rather than a verdict. Take it again in a few months and',
    'watch it move.',
    '',
    `See the rest of your sheet: ${sheetUrl}`,
    '',
    'That was one line of thirteen. The character sheet has the other twelve, and',
    'it is ungated.',
    `Run the quiz again: ${quizUrl}`,
    '',
    'This is not an automated list. Reply to this email and it reaches a real person.',
  ].join('\n')
}

export default SuperpowerResultEmail
