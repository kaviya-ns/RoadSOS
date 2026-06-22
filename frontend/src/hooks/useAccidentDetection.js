//useaccidentdetection.js
import { useRef, useCallback } from "react";

const SPEED_THRESHOLD_KMH   = 25;    
const IMPACT_THRESHOLD      = 25;    
const SPEED_SAMPLE_INTERVAL = 500000;  
const SOS_COUNTDOWN_SEC     = 60;    

// convert m/s (from geolocation) to km/h
function toKmh(mps) { return mps * 3.6; }

// vector magnitude of accelerometer reading
function magnitude(x, y, z) { return Math.sqrt(x * x + y * y + z * z); }

export function useAccidentDetection({ onAccidentDetected, onSosAutoTriggered }) {
  const watchIdRef       = useRef(null);   // geolocation watch
  const lastSpeedRef     = useRef(0);      // km/h
  const impactRef        = useRef(false);  // did we see an accelerometer spike?
  const motionHandlerRef = useRef(null);
  const countdownRef     = useRef(null);
  const activeRef        = useRef(false);
  const impactResetRef = useRef(null);
  const alertShownRef = useRef(false);
  //  start monitoring 
  const start = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;

    // 1. accelerometer : listen for sudden impact
    const handleMotion = (e) => {
	  const acc = e.accelerationIncludingGravity;
	  if (!acc) return;
	  const mag = magnitude(acc.x || 0, acc.y || 0, acc.z || 0);
	  document.title = `${mag.toFixed(0)} ${impactRef.current}`;
	  if (mag > IMPACT_THRESHOLD) {
	    impactRef.current = true;
	    // keep the flag alive for 3 seconds so GPS has time to catch the speed drop
	    clearTimeout(impactResetRef.current);
	    impactResetRef.current = setTimeout(() => {
	      impactRef.current = false;
	    }, 3000);
	  }
	};

    // iOS 13+ needs permission
    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function"
    ) {
      DeviceMotionEvent.requestPermission()
        .then((state) => {
          if (state === "granted") {
            window.addEventListener("devicemotion", handleMotion);
            motionHandlerRef.current = handleMotion;
          }
        })
        .catch(() => {});
    } else {
      window.addEventListener("devicemotion", handleMotion);
      motionHandlerRef.current = handleMotion;
    }

    // 2. GPS speed watch
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const speedKmh = pos.coords.speed != null
          ? toKmh(pos.coords.speed)
          : 0;

        const wasMovingFast = lastSpeedRef.current >= SPEED_THRESHOLD_KMH;
        const nowStopped    = speedKmh < 5;
        //const wasMovingFast = true;
        //const nowStopped    = true;
        const hadImpact     = impactRef.current;

        if (wasMovingFast && nowStopped && hadImpact) {
          triggerCountdown();
        }

        lastSpeedRef.current = speedKmh;
      },
      () => {},   
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
  }, []);

  // countdown before auto-SOS 
  function triggerCountdown() {
	  if (countdownRef.current) return;
          if (alertShownRef.current) return;  
          alertShownRef.current = true; 
	  onAccidentDetected(SOS_COUNTDOWN_SEC, cancelCountdown);

	  // set a flag so we don't re-trigger
	  countdownRef.current = setTimeout(() => {
	    countdownRef.current = null;
	  }, SOS_COUNTDOWN_SEC * 1000 + 500); 
  }

  // user tapped "I'm OK" 
  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearTimeout(countdownRef.current)
      countdownRef.current = null;
    }
  }, []);
  const reset = useCallback(() => {
	  if (countdownRef.current) {
	    clearTimeout(countdownRef.current);
	    countdownRef.current = null;
	  }
	  // wait 30 seconds before allowing re-trigger
	  setTimeout(() => {
	    alertShownRef.current = false;
	  }, 30000);
  }, []);


  //  stop monitoring 
  const stop = useCallback(() => {
    activeRef.current = false;

    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (motionHandlerRef.current) {
      window.removeEventListener("devicemotion", motionHandlerRef.current);
      motionHandlerRef.current = null;
    }
    if (countdownRef.current) {
      clearTimeout(countdownRef.current)
      countdownRef.current = null;
    }
    if (impactResetRef.current) {
       clearTimeout(impactResetRef.current);
       impactResetRef.current = null;
    }
    lastSpeedRef.current = 0;
    impactRef.current    = false;
    alertShownRef.current = false;
  }, []);

  return { start, stop, cancelCountdown, reset};
}
