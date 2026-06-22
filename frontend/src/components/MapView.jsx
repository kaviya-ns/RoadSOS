import { useEffect, useRef } from "react";
import L from "leaflet";


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapView({ location, facility, onBack }) {
  const mapRef       = useRef(null);   
  const leafletRef   = useRef(null);   

  useEffect(() => {
    if (leafletRef.current) return;    


    const midLat = (location.lat + facility.lat) / 2;
    const midLon = (location.lon + facility.lon) / 2;

    const map = L.map(mapRef.current, {
      center:          [midLat, midLon],
      zoom:            14,
      zoomControl:     true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom:     19,
    }).addTo(map);

    //user marker (blue dot)
    const userIcon = L.divIcon({
      className: "",
      html: `<div style="
        width:16px; height:16px; border-radius:50%;
        background:#3b82f6; border:3px solid #fff;
        box-shadow:0 0 8px rgba(59,130,246,0.8);
      "></div>`,
      iconSize:   [16, 16],
      iconAnchor: [8, 8],
    });

    L.marker([location.lat, location.lon], { icon: userIcon })
      .addTo(map)
      .bindPopup("<b>You are here</b>")
      .openPopup();

    //facility marker (red pin) 
    const facilityIcon = L.divIcon({
      className: "",
      html: `<div style="
        width:20px; height:20px; border-radius:50%;
        background:#ef4444; border:3px solid #fff;
        box-shadow:0 0 12px rgba(239,68,68,0.8);
      "></div>`,
      iconSize:   [20, 20],
      iconAnchor: [10, 10],
    });

    L.marker([facility.lat, facility.lon], { icon: facilityIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:sans-serif; min-width:160px;">
          <strong style="font-size:13px;">${facility.name}</strong><br/>
          <span style="color:#6b7280; font-size:11px;">${facility.distance_km} km away</span>
          ${facility.address ? `<br/><span style="font-size:11px;">${facility.address}</span>` : ""}
          ${facility.phone   ? `<br/><a href="tel:${facility.phone}" style="font-size:12px; color:#3b82f6;">📞 ${facility.phone}</a>` : ""}
        </div>
      `);

    //fit map to show both markers
    const bounds = L.latLngBounds(
      [location.lat, location.lon],
      [facility.lat, facility.lon]
    );
    map.fitBounds(bounds, { padding: [60, 60] });


    L.polyline(
      [[location.lat, location.lon], [facility.lat, facility.lon]],
      { color: "#ef4444", weight: 2, dashArray: "6 6", opacity: 0.7 }
    ).addTo(map);

    leafletRef.current = map;


    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, []);


  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${location.lat},${location.lon}&destination=${facility.lat},${facility.lon}&travelmode=driving`;

  return (
    <div style={styles.container}>

      {/* header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <div style={styles.headerInfo}>
          <span style={styles.headerName}>{facility.name}</span>
          <span style={styles.headerDist}>{facility.distance_km} km away</span>
        </div>
      </div>

      {/* map */}
      <div ref={mapRef} style={styles.map} />

      {/* bottom action panel  */}
      <div style={styles.panel}>
        <div style={styles.panelInfo}>
          <span style={styles.panelName}>{facility.name}</span>
          {facility.address && (
            <span style={styles.panelAddress}>{facility.address}</span>
          )}
        </div>

        <div style={styles.panelActions}>
          {facility.phone && (
            <a href={`tel:${facility.phone}`} style={styles.callBtn}>
              📞 Call
            </a>
          )}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            style={styles.directionsBtn}
          >
            🗺 Directions
          </a>
        </div>
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
    display:       "flex",
    alignItems:    "center",
    gap:           "12px",
    padding:       "14px 20px",
    borderBottom:  "1px solid var(--border)",
    background:    "var(--surface)",
    flexShrink:    0,
  },
  backBtn: {
    background:    "none",
    border:        "none",
    color:         "var(--text-muted)",
    fontSize:      "14px",
    cursor:        "pointer",
    padding:       "4px 0",
    fontFamily:    "var(--font-body)",
    flexShrink:    0,
  },
  headerInfo: {
    display:       "flex",
    flexDirection: "column",
    gap:           "2px",
    minWidth:      0,
  },
  headerName: {
    fontSize:      "15px",
    fontWeight:    600,
    color:         "var(--text)",
    overflow:      "hidden",
    textOverflow:  "ellipsis",
    whiteSpace:    "nowrap",
  },
  headerDist: {
    fontSize:      "12px",
    color:         "var(--accent-red)",
    fontWeight:    600,
  },
  map: {
    flex:          1,
    width:         "100%",
    minHeight:     0,
  },
  panel: {
    flexShrink:    0,
    padding:       "16px 20px",
    background:    "var(--surface)",
    borderTop:     "1px solid var(--border)",
    display:       "flex",
    flexDirection: "column",
    gap:           "12px",
  },
  panelInfo: {
    display:       "flex",
    flexDirection: "column",
    gap:           "3px",
  },
  panelName: {
    fontSize:      "15px",
    fontWeight:    600,
    color:         "var(--text)",
  },
  panelAddress: {
    fontSize:      "12px",
    color:         "var(--text-muted)",
  },
  panelActions: {
    display:       "flex",
    gap:           "10px",
  },
  callBtn: {
    flex:          1,
    padding:       "13px",
    borderRadius:  "var(--radius-sm)",
    background:    "rgba(34,197,94,0.15)",
    border:        "1px solid rgba(34,197,94,0.3)",
    color:         "#22c55e",
    fontSize:      "14px",
    fontWeight:    600,
    textDecoration:"none",
    textAlign:     "center",
  },
  directionsBtn: {
    flex:          1,
    padding:       "13px",
    borderRadius:  "var(--radius-sm)",
    background:    "var(--accent-red)",
    border:        "none",
    color:         "#fff",
    fontSize:      "14px",
    fontWeight:    600,
    textDecoration:"none",
    textAlign:     "center",
  },
};
