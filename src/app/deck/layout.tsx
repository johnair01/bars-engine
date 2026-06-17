// Full-screen shell for the Allyship Deck app. Loads the deck-experience fonts
// (Jost / Nunito / Space Mono) scoped to this route — the cultivation-card aesthetic
// from the design handoff. The rest of the app uses Geist.
export default function DeckLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router has no _document; fonts scoped to this route */}
      <link
        href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700;800&family=Nunito:ital,wght@0,400;0,600;0,700;1,400&family=Space+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />
      <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ background: "#0a0908" }}>
        {children}
      </div>
    </>
  );
}
