//Splashscreen.jsx
import React, { useState } from "react";
import A11yToggle from "./A11yToggle";

function getHumanGeoError(err) {
  // err.code: 1 permission denied, 2 position unavailable, 3 timeout
  if (!err) return "Unknown error.";
  if (err.code === 1) return "Permission denied (Location blocked for this site).";
  if (err.code === 2) return "Position unavailable (GPS/network location not available).";
  if (err.code === 3) return "Timed out while fetching location.";
  return err.message || "Unknown error.";
}

export default function SplashScreen({ onLocationGranted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestLocation = () => {
    setError("");
    setLoading(true);

    if (!("geolocation" in navigator)) {
      setLoading(false);
      setError("Geolocation not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        onLocationGranted({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
          speed_mps: pos.coords.speed
        });
      },
      (err) => {
        setLoading(false);
        const msg = getHumanGeoError(err);
        // show code+message so you can debug quickly on phone
        setError(`${msg} (code=${err?.code})`);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  };

  return (
    <div style={styles.wrap}>
      <div style={{ position: "absolute", top: 14, right: 14, zIndex: 5 }}>
        <A11yToggle />
      </div>

      <div style={styles.center}>
        <div style={styles.ring}>SOS</div>
        <h1 style={styles.title}>RoadSoS</h1>
        <p style={styles.sub}>
          We only use your location to find nearby help and detect emergencies during Journey Mode.
        </p>
        
        <button onClick={requestLocation} style={styles.btn} disabled={loading}>
          {loading ? "Locating you..." : "Allow Location Access"}
        </button>

        {error ? (
          <div style={styles.errorBox}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Location needed</div>
            <div style={{ marginBottom: 10 }}>{error}</div>

            <div style={{ fontSize: 13, opacity: 0.95, lineHeight: 1.35 }}>
              If you blocked it before:
              <ol style={{ margin: "8px 0 0 18px" }}>
                <li>Tap the lock / tune icon near the address bar</li>
                <li>Site settings → Location → Allow</li>
                <li>Reload the page</li>
              </ol>
            </div>

            <button onClick={requestLocation} style={styles.retryBtn}>
              Try Again
            </button>
          </div>
        ) : null}
      </div>

      <div style={styles.footer}>CoERS • IIT Madras • Road Safety Hackathon</div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: "24px"
  },
  center: { maxWidth: 420, width: "100%", textAlign: "center" },
  ring: {
    width: 120,
    height: 120,
    borderRadius: 999,
    border: "2px solid rgba(225,29,72,0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 14px",
    fontWeight: 900,
    fontSize: 34,
    boxShadow: "0 0 30px rgba(225,29,72,0.35)"
  },
  title: { margin: "0 0 8px", fontSize: 34, letterSpacing: 0.3 },
  sub: { margin: "0 0 18px", color: "var(--text-muted)" },
  btn: {
    width: "100%",
    height: 56,
    borderRadius: 14,
    border: "none",
    background: "var(--danger)",
    color: "#fff",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer"
  },
  errorBox: {
    marginTop: 16,
    textAlign: "left",
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.25)"
  },
  retryBtn: {
    marginTop: 12,
    width: "100%",
    height: 46,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "transparent",
    color: "var(--text)",
    fontWeight: 800,
    cursor: "pointer"
  },
  footer: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 12,
    color: "var(--text-muted)"
  }
};
