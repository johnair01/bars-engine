const STEPS = [
  {
    title: 'Get your invite',
    desc: 'You received the link — you\'re in. Sign up or log in to get started.',
  },
  {
    title: 'Go through the experience',
    desc: 'Explore the invite story, choose your path, and engage with the app before the weekend.',
  },
  {
    title: 'Friday drops the signal',
    desc: 'Check the app Friday evening. Your activity unlocks Saturday\'s address and details.',
  },
  {
    title: 'Saturday night — show up',
    desc: 'The party starts at 8 PM. Arrive curious. Follow the signals.',
  },
  {
    title: 'Sunday — play the game',
    desc: 'Collaborators gather at The Bruised Banana for the role-playing game. Invite only.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="event-section" style={{ background: 'var(--ep-surface)' }}>
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
