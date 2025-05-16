import React, { useEffect, useState } from "react";
import styles from "./Settings.module.css";
import { getPreference, savePreference } from "../../utils/preferences";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const [speechRate, setSpeechRate] = useState<number>(1);
  const [speechPitch, setSpeechPitch] = useState<number>(1);

  useEffect(() => {
    // Load saved preferences when component mounts
    setAutoSpeak(getPreference("autoSpeak", true));
    setSpeechRate(getPreference("speechRate", 1));
    setSpeechPitch(getPreference("speechPitch", 1));
  }, []);

  const handleAutoSpeakChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.checked;
    setAutoSpeak(value);
    savePreference("autoSpeak", value);
  };

  const handleSpeechRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSpeechRate(value);
    savePreference("speechRate", value);
  };

  const handleSpeechPitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSpeechPitch(value);
    savePreference("speechPitch", value);
  };

  const resetToDefaults = () => {
    setAutoSpeak(true);
    setSpeechRate(1);
    setSpeechPitch(1);
    savePreference("autoSpeak", true);
    savePreference("speechRate", 1);
    savePreference("speechPitch", 1);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Settings</h2>
          <button
            onClick={onClose}
            className={styles.iconBtn}
            aria-label="Close Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className={styles.settingsOptions}>
          <div className={styles.settingItem}>
            <label htmlFor="auto-speak">Automatically speak results</label>
            <label className={styles.switch}>
              <input
                type="checkbox"
                id="auto-speak"
                checked={autoSpeak}
                onChange={handleAutoSpeakChange}
              />
              <span className={`${styles.slider} ${styles.round}`}></span>
            </label>
          </div>

          <div className={styles.settingItem}>
            <label htmlFor="speech-rate">Speech Rate</label>
            <input
              type="range"
              id="speech-rate"
              min="0.5"
              max="2"
              step="0.1"
              value={speechRate}
              onChange={handleSpeechRateChange}
            />
            <div className={styles.rangeValues}>
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>

          <div className={styles.settingItem}>
            <label htmlFor="speech-pitch">Speech Pitch</label>
            <input
              type="range"
              id="speech-pitch"
              min="0.5"
              max="2"
              step="0.1"
              value={speechPitch}
              onChange={handleSpeechPitchChange}
            />
            <div className={styles.rangeValues}>
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          <div className={styles.settingItem}>
            <button onClick={resetToDefaults} className={styles.secondaryBtn}>
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
