import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { fetchNearbyHazards, reportHazard, upvoteHazard, downvoteHazard, unupvoteHazard, undownvoteHazard } from "../api";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const HAZARD_CONFIG = {
  accident: { emoji: "💥", color: "#ef4444", label: "Accident" },
  pothole:  { emoji: "🕳️", color: "#f59e0b", label: "Pothole"  },
  flooding: { emoji: "🌊", color: "#3b82f6", label: "Flooding" },
  debris:   { emoji: "🪨", color: "#8b5cf6", label: "Debris"   },
  animal:   { emoji: "🐄", color: "#22c55e", label: "Animal"   },
  other:    { emoji: "⚠️", color: "#64748b", label: "Other"    },
};

function makeHazardIcon(type) {
  const cfg = HAZARD_CONFIG[type] || HAZARD_CONFIG.other;
  return L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;border-radius:50%;background:${cfg.color}22;border:2px solid ${cfg.color};display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px ${cfg.color}66;">${cfg.emoji}</div>`,
    iconSize:   [36, 36],
    iconAnchor: [18, 18],
  });
}

export default function HazardMap({ location, deviceId, onBack }) {
  const mapRef     = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef([]);
  const hazardsRef = useRef([]);   

  const [hazards,     setHazards]     = useState([]);
  const [showForm,    setShowForm]    = useState(false);
  const [hazardType,  setHazardType]  = useState("pothole");
  const [description, setDescription] = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [selected,    setSelected]    = useState(null);  
  const [myUpvotes,   setMyUpvotes]   = useState(() => 
	  new Set(JSON.parse(localStorage.getItem("roadsos_upvotes") || "[]"))
  );
  const [myDownvotes, setMyDownvotes] = useState(() => 
	  new Set(JSON.parse(localStorage.getItem("roadsos_downvotes") || "[]"))
  );
  useEffect(() => {
    if (leafletRef.current) return;

    const map = L.map(mapRef.current, { center: [location.lat, location.lon], zoom: 13 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap", maxZoom: 19,
    }).addTo(map);

    L.circleMarker([location.lat, location.lon], {
      radius: 8, color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 1, weight: 3,
    }).addTo(map).bindPopup("<b>You are here</b>");

    leafletRef.current = map;
    loadHazards(map);

    return () => { leafletRef.current?.remove(); leafletRef.current = null; };
  }, []);

  async function loadHazards(map) {
    try {
      const data = await fetchNearbyHazards(location.lat, location.lon);
      setHazards(data.hazards);
      hazardsRef.current = data.hazards;
      renderMarkers(map || leafletRef.current, data.hazards);
    } catch (e) { console.error("Failed to load hazards", e); }
  }

  function renderMarkers(map, hazardList) {
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    hazardList.forEach((h) => {
      const marker = L.marker([h.lat, h.lon], { icon: makeHazardIcon(h.type) })
        .addTo(map)
        .on("click", () => {
          const nearby = hazardsRef.current.filter((other) => {
            const dLat = (other.lat - h.lat) * 111000;
            const dLon = (other.lon - h.lon) * 111000 * Math.cos(h.lat * Math.PI / 180);
            return Math.sqrt(dLat * dLat + dLon * dLon) < 50;
          });
          setSelected(nearby);
        });
      markersRef.current.push(marker);
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await reportHazard(deviceId, hazardType, description, location.lat, location.lon);
      setSubmitted(true);
      setShowForm(false);
      setDescription("");
      setTimeout(() => setSubmitted(false), 3000);
      loadHazards();
    } catch (e) { alert(e.message); }
    finally { setSubmitting(false); }
  }

  async function handleUpvote(hazardId) {
	  const alreadyVoted = myUpvotes.has(hazardId);
	  try {
	    const data = await (alreadyVoted ? unupvoteHazard(hazardId) : upvoteHazard(hazardId));
	    const newSet = new Set(myUpvotes);
	    alreadyVoted ? newSet.delete(hazardId) : newSet.add(hazardId);
	    setMyUpvotes(newSet);
	    localStorage.setItem("roadsos_upvotes", JSON.stringify([...newSet]));
	    setHazards(prev => prev.map(h => h.id === hazardId ? { ...h, upvotes: data.upvotes } : h));
	    setSelected(prev => prev?.map(h => h.id === hazardId ? { ...h, upvotes: data.upvotes } : h) || null);
	  } catch(e) { console.error("Upvote failed", e); }
  }
  async function handleDownvote(hazardId) {
	  const alreadyVoted = myDownvotes.has(hazardId);
	  try {
	    const data = await (alreadyVoted ? undownvoteHazard(hazardId) : downvoteHazard(hazardId));
	    
	    const newSet = new Set(myDownvotes);
	    alreadyVoted ? newSet.delete(hazardId) : newSet.add(hazardId);
	    setMyDownvotes(newSet);
	    localStorage.setItem("roadsos_downvotes", JSON.stringify([...newSet]));

	    if (data.status === "removed") {
	      setHazards(prev => prev.filter(h => h.id !== hazardId));
	      setSelected(prev => prev?.filter(h => h.id !== hazardId) || null);
	    } else {
	      setHazards(prev => prev.map(h => h.id === hazardId ? { ...h, downvotes: data.downvotes } : h));
	      setSelected(prev => prev?.map(h => h.id === hazardId ? { ...h, downvotes: data.downvotes } : h) || null);
	    }
	  } catch(e) { console.error("Downvote failed", e); }
  }
  return (
    <div style={styles.container}>

      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <h2 style={styles.headerTitle}>⚠️ Live Hazards</h2>
        <span style={styles.headerCount}>{hazards.length} active</span>
      </div>

      <div ref={mapRef} style={styles.map} />

      {/*  selected hazards panel  */}
      {selected && selected.length > 0 && (
        <div style={{ ...styles.panel, borderTopColor: HAZARD_CONFIG[selected[0].type]?.color || "#ef4444" }}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>
              {selected.length > 1 ? `${selected.length} hazards at this location` : "Hazard Report"}
            </span>
            <button style={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
          </div>

          <div style={styles.panelList}>
            {selected.map((h) => {
              const c = HAZARD_CONFIG[h.type] || HAZARD_CONFIG.other;
              return (
                <div key={h.id} style={{ ...styles.panelItem, borderLeftColor: c.color }}>
                  <div style={styles.panelRow}>
                    <span style={styles.panelEmoji}>{c.emoji}</span>
                    <div style={styles.panelInfo}>
                      <span style={{ ...styles.panelType, color: c.color }}>{c.label}</span>
                      <span style={styles.panelDesc}>{h.description || "No description"}</span>
                      <span style={styles.panelMeta}>{h.distance_km} km away</span>
                    </div>
                  </div>
                  <div style={styles.panelActions}>
		  <button
		    onClick={() => handleUpvote(h.id)}
		    style={{ ...styles.upvoteBtn, borderColor: c.color, color: c.color }}
		  >
		    {myUpvotes.has(h.id) ? "👍 Voted" : "👍 Still there"} ({h.upvotes})
		  </button>
		  <button
		    onClick={() => handleDownvote(h.id)}
		    style={{ ...styles.upvoteBtn, background: "rgba(100,100,100,0.2)", color: "var(--text-muted)", borderColor: "var(--border)" }}
		  >
		    {myDownvotes.has(h.id) ? "✅ Voted" : "✅ Cleared"} ({h.downvotes})
		  </button>
		</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/*  report form  */}
      {showForm && (
        <div style={styles.formOverlay}>
          <div style={styles.form}>
            <div style={styles.formHeader}>
              <h3 style={styles.formTitle}>Report a Hazard</h3>
              <button style={styles.closeBtn} onClick={() => setShowForm(false)}>✕</button>
            </div>
            <p style={styles.formNote}>📍 Reported at your current location</p>
            <div style={styles.typeGrid}>
              {Object.entries(HAZARD_CONFIG).map(([type, c]) => (
                <button key={type}
                  style={{ ...styles.typeBtn,
                    borderColor: hazardType === type ? c.color : "var(--border)",
                    background:  hazardType === type ? `${c.color}22` : "var(--surface2)",
                    color:       hazardType === type ? c.color : "var(--text-muted)",
                  }}
                  onClick={() => setHazardType(type)}
                >
                  <span style={{ fontSize: "20px" }}>{c.emoji}</span>
                  <span style={{ fontSize: "11px" }}>{c.label}</span>
                </button>
              ))}
            </div>
            <textarea style={styles.textarea} placeholder="Add details (optional)..."
              value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            <button style={{ ...styles.submitBtn, opacity: submitting ? 0.6 : 1 }}
              onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Reporting..." : "🚨 Report Hazard"}
            </button>
          </div>
        </div>
      )}

      {submitted && (
        <div style={styles.toast}>✓ Hazard reported — visible to users within 50km</div>
      )}

      {!showForm && !selected && (
        <button style={styles.fab} onClick={() => setShowForm(true)}>+ Report</button>
      )}
    </div>
  );
}

const styles = {
  container:   { height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden", position: "relative" },
  header:      { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 },
  backBtn:     { background: "none", border: "none", color: "var(--text-muted)", fontSize: "14px", cursor: "pointer", fontFamily: "var(--font-body)" },
  headerTitle: { fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--text)" },
  headerCount: { fontSize: "12px", color: "var(--accent-amber)", fontWeight: 600 },
  map:         { flex: 1, width: "100%", minHeight: 0 },
  panel:       { flexShrink: 0, background: "var(--surface)", borderTop: "3px solid", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px", maxHeight: "45vh", overflowY: "auto" },
  panelHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  panelTitle:  { fontSize: "14px", fontWeight: 700, color: "var(--text)" },
  panelList:   { display: "flex", flexDirection: "column", gap: "12px" },
  panelItem:   { borderLeft: "3px solid", paddingLeft: "10px", display: "flex", flexDirection: "column", gap: "6px" },
  panelRow:    { display: "flex", alignItems: "flex-start", gap: "10px" },
  panelEmoji:  { fontSize: "24px", flexShrink: 0 },
  panelInfo:   { flex: 1, display: "flex", flexDirection: "column", gap: "2px" },
  panelType:   { fontSize: "13px", fontWeight: 700 },
  panelDesc:   { fontSize: "12px", color: "var(--text)" },
  panelMeta:   { fontSize: "11px", color: "var(--text-muted)" },
  closeBtn:    { background: "none", border: "none", color: "var(--text-muted)", fontSize: "18px", cursor: "pointer", flexShrink: 0 },
  panelActions:{ display: "flex", alignItems: "center", justifyContent: "space-between" },
  upvoteBtn:   { padding: "6px 14px", borderRadius: "var(--radius-sm)", border: "1px solid", background: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" },
  expiresText: { fontSize: "11px", color: "var(--text-muted)" },
  formOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1001, display: "flex", alignItems: "flex-end", backdropFilter: "blur(2px)" },
  form:        { width: "100%", background: "var(--surface)", borderRadius: "var(--radius) var(--radius) 0 0", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" },
  formHeader:  { display: "flex", alignItems: "center", justifyContent: "space-between" },
  formTitle:   { fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--text)" },
  formNote:    { fontSize: "12px", color: "var(--text-muted)" },
  typeGrid:    { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" },
  typeBtn:     { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "10px 6px", borderRadius: "var(--radius-sm)", border: "1px solid", cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.15s" },
  textarea:    { padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: "14px", fontFamily: "var(--font-body)", resize: "none", outline: "none" },
  submitBtn:   { padding: "14px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--accent-red)", color: "#fff", fontSize: "15px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" },
  toast:       { position: "fixed", top: "80px", left: "50%", transform: "translateX(-50%)", background: "#22c55e", color: "#fff", padding: "10px 20px", borderRadius: "100px", fontSize: "13px", fontWeight: 600, zIndex: 1002, whiteSpace: "nowrap" },
  fab:         { position: "fixed", bottom: "24px", left: "24px", padding: "14px 20px", borderRadius: "100px", border: "none", background: "var(--accent-red)", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", zIndex: 1000, boxShadow: "0 4px 20px rgba(239,68,68,0.4)" },
};
