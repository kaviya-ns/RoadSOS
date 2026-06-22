import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { fetchRiskZones } from "../api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


function riskColor(score) {
  if (score >= 0.9) return "#ef4444";   // critical (red)
  if (score >= 0.8) return "#f97316";   // high (orange)
  if (score >= 0.7) return "#f59e0b";   // moderate (amber)
  return "#22c55e";                      // low (green)
}

function riskLabel(score) {
  if (score >= 0.9) return "CRITICAL";
  if (score >= 0.8) return "HIGH";
  if (score >= 0.7) return "MODERATE";
  return "LOW";
}

// radius of heatmap circle scales with risk score
function riskRadius(score) {
  return 800 + score * 1200;   // 800m → 2000m
}

export default function RiskMap({ location, onBack }) {
  const mapRef     = useRef(null);
  const leafletRef = useRef(null);
  const layersRef  = useRef([]);

  const [zones,    setZones]    = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all"); // all | critical | high | moderate

  useEffect(() => {
    if (leafletRef.current) return;

    // zoom out to show all of TN
    const map = L.map(mapRef.current, {
      center: [11.1271, 78.6569],   // TN centre
      zoom:   7,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap", maxZoom: 18,
    }).addTo(map);

    // user location marker
    L.circleMarker([location.lat, location.lon], {
      radius: 8, color: "#3b82f6", fillColor: "#3b82f6",
      fillOpacity: 1, weight: 3,
    }).addTo(map).bindPopup("<b>You are here</b>");

    leafletRef.current = map;

    fetchRiskZones(location.lat, location.lon, 500)
      .then((data) => {
        setZones(data.zones);
        renderZones(map, data.zones);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => { leafletRef.current?.remove(); leafletRef.current = null; };
  }, []);

  function renderZones(map, zoneList, activeFilter = "all") {

    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];

    const filtered = activeFilter === "all"
      ? zoneList
      : zoneList.filter((z) => riskLabel(z.risk_score).toLowerCase() === activeFilter);

    filtered.forEach((z) => {
      const color  = riskColor(z.risk_score);
      const radius = riskRadius(z.risk_score);


      const glow = L.circle([z.lat, z.lon], {
        radius,
        color:       color,
        fillColor:   color,
        fillOpacity: 0.15,
        weight:      1,
        opacity:     0.4,
      }).addTo(map);


      const inner = L.circle([z.lat, z.lon], {
        radius:      radius * 0.35,
        color:       color,
        fillColor:   color,
        fillOpacity: 0.5,
        weight:      2,
      }).addTo(map).on("click", () => setSelected(z));


      const label = L.divIcon({
        className: "",
        html: `<div style="
          background:${color}; color:#fff; padding:2px 6px;
          border-radius:4px; font-size:10px; font-weight:700;
          white-space:nowrap; box-shadow:0 1px 4px rgba(0,0,0,0.3);
        ">${z.highway}</div>`,
        iconAnchor: [20, 10],
      });
      const labelMarker = L.marker([z.lat, z.lon], { icon: label, interactive: false })
        .addTo(map);

      layersRef.current.push(glow, inner, labelMarker);
    });
  }

  function handleFilter(f) {
    setFilter(f);
    setSelected(null);
    renderZones(leafletRef.current, zones, f);
  }

  const criticalCount  = zones.filter((z) => z.risk_score >= 0.9).length;
  const highCount      = zones.filter((z) => z.risk_score >= 0.8 && z.risk_score < 0.9).length;
  const moderateCount  = zones.filter((z) => z.risk_score >= 0.7 && z.risk_score < 0.8).length;

  return (
    <div style={styles.container}>

      {/*  header  */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <h2 style={styles.headerTitle}>🔥 Risk Zones</h2>
        <span style={styles.headerSub}>{loading ? "Loading..." : `${zones.length} zones`}</span>
      </div>

      {/*  filter bar */}
      <div style={styles.filterBar}>
        {[
          { key: "all",      label: "All",      color: "#64748b", count: zones.length },
          { key: "critical", label: "Critical", color: "#ef4444", count: criticalCount },
          { key: "high",     label: "High",     color: "#f97316", count: highCount },
          { key: "moderate", label: "Moderate", color: "#f59e0b", count: moderateCount },
        ].map((f) => (
          <button
            key={f.key}
            style={{
              ...styles.filterBtn,
              background:  filter === f.key ? `${f.color}22` : "transparent",
              borderColor: filter === f.key ? f.color : "var(--border)",
              color:       filter === f.key ? f.color : "var(--text-muted)",
            }}
            onClick={() => handleFilter(f.key)}
          >
            {f.label} <span style={styles.filterCount}>{f.count}</span>
          </button>
        ))}
      </div>

      {/*  map  */}
      <div ref={mapRef} style={styles.map} />

      {/*  legend  */}
      <div style={styles.legend}>
        {[
          { color: "#ef4444", label: "Critical (≥0.9)" },
          { color: "#f97316", label: "High (≥0.8)"     },
          { color: "#f59e0b", label: "Moderate (≥0.7)" },
        ].map((l) => (
          <div key={l.color} style={styles.legendItem}>
            <div style={{ ...styles.legendDot, background: l.color }} />
            <span style={styles.legendText}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* selected zone panel  */}
      {selected && (
        <div style={{ ...styles.panel, borderTopColor: riskColor(selected.risk_score) }}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelTopRow}>
                <span style={{
                  ...styles.riskBadge,
                  background: riskColor(selected.risk_score) + "22",
                  color:      riskColor(selected.risk_score),
                  borderColor:riskColor(selected.risk_score),
                }}>
                  {riskLabel(selected.risk_score)}
                </span>
                <span style={styles.highway}>{selected.highway}</span>
              </div>
              <span style={styles.panelName}>{selected.name}</span>
            </div>
            <button style={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
          </div>

          <div style={styles.panelGrid}>
            <div style={styles.statBox}>
              <span style={{ ...styles.statValue, color: riskColor(selected.risk_score) }}>
                {Math.round(selected.risk_score * 100)}%
              </span>
              <span style={styles.statLabel}>Risk Score</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statValue}>{selected.accident_count}</span>
              <span style={styles.statLabel}>Accidents</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statValue}>{selected.distance_km} km</span>
              <span style={styles.statLabel}>From You</span>
            </div>
          </div>

          <div style={styles.infoRow}>
            <span style={styles.infoIcon}>🕐</span>
            <span style={styles.infoText}>Peak: {selected.peak_hours}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoIcon}>⚠️</span>
            <span style={styles.infoText}>{selected.reason}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container:    { height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden", position: "relative" },
  header:       { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 },
  backBtn:      { background: "none", border: "none", color: "var(--text-muted)", fontSize: "14px", cursor: "pointer", fontFamily: "var(--font-body)" },
  headerTitle:  { fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--text)" },
  headerSub:    { fontSize: "12px", color: "var(--text-muted)" },
  filterBar:    { display: "flex", gap: "8px", padding: "10px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0, overflowX: "auto" },
  filterBtn:    { padding: "5px 12px", borderRadius: "100px", border: "1px solid", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap", transition: "all 0.2s" },
  filterCount:  { opacity: 0.7, marginLeft: "4px" },
  map:          { flex: 1, width: "100%", minHeight: 0 },
  legend:       { position: "absolute", top: "110px", left: "10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", zIndex: 1000, display: "flex", flexDirection: "column", gap: "6px" },
  legendItem:   { display: "flex", alignItems: "center", gap: "6px" },
  legendDot:    { width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 },
  legendText:   { fontSize: "10px", color: "var(--text-muted)", whiteSpace: "nowrap" },
  panel:        { flexShrink: 0, background: "var(--surface)", borderTop: "3px solid", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" },
  panelHeader:  { display: "flex", alignItems: "flex-start", justifyContent: "space-between" },
  panelTopRow:  { display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" },
  riskBadge:    { fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", border: "1px solid", letterSpacing: "0.05em" },
  highway:      { fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 },
  panelName:    { fontSize: "15px", fontWeight: 700, color: "var(--text)" },
  closeBtn:     { background: "none", border: "none", color: "var(--text-muted)", fontSize: "18px", cursor: "pointer", flexShrink: 0 },
  panelGrid:    { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" },
  statBox:      { background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" },
  statValue:    { fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 800, color: "var(--text)" },
  statLabel:    { fontSize: "10px", color: "var(--text-muted)" },
  infoRow:      { display: "flex", gap: "8px", alignItems: "flex-start" },
  infoIcon:     { fontSize: "14px", flexShrink: 0 },
  infoText:     { fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 },
};
