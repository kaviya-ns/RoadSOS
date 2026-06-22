import { useRef, useState, useCallback } from "react";

const TRIGGER_WORDS = ["emergency", "help", "sos", "accident", "danger"];

export function useVoiceSOS({ onTriggered, onNetworkError }) {
  const [listening,  setListening]  = useState(false);
  const [supported,  setSupported]  = useState(true);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  const start = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) { setSupported(false); return; }

    const recognition = new SpeechRecognition();
    recognition.lang           = "en-IN";
    recognition.continuous     = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (e) => {
      const said = Array.from(e.results)
        .map((r) => r[0].transcript.toLowerCase())
        .join(" ");
      setTranscript(said);
      if (TRIGGER_WORDS.some((w) => said.includes(w))) {
        recognition.stop();
        onTriggered(said);
      }
    };

    recognition.onerror = (e) => {
      setListening(false);
      setTranscript("");
      // network error → switch to hold mode
      if (e.error === "network" && onNetworkError) onNetworkError();
    };

    recognition.onend = () => { setListening(false); setTranscript(""); };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onTriggered, onNetworkError]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    setTranscript("");
  }, []);

  return { start, stop, listening, supported, transcript };
}
