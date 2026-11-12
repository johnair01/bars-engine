// The Between: the player's people. Loads the shared tokens (public/ui/tokens.css) and the three card families
// (Marcellus, Atkinson Hyperlegible, Caveat) scoped to this route, the way src/app/deck/layout.tsx scopes its fonts.
export default function BetweenPeopleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router has no _document; fonts scoped to this route */}
      <link
        href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Caveat:wght@500;700&family=Marcellus&display=swap"
        rel="stylesheet"
      />
      {/* eslint-disable-next-line @next/next/no-css-tags -- the generated token sheet is served from public/ */}
      <link rel="stylesheet" href="/ui/tokens.css" />
      <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ background: 'var(--ui-bg, #140e0b)', color: 'var(--ui-ink, #f6ecdc)' }}>
        {children}
      </div>
    </>
  )
}
