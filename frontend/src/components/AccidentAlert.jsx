//accidentalert.jsx
import { useState, useEffect } from "react";

export default function AccidentAlert({ countdown, onImOk, onGetHelp }) {
  const [seconds, setSeconds] = useState(countdown);

  useEffect(() => {
	  if (seconds <= 0) return;  
	  
	  const t = setTimeout(() => {
	    const next = seconds - 1;
	    setSeconds(next);
	    if (next === 0) {
	      console.log("countdown reached 0, calling onGetHelp");
	      onGetHelp();
	    }
	  }, 1000);
	  
	  return () => clearTimeout(t);
   }, [seconds]);
  const pct = (seconds / countdown) * 100;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>

        {/* warning icon */}
        <div style={styles.iconRing}>
          <span style={styles.icon}>⚠️</span>
        </div>

        <h2 style={styles.title}>Accident Detected</h2>
        <p style={styles.subtitle}>
          A sudden stop was detected at high speed.{"\n"}
          Are you okay?
        </p>

        {/* countdown ring  */}
        <div style={styles.countdownBox}>
          <svg width="80" height="80" style={styles.svg}>
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="#ef4444"
              strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <span style={styles.countdownNum}>{seconds}</span>
        </div>

        <p style={styles.autoNote}>
          Emergency services will be alerted automatically in <strong>{seconds}s</strong>
        </p>

        {/* actions */}
        <div style={styles.actions}>
          <button style={styles.okBtn} onClick={onImOk}>
            ✓ I'm OK
          </button>
          <button style={styles.helpBtn} onClick={onGetHelp}>
            🆘 Get Help Now
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position:       "fixed",
    inset:          0,
    background:     "rgba(0,0,0,0.85)",
    zIndex:         1000,
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    padding:        "24px",
    backdropFilter: "blur(4px)",
  },
  modal: {
    background:     "var(--surface)",
    border:         "1px solid rgba(239,68,68,0.4)",
    borderRadius:   "var(--radius)",
    padding:        "32px 24px",
    maxWidth:       "360px",
    width:          "100%",
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    gap:            "16px",
    boxShadow:      "0 0 60px rgba(239,68,68,0.3)",
    textAlign:      "center",
  },
  iconRing: {
    width:          "64px",
    height:         "64px",
    borderRadius:   "50%",
    background:     "rgba(239,68,68,0.15)",
    border:         "2px solid rgba(239,68,68,0.5)",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
  },
  icon:        { fontSize: "28px" },
  title: {
    fontFamily:     "var(--font-display)",
    fontSize:       "22px",
    fontWeight:     800,
    color:          "var(--accent-red)",
  },
  subtitle: {
    fontSize:       "14px",
    color:          "var(--text-muted)",
    lineHeight:     1.6,
    whiteSpace:     "pre-line",
  },
  countdownBox: {
    position:       "relative",
    width:          "80px",
    height:         "80px",
  },
  svg: {
    position:       "absolute",
    inset:          0,
  },
  countdownNum: {
    position:       "absolute",
    inset:          0,
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontFamily:     "var(--font-display)",
    fontSize:       "28px",
    fontWeight:     800,
    color:          "var(--accent-red)",
  },
  autoNote: {
    fontSize:       "12px",
    color:          "var(--text-muted)",
    lineHeight:     1.5,
  },
  actions: {
    display:        "flex",
    flexDirection:  "column",
    gap:            "10px",
    width:          "100%",
  },
  okBtn: {
    padding:        "14px",
    borderRadius:   "var(--radius-sm)",
    border:         "1px solid var(--border)",
    background:     "var(--surface2)",
    color:          "var(--text)",
    fontSize:       "15px",
    fontWeight:     600,
    cursor:         "pointer",
    fontFamily:     "var(--font-body)",
  },
  helpBtn: {
    padding:        "14px",
    borderRadius:   "var(--radius-sm)",
    border:         "none",
    background:     "var(--accent-red)",
    color:          "#fff",
    fontSize:       "15px",
    fontWeight:     600,
    cursor:         "pointer",
    fontFamily:     "var(--font-body)",
  },
};
