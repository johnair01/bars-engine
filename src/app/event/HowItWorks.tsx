const STEPS = [
  {
    title: 'Get your invite',
    desc: 'You received the link — you\'re in. Log in or sign up to track your status.',
  },
  {
    title: 'RSVP on Partiful',
    desc: 'Confirm your attendance for Friday, Saturday, or both.',
  },
  {
    title: 'Friday night unlocks Saturday',
    desc: 'Show up Friday and the full Saturday details — location, schedule, roles — are revealed.',
  },
  {
    title: 'Show up and play',
    desc: 'Arrive curious. Follow the signals. The game will find you.',
  },
]

export function HowItWorks() {
  return (
    <section className="event-section" style={{ background: 'var(--ep-surface)' }}>
      <div className="event-section-inner">
        <h2 className="event-section-title">How It Works</h2>
        <div className="steps-list">
          {STEPS.map((step, i) => (
            <div key={i} className="step-item">
              <div className="step-number">{i + 1}</div>
              <div>
                <div className="step-content-title">{step.title}</div>
                <div className="step-content-desc">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
