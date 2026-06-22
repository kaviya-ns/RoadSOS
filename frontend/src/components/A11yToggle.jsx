import { useA11y } from "../context/AccessibilityContext";

export default function A11yToggle() {
  const { a11y, toggle } = useA11y();

  return (
    <button
      onClick={toggle}
      title={a11y ? "Switch to Standard Mode" : "Switch to Accessible Mode"}
      style={{
        background:   a11y ? "rgba(251,191,36,0.15)" : "var(--surface2)",
        border:       `1px solid ${a11y ? "rgba(251,191,36,0.5)" : "var(--border)"}`,
        borderRadius: "100px",
        padding:      "6px 12px",
        cursor:       "pointer",
        display:      "flex",
        alignItems:   "center",
        gap:          "6px",
        fontSize:     "12px",
        fontWeight:   600,
        color:        a11y ? "#fbbf24" : "var(--text-muted)",
        fontFamily:   "var(--font-body)",
        transition:   "all 0.2s",
        flexShrink:   0,
      }}
    >
      <span style={{ fontSize: "14px" }}>👁</span>
      {a11y ? "Standard" : "Accessible"}
    </button>
  );
}
