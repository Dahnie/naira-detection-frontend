import { useState, useEffect } from "react";
import { getPreference } from "../utils/preferences";

interface UseSpeechOptions {
  autoSpeak?: boolean;
}

interface UseSpeechReturn {
  speak: (text: string) => void;
  isSpeaking: boolean;
  stop: () => void;
  supported: boolean;
}

/**
 * Custom hook for speech synthesis functionality
 */
export function useSpeech({
  autoSpeak = true,
}: UseSpeechOptions = {}): UseSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  // Check if speech synthesis is supported
  useEffect(() => {
    const isSupported = "speechSynthesis" in window;
    setSupported(isSupported);
  }, []);

  // Clean up any ongoing speech when the component unmounts
  useEffect(() => {
    return () => {
      if (supported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  /**
   * Speak the provided text
   */
  const speak = (text: string) => {
    if (!supported || !text) return;

    // Stop any current speech
    stop();

    // Get user preferences
    const speechRate = getPreference("speechRate", 1);
    const speechPitch = getPreference("speechPitch", 1);

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;

      // Update speaking state
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Speech synthesis error:", error);
      setIsSpeaking(false);
    }
  };

  /**
   * Stop any ongoing speech
   */
  const stop = () => {
    if (!supported) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return { speak, isSpeaking, stop, supported };
}
