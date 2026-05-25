export default function OracleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto"
      style={{ background: "#0F3B2F" }}
    >
      {children}
    </div>
  );
}
