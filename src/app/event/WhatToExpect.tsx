const EXPECT_ITEMS = [
  { icon: '♫', label: 'Music', desc: 'DJs and movement' },
  { icon: '◇', label: 'Mystery', desc: 'Signals to follow' },
  { icon: '◉', label: 'Appetite', desc: 'Feed the senses' },
  { icon: '⚑', label: 'Play', desc: 'Quests and roles' },
  { icon: '⊹', label: 'Signals', desc: 'Unlock what\'s next' },
  { icon: '⊕', label: 'Community', desc: 'Friends, strangers, allies' },
]

export function WhatToExpect() {
  return (
    <section id="expect" className="event-section" style={{ background: 'var(--ep-base)' }}>
      <div className="event-section-inner">
        <h2 className="event-section-title">What to Expect</h2>
        <div className="expect-grid">
          {EXPECT_ITEMS.map((item) => (
            <div key={item.label} className="expect-cell">
              <div className="expect-cell-icon">{item.icon}</div>
              <div className="expect-cell-label">{item.label}</div>
              <div className="expect-cell-desc">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
