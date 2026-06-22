//app.jsx
import { useState, useCallback, useRef, useEffect } from "react";
import SplashScreen      from "./components/SplashScreen";
import HomeScreen        from "./components/HomeScreen";
import FacilityList      from "./components/FacilityList";
import MapView           from "./components/MapView";
import AccidentAlert     from "./components/AccidentAlert";
import ContactsScreen    from "./components/ContactsScreen";
import VoiceSOSButton    from "./components/VoiceSOSButton";
import HazardMap         from "./components/HazardMap";
import RiskMap           from "./components/RiskMap";
import ProximityWarning  from "./components/ProximityWarning";
import { useAccidentDetection }  from "./hooks/useAccidentDetection";
import { useProximityWarning }   from "./hooks/useProximityWarning";
import { useA11y }               from "./context/AccessibilityContext";
import { fetchNearbyAll, fetchNearbyHazards, fetchRiskZones, sendSosAlert } from "./api";

function getDeviceId() {
  let id = localStorage.getItem("roadsos_device_id");
  if (id) return id;

  // build a stable fingerprint from device properties
  const fp = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");

  // simple hash
  let hash = 0;
  for (let i = 0; i < fp.length; i++) {
    hash = ((hash << 5) - hash) + fp.charCodeAt(i);
    hash |= 0;
  }
  id = "dev_" + Math.abs(hash).toString(36);
  localStorage.setItem("roadsos_device_id", id);
  return id;
}

const DEVICE_ID = getDeviceId();
console.log("DEVICE_ID:", DEVICE_ID);
export default function App() {
  const { a11y }                  = useA11y();
  const [screen,   setScreen]     = useState("splash");
  const [location, setLocation]   = useState(null);
  const [category, setCategory]   = useState(null);
  const [facility, setFacility]   = useState(null);
  const [journey,  setJourney]    = useState(false);
  const [alert,    setAlert]      = useState(null);
  const [proxWarn, setProxWarn]   = useState(null);  // proximity warning
  const nearestHospitalRef        = useRef(null);
  const sosSentRef = useRef(false);
  const voiceSosSentRef = useRef(false);
  
  // SOS trigger
  const triggerSOS = useCallback(async () => {
          if (sosSentRef.current) return;  // ← block double call
          sosSentRef.current = true; 
	  setAlert(null);
	  if (!location?.lat || !location?.lon) return;

	  let smsOk = false;
	  try {
	    const resp = await sendSosAlert(
	      DEVICE_ID,
	      location.lat,
	      location.lon,
	      nearestHospitalRef.current
	    );

	    // consider it "ok" if backend says sent > 0
	    smsOk = (resp?.sent || 0) > 0;
	    if (!smsOk) {
	      console.warn("SMS not sent:", resp);
	    }
	  } catch (e) {
	    console.error("SMS failed:", e);
	  }

	  // Only open WhatsApp if SMS didn't go out
	  if (!smsOk) {
	    const msg = encodeURIComponent(
	      `ACCIDENT ALERT. Location: https://maps.google.com/?q=${location.lat},${location.lon}`
	    );
	    window.open(`https://wa.me/?text=${msg}`, "_blank");
	  }
  }, [location]);
  const triggerVoiceSOS = useCallback(async () => {
	  if (voiceSosSentRef.current) return;
	  voiceSosSentRef.current = true;
	  console.log("triggerVoiceSOS called, location:", location);

	  if (!location?.lat || !location?.lon) {
	    voiceSosSentRef.current = false;
	    return;
	  }

	  try {
	    const resp = await sendSosAlert(
	      DEVICE_ID,
	      location.lat,
	      location.lon,
	      nearestHospitalRef.current
	    );
	    console.log("voice SMS result:", resp);
	  } catch (e) {
	    console.error("voice SMS failed:", e);
	  }

	  // reset after 30s so voice can trigger again
	  setTimeout(() => {
	    voiceSosSentRef.current = false;
	  }, 30000);
  }, [location]);
  // accident detection 
  const { start: startAccident, stop: stopAccident, reset: resetAccident} = useAccidentDetection({
    onAccidentDetected: (countdown, cancel) => setAlert({ countdown, cancel }),
    onSosAutoTriggered: triggerSOS,
  });

  // proximity warning 
  const { start: startProx, stop: stopProx, dismiss, updateData } = useProximityWarning({
    onWarning: (w) => setProxWarn(w),
  });

  // journey mode toggle 
  function toggleJourney() {
    if (journey) {
      stopAccident(); stopProx();
      setJourney(false); setAlert(null); setProxWarn(null);
      sosSentRef.current = false;
    } else {
      startAccident(); startProx();
      setJourney(true);
      // load zones + hazards for proximity checking
      if (location) loadProximityData(location.lat, location.lon);
    }
  }

  async function loadProximityData(lat, lon) {
    try {
      const [zonesData, hazardsData] = await Promise.all([
        fetchRiskZones(lat, lon, 500),
        fetchNearbyHazards(lat, lon, 50),
      ]);
      updateData(zonesData.zones, hazardsData.hazards);
    } catch (e) { console.error("Failed to load proximity data", e); }
  }

  function onLocationGranted(locObj) {
     setLocation(locObj);
     fetchNearbyAll(locObj.lat, locObj.lon)
       .then((d) => { nearestHospitalRef.current = d.results?.hospital?.name || null; })
       .catch(() => {});
     setScreen("home");
  }

  function onCategorySelect(cat) { setCategory(cat); setScreen("list"); }
  function onFacilitySelect(fac) { setFacility(fac); setScreen("map");  }

  function goBack() {
    if (screen === "map")      { setScreen("list");   return; }
    if (screen === "list")     { setScreen("home");   return; }
    if (screen === "contacts") { setScreen("home");   return; }
    if (screen === "hazards")  { setScreen("home");   return; }
    if (screen === "risk")     { setScreen("home");   return; }
    if (screen === "home")     { setScreen("splash"); return; }
  }

  const showVoice = screen !== "splash" && location && screen !== "hazards";

  return (
    <div
      className={a11y ? "a11y-mode" : ""}
      style={{ height: "100dvh", display: "flex", flexDirection: "column" }}
    >
      {/* accident alert */}
      {alert && (
        <AccidentAlert
          countdown={alert.countdown}
          onImOk={()    => { alert.cancel(); setAlert(null); resetAccident(); sosSentRef.current = false;}}
          onGetHelp={() => { alert.cancel(); setAlert(null); triggerSOS(); resetAccident(); }}
        />
      )}

      {/* proximity warning (only in journey mode) */}
      {journey && proxWarn && !alert && (
        <ProximityWarning
          warning={proxWarn}
          onDismiss={() => { dismiss(proxWarn.key); setProxWarn(null); }}
        />
      )}

      {screen === "splash"   && <SplashScreen onLocationGranted={onLocationGranted} />}
      {screen === "home"     && (
        <HomeScreen
          location={location}
          journey={journey}
          deviceId={DEVICE_ID}
          onToggleJourney={toggleJourney}
          onCategorySelect={onCategorySelect}
          onOpenContacts={() => setScreen("contacts")}
          onOpenHazards={()  => setScreen("hazards")}
          onOpenRiskMap={() => setScreen("risk")}
          onBack={goBack}
        />
      )}
      {screen === "list"     && (
        <FacilityList location={location} category={category}
          onFacilitySelect={onFacilitySelect} onBack={goBack} />
      )}
      {screen === "map"      && (
        <MapView location={location} facility={facility} onBack={goBack} />
      )}
      {screen === "contacts" && <ContactsScreen deviceId={DEVICE_ID} onBack={goBack} />}
      {screen === "hazards"  && <HazardMap location={location} deviceId={DEVICE_ID} onBack={goBack} />}
      {screen === "risk"     && <RiskMap location={location} onBack={goBack} />}

      {showVoice && <VoiceSOSButton onSosTriggered={triggerVoiceSOS} />}
    </div>
  );
}
