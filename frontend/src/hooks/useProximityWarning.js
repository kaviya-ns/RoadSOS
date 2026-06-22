import { useRef, useCallback } from "react";

const CHECK_INTERVAL_MS  = 5000;   // check every 5 seconds
const WARNING_RADIUS_M   = 2000;   // warn if within 2km
const DISMISSED_TTL_MS   = 5 * 60 * 1000; // don't re-warn same zone for 5 min

// haversine distance in metres between two lat/lon points
function distanceM(lat1, lon1, lat2, lon2) {
  const R    = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useProximityWarning({ onWarning }) {
  const intervalRef  = useRef(null);
  const dismissedRef = useRef({});  
  const zonesRef     = useRef([]);
  const hazardsRef   = useRef([]);


  const updateData = useCallback((zones, hazards) => {
    zonesRef.current   = zones   || [];
    hazardsRef.current = hazards || [];
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const now = Date.now();

        Object.keys(dismissedRef.current).forEach((key) => {
          if (now - dismissedRef.current[key] > DISMISSED_TTL_MS) {
            delete dismissedRef.current[key];
          }
        });
        const warnings = [];
        
        // check risk zones
        for (const zone of zonesRef.current) {
	  const key  = `zone_${zone.id}`;
	  const dist = distanceM(lat, lon, zone.lat, zone.lon);
	  if (dist <= WARNING_RADIUS_M && !dismissedRef.current[key]) {
	    warnings.push({ ...zone, key, dist, type: "risk_zone" });
	  }
	}

        for (const hazard of hazardsRef.current) {
	  const key  = `hazard_${hazard.id}`;
	  const dist = distanceM(lat, lon, hazard.lat, hazard.lon);
	  if (dist <= WARNING_RADIUS_M && !dismissedRef.current[key]) {
	    warnings.push({ ...hazard, key, dist, type: "hazard" });
	  }
	}
	if (warnings.length > 0) {
	  warnings.sort((a, b) => a.dist - b.dist);
	  const w = warnings[0];
	  onWarning({
	    type:       w.type,
	    id:         w.id,
	    key:        w.key,
	    name:       w.type === "risk_zone" ? w.name : w.type,
	    reason:     w.reason || w.description || w.type,
	    distance_m: Math.round(w.dist),
	    risk_score: w.risk_score,
	    peak_hours: w.peak_hours,
	  });
	}
      }, () => {}, { enableHighAccuracy: true, maximumAge: 0, timeout: 4000 });
    }, CHECK_INTERVAL_MS);
  }, [onWarning]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const dismiss = useCallback((key) => {
    dismissedRef.current[key] = Date.now();
  }, []);

  return { start, stop, dismiss, updateData };
}
