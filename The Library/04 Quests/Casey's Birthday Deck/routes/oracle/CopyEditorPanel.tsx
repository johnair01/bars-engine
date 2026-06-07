import { CREAM, GOLD } from "./cardLayout";
import { DEPTHS, type CardCopyDraft, type Depth } from "./copyEditor";

type CopyEditorPanelProps = {
  draft: CardCopyDraft;
  activeDepth: Depth;
  busy: boolean;
  error: string | null;
  onDepthChange: (depth: Depth) => void;
  onDraftChange: (draft: CardCopyDraft) => void;
  onSave: () => void;
  onCancel: () => void;
};

const fieldLabel: React.CSSProperties = {
  color: GOLD,
  fontFamily: "Georgia, serif",
  fontSize: "0.65rem",
  letterSpacing: "0.06em",
  margin: "0 0 0.25rem",
  opacity: 0.85,
};

const fieldInput: React.CSSProperties = {
  width: "100%",
  background: "#111",
  border: "1px solid #C9A84C44",
  borderRadius: 6,
  color: CREAM,
  fontFamily: "Georgia, serif",
  fontSize: "0.8rem",
  padding: "0.5rem 0.6rem",
  boxSizing: "border-box",
};

function chromeBtnStyle(primary = false, disabled = false): React.CSSProperties {
  return {
    background: primary ? GOLD : "transparent",
    border: primary ? "none" : `1px solid ${GOLD}`,
    borderRadius: 4,
    color: primary ? "#0F3B2F" : GOLD,
    fontFamily: "Georgia, serif",
    fontSize: "0.75rem",
    fontWeight: primary ? "bold" : "normal",
    padding: "0.4rem 1rem",
    cursor: disabled ? "default" : "pointer",
    letterSpacing: "0.05em",
    opacity: disabled ? 0.6 : 1,
  };
}

export function CopyEditorPanel({
  draft,
  activeDepth,
  busy,
  error,
  onDepthChange,
  onDraftChange,
  onSave,
  onCancel,
}: CopyEditorPanelProps) {
  const flavor = draft.flavor[activeDepth];

  const setTitle = (title: string) => onDraftChange({ ...draft, title });
  const setFlavorField = (key: keyof typeof flavor, value: string) =>
    onDraftChange({
      ...draft,
      flavor: {
        ...draft.flavor,
        [activeDepth]: { ...flavor, [key]: value },
      },
    });
  const setPrompt = (value: string) =>
    onDraftChange({
      ...draft,
      prompts: { ...draft.prompts, [activeDepth]: value },
    });

  return (
    <div
      style={{
        marginTop: "0.75rem",
        width: "100%",
        maxWidth: 420,
        background: "rgba(17,17,17,0.95)",
        border: `1px solid ${GOLD}`,
        borderRadius: 8,
        padding: "0.85rem",
      }}
    >
      <p style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "0.8rem", margin: "0 0 0.75rem", textAlign: "center" }}>
        Edit copy
      </p>

      <label style={{ display: "block", marginBottom: "0.75rem" }}>
        <p style={fieldLabel}>CARD TITLE</p>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => setTitle(e.target.value)}
          style={fieldInput}
        />
      </label>

      <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center", marginBottom: "0.75rem" }}>
        {DEPTHS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onDepthChange(d)}
            style={{
              ...chromeBtnStyle(activeDepth === d),
              textTransform: "capitalize",
            }}
          >
            {d}
          </button>
        ))}
      </div>

      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        <p style={fieldLabel}>FLAVOR LINE</p>
        <textarea
          value={flavor.line}
          onChange={(e) => setFlavorField("line", e.target.value)}
          rows={2}
          style={{ ...fieldInput, resize: "vertical", minHeight: 52 }}
        />
      </label>

      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        <p style={fieldLabel}>NPC NAME</p>
        <input
          type="text"
          value={flavor.npc}
          onChange={(e) => setFlavorField("npc", e.target.value)}
          style={fieldInput}
        />
      </label>

      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        <p style={fieldLabel}>FLAVOR TITLE</p>
        <input
          type="text"
          value={flavor.title}
          onChange={(e) => setFlavorField("title", e.target.value)}
          style={fieldInput}
        />
      </label>

      <label style={{ display: "block", marginBottom: "0.75rem" }}>
        <p style={fieldLabel}>PROMPT</p>
        <textarea
          value={draft.prompts[activeDepth]}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          style={{ ...fieldInput, resize: "vertical", minHeight: 72 }}
        />
      </label>

      {error && (
        <p style={{ color: "#e8a090", fontFamily: "Georgia, serif", fontSize: "0.72rem", margin: "0 0 0.5rem", textAlign: "center" }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
        <button type="button" onClick={onSave} disabled={busy} style={chromeBtnStyle(true, busy)}>Save copy</button>
        <button type="button" onClick={onCancel} disabled={busy} style={chromeBtnStyle(false, busy)}>Cancel</button>
      </div>
    </div>
  );
}
