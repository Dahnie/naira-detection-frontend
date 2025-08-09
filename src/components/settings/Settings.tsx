import React, { useEffect, useState, useRef } from "react";
import styles from "./Settings.module.css";
import { getPreference, savePreference } from "../../utils/preferences";
import {
  announceToScreenReader,
  triggerVibration,
} from "../../utils/accessibiltyHelper";
import { useSpeech } from "@hooks/useSpeech";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1);
  const [speechPitch, setSpeechPitch] = useState<number>(1);

  // Refs for focus management and announcements
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const { speak: speakChange } = useSpeech();

  // Audio feedback for settings changes (optional - can work alongside announceToScreenReader)
  // const speakChange = useCallback(
  //   (message: string) => {
  //     // Only speak if speech synthesis is available and auto-speak is enabled
  //     if ("speechSynthesis" in window && getPreference("autoSpeak", true)) {
  //       const utterance = new SpeechSynthesisUtterance(message);
  //       utterance.rate = speechRate;
  //       utterance.pitch = speechPitch;
  //       utterance.volume = 0.8;
  //       speechSynthesis.speak(utterance);
  //     }
  //   },
  //   [speechRate, speechPitch]
  // );

  useEffect(() => {
    // Load saved preferences when component mounts
    setAutoSpeak(getPreference("autoSpeak", true));
    setSpeechRate(getPreference("speechRate", 1));
    setSpeechPitch(getPreference("speechPitch", 1));
  }, []);

  // Focus management when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement;

      // Focus the modal container after a brief delay
      const timer = setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);

      // Announce modal opening using the consistent pattern
      announceToScreenReader(
        liveRegionRef,
        "Settings modal opened. Use tab to navigate between options, escape to close.",
        "polite"
      );

      return () => clearTimeout(timer);
    } else {
      // Return focus to previously focused element when closing
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    }
  }, [isOpen]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      announceToScreenReader(liveRegionRef, "Settings closed", "polite");
    }

    // Tab trapping within modal
    if (e.key === "Tab") {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, input, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  const handleAutoSpeakChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.checked;
    setAutoSpeak(value);
    savePreference("autoSpeak", value);
    triggerVibration(50); // Optional: provide haptic feedback

    const message = value
      ? "Auto-speak enabled. Currency detection results will be announced automatically."
      : "Auto-speak disabled. You'll need to manually request result announcements.";

    // Use announceToScreenReader for consistent screen reader announcements
    announceToScreenReader(liveRegionRef, message, "polite");

    // Optional: Also speak the change if auto-speak is enabled
    speakChange(message, true);
  };

  const handleSpeechRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSpeechRate(value);
    savePreference("speechRate", value);
    triggerVibration(20); // Optional: provide haptic feedback

    const message = `Speech rate set to ${value.toFixed(1)} times normal speed`;

    // Announce to screen readers
    announceToScreenReader(liveRegionRef, message, "polite");

    // Provide immediate audio feedback with new rate
    setTimeout(() => {
      speakChange(message);
    }, 100);
  };

  const handleSpeechPitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSpeechPitch(value);
    savePreference("speechPitch", value);
    triggerVibration(20); // Optional: provide haptic feedback

    const message = `Speech pitch set to ${value.toFixed(
      1
    )} times normal pitch`;

    // Announce to screen readers
    announceToScreenReader(liveRegionRef, message, "polite");

    // Provide immediate audio feedback with new pitch
    setTimeout(() => {
      speakChange(message);
    }, 100);
  };

  const resetToDefaults = () => {
    setAutoSpeak(true);
    setSpeechRate(1);
    setSpeechPitch(1);
    savePreference("autoSpeak", true);
    savePreference("speechRate", 1);
    savePreference("speechPitch", 1);
    triggerVibration(100); // Optional: provide haptic feedback

    const message =
      "All settings reset to default values. Auto-speak enabled, speech rate normal, speech pitch normal.";
    announceToScreenReader(liveRegionRef, message, "polite");
    speakChange(message);
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.modal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      aria-describedby="settings-description"
      onKeyDown={handleKeyDown}
    >
      <div className={styles.modalContent} ref={modalRef} tabIndex={-1}>
        {/* Screen reader only description */}
        <div id="settings-description" className={styles.srOnly}>
          Settings for customizing speech and audio preferences. Use tab to
          navigate, escape to close.
        </div>

        <div className={styles.modalHeader}>
          <h2 id="settings-title">Settings</h2>
          <button
            onClick={() => {
              onClose();
              announceToScreenReader(
                liveRegionRef,
                "Settings closed",
                "polite"
              );
            }}
            className={styles.iconBtn}
            aria-label="Close Settings Modal"
            title="Close Settings (Press Escape)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className={styles.settingsOptions}>
          <fieldset className={styles.settingFieldset}>
            <legend className={styles.srOnly}>Speech Settings</legend>

            <div className={styles.settingItem}>
              <div className={styles.settingLabel}>
                <label htmlFor="auto-speak">Automatically speak results</label>
                <p className={styles.settingDescription}>
                  When enabled, currency detection results are announced
                  immediately
                </p>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  id="auto-speak"
                  checked={autoSpeak}
                  onChange={handleAutoSpeakChange}
                  aria-describedby="auto-speak-desc"
                />
                <span
                  className={`${styles.slider} ${styles.round}`}
                  aria-hidden="true"
                ></span>
                <span className={styles.srOnly}>
                  {autoSpeak
                    ? "Auto-speak is currently enabled"
                    : "Auto-speak is currently disabled"}
                </span>
              </label>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingLabel}>
                <label htmlFor="speech-rate">Speech Rate</label>
                <p className={styles.settingDescription}>
                  Current rate: {speechRate.toFixed(1)}x speed
                </p>
              </div>
              <div className={styles.rangeContainer}>
                <input
                  type="range"
                  id="speech-rate"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speechRate}
                  onChange={handleSpeechRateChange}
                  aria-describedby="speech-rate-desc"
                  aria-valuetext={`${speechRate.toFixed(1)} times normal speed`}
                />
                <div className={styles.rangeValues} aria-hidden="true">
                  <span>0.5x (Slow)</span>
                  <span>2.0x (Fast)</span>
                </div>
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingLabel}>
                <label htmlFor="speech-pitch">Speech Pitch</label>
                <p className={styles.settingDescription}>
                  Current pitch: {speechPitch.toFixed(1)}x normal
                </p>
              </div>
              <div className={styles.rangeContainer}>
                <input
                  type="range"
                  id="speech-pitch"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speechPitch}
                  onChange={handleSpeechPitchChange}
                  aria-describedby="speech-pitch-desc"
                  aria-valuetext={`${speechPitch.toFixed(
                    1
                  )} times normal pitch`}
                />
                <div className={styles.rangeValues} aria-hidden="true">
                  <span>0.5x (Low)</span>
                  <span>2.0x (High)</span>
                </div>
              </div>
            </div>
          </fieldset>

          <div className={styles.settingItem}>
            <button
              onClick={resetToDefaults}
              className={styles.secondaryBtn}
              aria-describedby="reset-desc"
            >
              Reset to Defaults
            </button>
            <div id="reset-desc" className={styles.srOnly}>
              Resets all settings to their original values
            </div>
          </div>
        </div>

        {/* Live region for announcements - consistent with Home component */}
        <div
          ref={liveRegionRef}
          aria-live="polite"
          aria-atomic="true"
          className={styles.srOnly}
        >
          {/* Screen reader announcements appear here */}
        </div>
      </div>
    </div>
  );
};

export default Settings;
