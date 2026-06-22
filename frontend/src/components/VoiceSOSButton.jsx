import { useState, useRef, useCallback } from "react";
import { useVoiceSOS } from "../hooks/useVoiceSOS";

const HOLD_DURATION = 3000; // 3 seconds hold to trigger

export default function VoiceSOSButton({ onSosTriggered }) {
  const [mode,        setMode]        = useState("idle");   // idle | listening | holding | triggered
  const [holdPct,     setHoldPct]     = useState(0);
  const [transcript,  setTranscript]  = useState("");
  const [useHoldMode, setUseHoldMode] = useState(false);
  const holdInterval  = useRef(null);
  const holdStart     = useRef(null);

  // voice SOS 
  const { start, stop, supported } = useVoiceSOS({
    onNetworkError: () => { setUseHoldMode(true); setMode("idle"); },
    onTriggered: (word) => {
      setMode("triggered");
      setTimeout(() => { setMode("idle"); onSosTriggered(); }, 800);
    },
  });

  function handleVoiceTap() {
    if (mode === "listening") {
      stop(); setMode("idle"); setTranscript(""); return;
    }
    // try voice first
    try {
      start();
      setMode("listening");
    } catch {
      setUseHoldMode(true);
    }
  }

  // switch to hold mode if network error
  function onSpeechError() {
    setUseHoldMode(true);
    setMode("idle");
  }

  //  hold to SOS 
  function startHold() {
    holdStart.current = Date.now();
    setMode("holding");
    setHoldPct(0);

    holdInterval.current = setInterval(() => {
      const elapsed = Date.now() - holdStart.current;
      const pct     = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldPct(pct);
      if (elapsed >= HOLD_DURATION) {
        clearInterval(holdInterval.current);
        setMode("triggered");
        setTimeout(() => { setMode("idle"); setHoldPct(0); onSosTriggered(); }, 500);
      }
    }, 50);
  }

  function cancelHold() {
    if (mode !== "triggered") {
      clearInterval(holdInterval.current);
      setMode("idle");
      setHoldPct(0);
    }
  }

  // colors 
  const isActive   = mode === "listening" || mode === "holding";
  const isTriggered = mode === "triggered";
  const bgColor    = isTriggered ? "#22c55e" : isActive ? "#ef4444" : "var(--surface)";
  const borderColor= isTriggered ? "#22c55e" : isActive ? "#ef4444" : "var(--border)";

  // circumference for SVG ring
  const R   = 28;
  const C   = 2 * Math.PI * R;
  const dash = C - (holdPct / 100) * C;

  return (
    <>
      {/*  floating button  */}
      <button
        style={{
          ...styles.fab,
          background:  bgColor,
          border:      `2px solid ${borderColor}`,
          boxShadow:   isActive
            ? "0 0 0 8px rgba(239,68,68,0.2), 0 0 0 16px rgba(239,68,68,0.08)"
            : "0 4px 20px rgba(0,0,0,0.3)",
        }}
        onClick={!useHoldMode ? handleVoiceTap : undefined}
        onMouseDown={useHoldMode  ? startHold  : undefined}
        onMouseUp={useHoldMode    ? cancelHold : undefined}
        onMouseLeave={useHoldMode ? cancelHold : undefined}
        onTouchStart={useHoldMode ? startHold  : undefined}
        onTouchEnd={useHoldMode   ? cancelHold : undefined}
        title={useHoldMode ? "Hold 3 seconds to trigger SOS" : "Tap to activate voice SOS"}
      >
        {/* hold progress ring */}
        {useHoldMode && mode === "holding" && (
          <svg style={styles.ring} viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
            <circle cx="32" cy="32" r={R} fill="none" stroke="#fff" strokeWidth="3"
              strokeDasharray={C} strokeDashoffset={dash}
              strokeLinecap="round" transform="rotate(-90 32 32)"
              style={{ transition: "stroke-dashoffset 0.05s linear" }}
            />
          </svg>
        )}
        <span style={styles.fabIcon}>
          {isTriggered ? "✓" : useHoldMode ? "🆘" : mode === "listening" ? "🔴" : "🎙️"}
        </span>
      </button>

      {/*  status badge */}
      {(isActive || isTriggered) && (
        <div style={styles.badge}>
          <span style={{ ...styles.dot, background: isTriggered ? "#22c55e" : "#ef4444" }} />
          <span style={styles.badgeText}>
            {isTriggered
              ? "SOS triggered!"
              : useHoldMode
              ? `Hold... ${Math.round((holdPct / 100) * 3)}s`
              : transcript
              ? `Heard: "${transcript}"`
              : 'Say "emergency", "help", or "SOS"'}
          </span>
          {!isTriggered && (
            <button style={styles.cancelBtn} onClick={cancelHold}>✕</button>
          )}
        </div>
      )}

      {/*  mode label */}
      {mode === "idle" && (
        <div style={styles.modeLabel}>
          {useHoldMode ? "Hold 3s for SOS" : "Voice SOS"}
        </div>
      )}
    </>
  );
}

const styles = {
  fab: {
    position:       "fixed",
    bottom:         "24px",
    right:           "24px",
    width:          "64px",
    height:         "64px",
    borderRadius:   "50%",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    cursor:         "pointer",
    zIndex:         100,
    transition:     "all 0.2s",
    userSelect:     "none",
    WebkitUserSelect: "none",
  },
  ring: {
    position: "absolute",
    inset:    0,
    width:    "100%",
    height:   "100%",
  },
  fabIcon:  { fontSize: "26px", position: "relative", zIndex: 1 },
  badge: {
    position:     "fixed",
    bottom:       "100px",
    right:        "16px",
    left:         "16px",
    background:   "var(--surface)",
    border:       "1px solid rgba(239,68,68,0.4)",
    borderRadius: "var(--radius)",
    padding:      "12px 16px",
    display:      "flex",
    alignItems:   "center",
    gap:          "10px",
    zIndex:       100,
    boxShadow:    "0 4px 20px rgba(0,0,0,0.3)",
  },
  dot: {
    width:        "10px",
    height:       "10px",
    borderRadius: "50%",
    flexShrink:   0,
    animation:    "pulse 1s ease-in-out infinite",
  },
  badgeText:  { flex: 1, fontSize: "13px", color: "var(--text)" },
  cancelBtn:  { background: "none", border: "none", color: "var(--text-muted)", fontSize: "16px", cursor: "pointer", padding: "0 4px", flexShrink: 0 },
  modeLabel: {
    position:     "fixed",
    bottom:       "92px",
    right:         "16px",
    background:   "var(--surface)",
    border:       "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding:      "6px 12px",
    fontSize:     "11px",
    color:        "var(--text-muted)",
    zIndex:       100,
    whiteSpace:   "nowrap",
  },
};
