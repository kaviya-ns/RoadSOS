//homescreen.jsx
import { useState, useEffect } from "react";
import { CATEGORIES, EMERGENCY_CONTACTS } from "../constants";
import { fetchNearbyAll } from "../api";
import A11yToggle from "./A11yToggle";

export default function HomeScreen({ location, journey, onToggleJourney, onCategorySelect, onOpenContacts, onOpenHazards, onOpenRiskMap }) {
  const [nearest, setNearest] = useState({});
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    fetchNearbyAll(location.lat, location.lon)
      .then((data) => { setNearest(data.results); setLoading(false); })
      .catch(()    => { setError(true);            setLoading(false); });
  }, [location]);

  return (
    <div style={styles.container}>

      {/*  header  */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerBadge}>GPS ACTIVE</div>
          <h1 style={styles.headerTitle}>Road<span style={styles.red}>SoS</span></h1>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.contactsBtn} onClick={onOpenContacts}>👥 Contacts</button>
          <button style={{...styles.contactsBtn, borderColor:"rgba(245,158,11,0.3)", color:"#f59e0b", background:"rgba(245,158,11,0.1)"}} onClick={onOpenHazards}>⚠️ Hazards</button>
          <button style={{...styles.contactsBtn, borderColor:"rgba(239,68,68,0.3)", color:"#ef4444", background:"rgba(239,68,68,0.1)"}} onClick={onOpenRiskMap}>🔥 Risks</button>
          <A11yToggle />
        </div>
      </div>

      {/* journey mode banner */}
      <div style={{
        ...styles.journeyBanner,
        background:  journey ? "rgba(34,197,94,0.1)" : "var(--surface)",
        borderColor: journey ? "rgba(34,197,94,0.4)" : "var(--border)",
      }}>
        <div style={styles.journeyLeft}>
          <span style={styles.journeyIcon}>{journey ? "🛡️" : "🚗"}</span>
          <div>
            <div style={{ ...styles.journeyTitle, color: journey ? "#22c55e" : "var(--text)" }}>
              {journey ? "Journey Mode Active" : "Journey Mode"}
            </div>
            <div style={styles.journeyDesc}>
              {journey ? "Monitoring speed & motion for accidents" : "Activate for accident auto-detection"}
            </div>
          </div>
        </div>
        <button
          style={{
            ...styles.journeyToggle,
            background:  journey ? "#22c55e" : "var(--surface2)",
            borderColor: journey ? "#22c55e" : "var(--border)",
          }}
          onClick={onToggleJourney}
        >
          {journey ? "ON" : "OFF"}
        </button>
      </div>

      {/* scroll area */}
      <div style={styles.scroll}>
        <p style={styles.sectionLabel}>NEARBY FACILITIES</p>

        <div style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const hit     = nearest[cat.type];
            const isReady = !loading && hit;
            return (
              <button
                key={cat.type}
                style={{ ...styles.card, borderColor: cat.color, background: cat.bg }}
                onClick={() => onCategorySelect(cat)}
              >
                <span style={styles.cardIcon}>{cat.icon}</span>
                <span style={{ ...styles.cardLabel, color: cat.color }}>{cat.label}</span>
                <span style={styles.cardSublabel}>{cat.sublabel}</span>
                <div style={styles.cardBottom}>
                  {loading && <span style={styles.cardMuted}>Searching...</span>}
                  {error   && <span style={styles.cardMuted}>Unavailable</span>}
                  {isReady && (
                    <>
                      <span style={styles.cardName}>{hit.name}</span>
                      <span style={{ ...styles.cardDist, color: cat.color }}>{hit.distance_km} km</span>
                    </>
                  )}
                  {!loading && !error && !hit && (
                    <span style={styles.cardMuted}>None within 10 km</span>
                  )}
                </div>
                <div style={{ ...styles.cardArrow, color: cat.color }}>→</div>
              </button>
            );
          })}
        </div>

        <p style={{ ...styles.sectionLabel, marginTop: "28px" }}>EMERGENCY NUMBERS</p>
        <div style={styles.contactsGrid}>
          {EMERGENCY_CONTACTS.map((c) => (
            <a key={c.number} href={`tel:${c.number}`}
              style={{ ...styles.contactCard, borderColor: c.color }}>
              <span style={{ ...styles.contactNumber, color: c.color }}>{c.number}</span>
              <span style={styles.contactLabel}>{c.label}</span>
            </a>
          ))}
        </div>

        <p style={styles.footer}>Data sourced from OpenStreetMap · Tamil Nadu</p>
      </div>
    </div>
  );
}

const styles = {
  container:    { height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" },
  header:       { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 },
  headerBadge:  { fontSize: "9px", fontWeight: 600, letterSpacing: "0.15em", color: "#22c55e", marginBottom: "4px" },
  headerTitle:  { fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, color: "var(--text)", lineHeight: 1 },
  red:          { color: "var(--accent-red)" },
  headerRight: { display: "flex", alignItems: "center", gap: "6px",flexWrap: "wrap",justifyContent: "flex-end",maxWidth: "60%",},
  contactsBtn:  { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "100px", color: "var(--accent-red)", fontSize: "12px", fontWeight: 600, padding: "6px 12px", cursor: "pointer", fontFamily: "var(--font-body)" },
  journeyBanner:{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid", flexShrink: 0, transition: "all 0.3s" },
  journeyLeft:  { display: "flex", alignItems: "center", gap: "12px" },
  journeyIcon:  { fontSize: "24px" },
  journeyTitle: { fontSize: "14px", fontWeight: 600, transition: "color 0.3s" },
  journeyDesc:  { fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" },
  journeyToggle:{ padding: "8px 18px", borderRadius: "100px", border: "1px solid", fontSize: "12px", fontWeight: 700, cursor: "pointer", color: "#fff", fontFamily: "var(--font-body)", transition: "all 0.3s" },
  scroll:       { flex: 1, overflowY: "auto", padding: "20px" },
  sectionLabel: { fontSize: "10px", fontWeight: 600, letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "12px" },
  grid:         { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  card:         { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px", padding: "16px", borderRadius: "var(--radius)", border: "1px solid", cursor: "pointer", textAlign: "left", position: "relative", transition: "transform 0.15s", minHeight: "140px" },
  cardIcon:     { fontSize: "28px", marginBottom: "4px" },
  cardLabel:    { fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700 },
  cardSublabel: { fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.3 },
  cardBottom:   { marginTop: "auto", paddingTop: "10px", width: "100%" },
  cardName:     { display: "block", fontSize: "11px", color: "var(--text)", lineHeight: 1.3, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  cardDist:     { fontSize: "13px", fontWeight: 600 },
  cardMuted:    { fontSize: "11px", color: "var(--text-muted)" },
  cardArrow:    { position: "absolute", top: "14px", right: "14px", fontSize: "18px", fontWeight: 700 },
  contactsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" },
  contactCard:  { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "14px 8px", borderRadius: "var(--radius-sm)", border: "1px solid", background: "var(--surface)", textDecoration: "none" },
  contactNumber:{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800 },
  contactLabel: { fontSize: "10px", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.3 },
  footer:       { marginTop: "24px", fontSize: "11px", color: "var(--text-muted)", textAlign: "center", paddingBottom: "16px" },
};
