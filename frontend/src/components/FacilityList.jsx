import { useState, useEffect } from "react";
import { fetchNearbyByType } from "../api";

export default function FacilityList({ location, category, onFacilitySelect, onBack }) {
  const [facilities, setFacilities] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchNearbyByType(location.lat, location.lon, category.type)
      .then((data) => { setFacilities(data.results); setLoading(false); })
      .catch(()    => { setError(true);               setLoading(false); });
  }, [category]);

  return (
    <div style={styles.container}>

      {/*  header  */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <div style={styles.headerCenter}>
          <span style={styles.headerIcon}>{category.icon}</span>
          <span style={{ ...styles.headerTitle, color: category.color }}>
            {category.label}
          </span>
        </div>
        <span style={styles.headerCount}>
          {!loading && !error ? `${facilities.length} found` : ""}
        </span>
      </div>

      {/* sublabel  */}
      <div style={{ ...styles.radiusBar, borderColor: category.color + "33" }}>
        <span style={styles.radiusText}>
          📍 Showing results within <strong>20 km</strong> of your location
        </span>
      </div>

      {/*  list */}
      <div style={styles.scroll}>
        {loading && (
          <div style={styles.centerBox}>
            <div style={{ ...styles.spinner, borderTopColor: category.color }} />
            <p style={styles.centerText}>Finding nearby {category.label.toLowerCase()}...</p>
          </div>
        )}

        {error && (
          <div style={styles.centerBox}>
            <span style={styles.errorIcon}>⚠️</span>
            <p style={styles.centerText}>Could not load facilities. Check your connection.</p>
            <button
              style={{ ...styles.retryBtn, borderColor: category.color, color: category.color }}
              onClick={() => {
                setLoading(true); setError(false);
                fetchNearbyByType(location.lat, location.lon, category.type)
                  .then((d) => { setFacilities(d.results); setLoading(false); })
                  .catch(()  => { setError(true);           setLoading(false); });
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && facilities.length === 0 && (
          <div style={styles.centerBox}>
            <span style={{ fontSize: "40px" }}>🔍</span>
            <p style={styles.centerText}>No {category.label.toLowerCase()} found within 20 km.</p>
          </div>
        )}

        {!loading && !error && facilities.map((fac, i) => (
          <button
            key={fac.id}
            style={styles.card}
            onClick={() => onFacilitySelect(fac)}
          >
            {/* rank badge */}
            <div style={{ ...styles.rank, background: i === 0 ? category.color : "var(--surface2)" }}>
              {i === 0 ? "★" : i + 1}
            </div>

            {/* info */}
            <div style={styles.info}>
              <div style={styles.nameRow}>
                <span style={styles.name}>{fac.name}</span>
                {fac.is_24hrs && (
                  <span style={styles.badge24}>24h</span>
                )}
              </div>
              {fac.address && (
                <span style={styles.address}>{fac.address}</span>
              )}
              {fac.phone && (
                <a
                  href={`tel:${fac.phone}`}
                  style={styles.phone}
                  onClick={(e) => e.stopPropagation()}
                >
                  📞 {fac.phone}
                </a>
              )}
            </div>

            {/* distance + arrow */}
            <div style={styles.right}>
              <span style={{ ...styles.dist, color: category.color }}>
                {fac.distance_km} km
              </span>
              <span style={styles.arrow}>→</span>
              <span style={styles.mapHint}>Map</span>
            </div>
          </button>
        ))}

        <div style={{ height: "24px" }} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    height:        "100dvh",
    display:       "flex",
    flexDirection: "column",
    background:    "var(--bg)",
    overflow:      "hidden",
  },
  header: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    padding:        "16px 20px",
    borderBottom:   "1px solid var(--border)",
    background:     "var(--surface)",
    flexShrink:     0,
  },
  backBtn: {
    background:    "none",
    border:        "none",
    color:         "var(--text-muted)",
    fontSize:      "14px",
    cursor:        "pointer",
    padding:       "4px 0",
    fontFamily:    "var(--font-body)",
  },
  headerCenter: {
    display:       "flex",
    alignItems:    "center",
    gap:           "8px",
  },
  headerIcon:  { fontSize: "22px" },
  headerTitle: {
    fontFamily:    "var(--font-display)",
    fontSize:      "20px",
    fontWeight:    700,
  },
  headerCount: {
    fontSize:      "12px",
    color:         "var(--text-muted)",
    minWidth:      "60px",
    textAlign:     "right",
  },
  radiusBar: {
    padding:       "10px 20px",
    borderBottom:  "1px solid",
    background:    "var(--surface)",
    flexShrink:    0,
  },
  radiusText: {
    fontSize:      "12px",
    color:         "var(--text-muted)",
  },
  scroll: {
    flex:          1,
    overflowY:     "auto",
    padding:       "12px 16px",
    display:       "flex",
    flexDirection: "column",
    gap:           "10px",
  },
  centerBox: {
    flex:          1,
    display:       "flex",
    flexDirection: "column",
    alignItems:    "center",
    justifyContent:"center",
    gap:           "16px",
    padding:       "60px 20px",
  },
  spinner: {
    width:         "36px",
    height:        "36px",
    border:        "3px solid var(--border)",
    borderRadius:  "50%",
    animation:     "spin 0.8s linear infinite",
  },
  centerText: {
    color:         "var(--text-muted)",
    fontSize:      "14px",
    textAlign:     "center",
  },
  errorIcon:   { fontSize: "32px" },
  retryBtn: {
    background:    "none",
    border:        "1px solid",
    borderRadius:  "var(--radius-sm)",
    padding:       "8px 24px",
    fontSize:      "14px",
    cursor:        "pointer",
    fontFamily:    "var(--font-body)",
  },
  card: {
    display:        "flex",
    alignItems:     "center",
    gap:            "12px",
    padding:        "14px",
    borderRadius:   "var(--radius)",
    border:         "1px solid var(--border)",
    background:     "var(--surface)",
    cursor:         "pointer",
    textAlign:      "left",
    width:          "100%",
    transition:     "background 0.15s",
  },
  rank: {
    flexShrink:     0,
    width:          "32px",
    height:         "32px",
    borderRadius:   "50%",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontSize:       "13px",
    fontWeight:     700,
    color:          "#fff",
  },
  info: {
    flex:           1,
    display:        "flex",
    flexDirection:  "column",
    gap:            "3px",
    minWidth:       0,
  },
  nameRow: {
    display:        "flex",
    alignItems:     "center",
    gap:            "6px",
    flexWrap:       "wrap",
  },
  name: {
    fontSize:       "14px",
    fontWeight:     600,
    color:          "var(--text)",
    lineHeight:     1.3,
  },
  badge24: {
    fontSize:       "9px",
    fontWeight:     700,
    color:          "#22c55e",
    background:     "rgba(34,197,94,0.15)",
    border:         "1px solid rgba(34,197,94,0.3)",
    borderRadius:   "4px",
    padding:        "1px 5px",
    flexShrink:     0,
  },
  address: {
    fontSize:       "11px",
    color:          "var(--text-muted)",
    lineHeight:     1.3,
    overflow:       "hidden",
    textOverflow:   "ellipsis",
    whiteSpace:     "nowrap",
  },
  phone: {
    fontSize:       "12px",
    color:          "var(--accent-blue)",
    textDecoration: "none",
  },
  right: {
    flexShrink:     0,
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "flex-end",
    gap:            "2px",
  },
  dist: {
    fontSize:       "15px",
    fontWeight:     700,
  },
  arrow: {
    fontSize:       "16px",
    color:          "var(--text-muted)",
  },
  mapHint: {
    fontSize:       "10px",
    color:          "var(--text-muted)",
  },
};
