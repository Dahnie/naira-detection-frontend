import React, { useEffect, useState, useRef, useCallback } from "react";
import styles from "./Settings.module.css";
import {
  DEFAULT_PREFERENCES,
  getPreference,
  savePreference,
} from "../../utils/preferences";
import {
  announceToScreenReader,
  triggerVibration,
} from "../../utils/accessibiltyHelper";
import { useSpeech } from "@hooks/useSpeech";

// Types
interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsState {
  autoSpeak: boolean;
  speechRate: number;
  speechPitch: number;
}

// Constants
const SPEECH_RATE_RANGE = {
  MIN: 0.5,
  MAX: 2,
  STEP: 0.1,
} as const;

const SPEECH_PITCH_RANGE = {
  MIN: 0.5,
  MAX: 2,
  STEP: 0.1,
} as const;

const VIBRATION_PATTERNS = {
  SETTING_CHANGE: 50,
  MINOR_CHANGE: 20,
  RESET: 100,
} as const;

const SPEECH_DELAY = 100;
const FOCUS_DELAY = 100;

const MESSAGES = {
  MODAL_OPENED:
    "Settings modal opened. Use tab to navigate between options, escape to close.",
  MODAL_CLOSED: "Settings closed",
  AUTO_SPEAK_ENABLED:
    "Auto-speak enabled. Currency detection results will be announced automatically.",
  AUTO_SPEAK_DISABLED:
    "Auto-speak disabled. You'll need to manually request result announcements.",
  RESET_COMPLETE:
    "All settings reset to default values. Auto-speak enabled, speech rate normal, speech pitch normal.",
} as const;

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  // State
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_PREFERENCES);

  // Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { speak: speak } = useSpeech();
  const canSpeak = getPreference("autoSpeak");

  // Utility functions
  const announceMessage = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      if (!canSpeak) announceToScreenReader(liveRegionRef, message, priority);
    },
    []
  );

  const loadPreferences = useCallback(() => {
    const loadedSettings: SettingsState = {
      autoSpeak: getPreference("autoSpeak"),
      speechRate: getPreference("speechRate"),
      speechPitch: getPreference("speechPitch"),
    };
    setSettings(loadedSettings);
  }, []);

  const updateSetting = useCallback(
    <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      savePreference(key, value);
    },
    []
  );

  const formatSpeechRateMessage = useCallback((rate: number): string => {
    return `Speech rate set to ${rate.toFixed(1)} times normal speed`;
  }, []);

  const formatSpeechPitchMessage = useCallback((pitch: number): string => {
    return `Speech pitch set to ${pitch.toFixed(1)} times normal pitch`;
  }, []);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    const elements = modalRef.current?.querySelectorAll(
      'button, input, [tabindex]:not([tabindex="-1"])'
    );
    return elements ? (Array.from(elements) as HTMLElement[]) : [];
  }, []);

  const trapFocus = useCallback(
    (event: React.KeyboardEvent) => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },
    [getFocusableElements]
  );

  const handleModalClose = useCallback(() => {
    onClose();
    announceMessage(MESSAGES.MODAL_CLOSED, "polite");
  }, [onClose]);

  // Event handlers
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          handleModalClose();
          break;
        case "Tab":
          trapFocus(event);
          break;
      }
    },
    [handleModalClose, trapFocus]
  );

  const handleAutoSpeakChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.checked;
      updateSetting("autoSpeak", value);
      triggerVibration(VIBRATION_PATTERNS.SETTING_CHANGE);

      const message = value
        ? MESSAGES.AUTO_SPEAK_ENABLED
        : MESSAGES.AUTO_SPEAK_DISABLED;
      speak(message, true);
      announceMessage(message, "polite");
    },
    [updateSetting, speak]
  );

  const handleSpeechRateChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(event.target.value);
      updateSetting("speechRate", value);
      triggerVibration(VIBRATION_PATTERNS.MINOR_CHANGE);

      const message = formatSpeechRateMessage(value);
      announceMessage(message, "polite");

      setTimeout(() => speak(message), SPEECH_DELAY);
    },
    [updateSetting, formatSpeechRateMessage, speak]
  );

  const handleSpeechPitchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(event.target.value);
      updateSetting("speechPitch", value);
      triggerVibration(VIBRATION_PATTERNS.MINOR_CHANGE);

      const message = formatSpeechPitchMessage(value);
      announceMessage(message, "polite");

      setTimeout(() => speak(message), SPEECH_DELAY);
    },
    [updateSetting, formatSpeechPitchMessage, speak]
  );

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_PREFERENCES);

    Object.entries(DEFAULT_PREFERENCES).forEach(([key, value]) => {
      savePreference(key as keyof SettingsState, value);
    });

    triggerVibration(VIBRATION_PATTERNS.RESET);
    speak(MESSAGES.RESET_COMPLETE);
    announceMessage(MESSAGES.RESET_COMPLETE, "polite");
  }, [speak]);

  // Effects
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;

      const focusTimer = setTimeout(() => {
        modalRef.current?.focus();
      }, FOCUS_DELAY);

      announceMessage(MESSAGES.MODAL_OPENED, "polite");

      return () => clearTimeout(focusTimer);
    } else if (previouslyFocusedElement.current) {
      previouslyFocusedElement.current.focus();
    }
  }, [isOpen]);

  // Render helpers
  const renderCloseButton = () => (
    <button
      onClick={handleModalClose}
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
  );

  const renderAutoSpeakSetting = () => (
    <div className={styles.settingItem}>
      <div className={styles.settingLabel}>
        <label htmlFor="auto-speak">Automatically speak results</label>
        <p className={styles.settingDescription}>
          When enabled, currency detection results are announced immediately
        </p>
      </div>
      <label className={styles.switch}>
        <input
          type="checkbox"
          id="auto-speak"
          checked={settings.autoSpeak}
          onChange={handleAutoSpeakChange}
          aria-describedby="auto-speak-desc"
        />
        <span
          className={`${styles.slider} ${styles.round}`}
          aria-hidden="true"
        />
        <span className={styles.srOnly}>
          {settings.autoSpeak
            ? "Auto-speak is currently enabled"
            : "Auto-speak is currently disabled"}
        </span>
      </label>
    </div>
  );

  const renderSpeechRateSetting = () => (
    <div className={styles.settingItem}>
      <div className={styles.settingLabel}>
        <label htmlFor="speech-rate">Speech Rate</label>
        <p className={styles.settingDescription}>
          Current rate: {settings.speechRate.toFixed(1)}x speed
        </p>
      </div>
      <div className={styles.rangeContainer}>
        <input
          type="range"
          id="speech-rate"
          min={SPEECH_RATE_RANGE.MIN}
          max={SPEECH_RATE_RANGE.MAX}
          step={SPEECH_RATE_RANGE.STEP}
          value={settings.speechRate}
          onChange={handleSpeechRateChange}
          aria-describedby="speech-rate-desc"
          aria-valuetext={`${settings.speechRate.toFixed(
            1
          )} times normal speed`}
        />
        <div className={styles.rangeValues} aria-hidden="true">
          <span>{SPEECH_RATE_RANGE.MIN}x (Slow)</span>
          <span>{SPEECH_RATE_RANGE.MAX}x (Fast)</span>
        </div>
      </div>
    </div>
  );

  const renderSpeechPitchSetting = () => (
    <div className={styles.settingItem}>
      <div className={styles.settingLabel}>
        <label htmlFor="speech-pitch">Speech Pitch</label>
        <p className={styles.settingDescription}>
          Current pitch: {settings.speechPitch.toFixed(1)}x normal
        </p>
      </div>
      <div className={styles.rangeContainer}>
        <input
          type="range"
          id="speech-pitch"
          min={SPEECH_PITCH_RANGE.MIN}
          max={SPEECH_PITCH_RANGE.MAX}
          step={SPEECH_PITCH_RANGE.STEP}
          value={settings.speechPitch}
          onChange={handleSpeechPitchChange}
          aria-describedby="speech-pitch-desc"
          aria-valuetext={`${settings.speechPitch.toFixed(
            1
          )} times normal pitch`}
        />
        <div className={styles.rangeValues} aria-hidden="true">
          <span>{SPEECH_PITCH_RANGE.MIN}x (Low)</span>
          <span>{SPEECH_PITCH_RANGE.MAX}x (High)</span>
        </div>
      </div>
    </div>
  );

  const renderResetButton = () => (
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
  );

  const renderModalHeader = () => (
    <div className={styles.modalHeader}>
      <h2 id="settings-title">Settings</h2>
      {renderCloseButton()}
    </div>
  );

  const renderSettingsOptions = () => (
    <div className={styles.settingsOptions}>
      <fieldset className={styles.settingFieldset}>
        <legend className={styles.srOnly}>Speech Settings</legend>
        {renderAutoSpeakSetting()}
        {renderSpeechRateSetting()}
        {renderSpeechPitchSetting()}
      </fieldset>
      {renderResetButton()}
    </div>
  );

  const renderScreenReaderDescription = () => (
    <div id="settings-description" className={styles.srOnly}>
      Settings for customizing speech and audio preferences. Use tab to
      navigate, escape to close.
    </div>
  );

  const renderLiveRegion = () => (
    <div
      ref={liveRegionRef}
      aria-live="polite"
      aria-atomic="true"
      className={styles.srOnly}
    />
  );

  // Early return if not open
  if (!isOpen) return null;

  // Main render
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
        {renderScreenReaderDescription()}
        {renderModalHeader()}
        {renderSettingsOptions()}
        {renderLiveRegion()}
      </div>
    </div>
  );
};

export default Settings;
