import { useEffect } from "react";

const RISK_COLORS = {
  critical: "#ef4444",
  high:     "#f97316",
  moderate: "#f59e0b",
  low:      "#22c55e",
};

const HAZARD_EMOJIS = {
  accident: "💥", pothole: "🕳️", flooding: "🌊",
  debris: "🪨", animal: "🐄", other: "⚠️",
};

export default function ProximityWarning({ warning, onDismiss }) {
  const isRiskZone = warning.type === "risk_zone";
  const color      = isRiskZone
    ? RISK_COLORS[warning.risk_level] || "#f59e0b"
    : "#f59e0b";
  const distKm     = (warning.distance_m / 1000).toFixed(1);

  // vibrate on critical zones
  useEffect(() => {
    if (isRiskZone && warning.risk_level === "critical" && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [warning.key]);

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.banner, borderLeftColor: color, borderTopColor: color }}>

        {/*  icon + title  */}
        <div style={styles.top}>
          <div style={{ ...styles.iconBox, background: color + "22", borderColor: color }}>
            <span style={styles.icon}>
              {isRiskZone ? "⚠️" : (HAZARD_EMOJIS[warning.name] || "⚠️")}
            </span>
          </div>

          <div style={styles.titleBlock}>
            <div style={styles.titleRow}>
              {isRiskZone && (
                <span style={{ ...styles.badge, background: color + "22", color, borderColor: color }}>
                  {warning.risk_level?.toUpperCase()}
                </span>
              )}
              <span style={styles.tag}>
                {isRiskZone ? warning.highway : "LIVE HAZARD"}
              </span>
            </div>
            <span style={styles.name}>{isRiskZone ? warning.name : warning.name.toUpperCase()}</span>
          </div>

          <button style={styles.closeBtn} onClick={onDismiss}>✕</button>
        </div>

        {/*  distance pill */}
        <div style={{ ...styles.distPill, borderColor: color }}>
          <span style={{ color }}>📍 {distKm} km ahead</span>
        </div>

        {/*  details */}
        {isRiskZone && warning.peak_hours && (
          <div style={styles.detail}>
            <span style={styles.detailIcon}>🕐</span>
            <span style={styles.detailText}>Peak risk: {warning.peak_hours}</span>
          </div>
        )}
        {warning.reason && (
          <div style={styles.detail}>
            <span style={styles.detailIcon}>ℹ️</span>
            <span style={styles.detailText}>{warning.reason}</span>
          </div>
        )}

        {/*  actions  */}
        <div style={styles.actions}>
          <button style={{ ...styles.dismissBtn, borderColor: color, color }}>
            🗺 Consider Alternate Route
          </button>
          <button style={styles.gotItBtn} onClick={onDismiss}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay:     { position: "fixed", inset: 0, zIndex: 900, display: "flex", alignItems: "flex-end", pointerEvents: "none" },
  banner:      {
    width: "100%", background: "var(--surface)",
    borderTop: "2px solid", borderLeft: "4px solid",
    padding: "16px", display: "flex", flexDirection: "column", gap: "10px",
    boxShadow: "0 -4px 30px rgba(0,0,0,0.4)",
    pointerEvents: "all",
    animation: "slideUp 0.3s ease-out",
  },
  top:         { display: "flex", alignItems: "flex-start", gap: "12px" },
  iconBox:     { width: "44px", height: "44px", borderRadius: "50%", border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  icon:        { fontSize: "22px" },
  titleBlock:  { flex: 1, display: "flex", flexDirection: "column", gap: "3px" },
  titleRow:    { display: "flex", alignItems: "center", gap: "6px" },
  badge:       { fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", border: "1px solid", letterSpacing: "0.08em" },
  tag:         { fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.1em" },
  name:        { fontSize: "15px", fontWeight: 700, color: "var(--text)", lineHeight: 1.3 },
  closeBtn:    { background: "none", border: "none", color: "var(--text-muted)", fontSize: "18px", cursor: "pointer", flexShrink: 0, pointerEvents: "all" },
  distPill:    { display: "inline-flex", alignItems: "center", background: "var(--surface2)", border: "1px solid", borderRadius: "100px", padding: "4px 12px", fontSize: "13px", fontWeight: 600, alignSelf: "flex-start" },
  detail:      { display: "flex", gap: "8px", alignItems: "flex-start" },
  detailIcon:  { fontSize: "13px", flexShrink: 0 },
  detailText:  { fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 },
  actions:     { display: "flex", gap: "8px" },
  dismissBtn:  { flex: 1, padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid", background: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" },
  gotItBtn:    { padding: "10px 20px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--surface2)", color: "var(--text)", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" },
};

const styleTag = document.createElement("style");
styleTag.textContent = `@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
document.head.appendChild(styleTag);
