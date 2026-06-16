// Full-screen reader shell for the Allyship Deck, mirroring the Handbook/Oracle
// routes. Loads the same scoped book fonts (the rest of the app uses Geist).
export default function DeckLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router has no _document; fonts scoped to this route */}
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Spline+Sans+Mono:wght@400;500;600&family=Marcellus&display=swap"
        rel="stylesheet"
      />
      <div className="fixed inset-0 z-[60]" style={{ background: "#0a0a0c" }}>
        {children}
      </div>
    </>
  );
}
