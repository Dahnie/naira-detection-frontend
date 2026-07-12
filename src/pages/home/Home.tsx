import { useState, useEffect, useRef, useCallback } from "react";
import {
  detectNairaNote,
  createImageUrl,
  revokeImageUrl,
} from "@utils/detection";
import styles from "./Home.module.css";
import Camera from "@components/camera/Camera";
import Result from "@components/result/Result";
import { useSpeech } from "@hooks/useSpeech";
import type { DetectionResult } from "@models/Types";
import Settings from "@components/settings/Settings";
import { Settings as SettingsIcon } from "lucide-react";
import { getPreference } from "@utils/preferences";
import { toastHandler } from "@utils/toastHandlerSingleton";
import {
  announceToScreenReader,
  triggerVibration,
} from "@utils/accessibiltyHelper";

// Types
type ViewType = "camera" | "result";

interface KeyboardHandler {
  [key: string]: () => void;
}

// Constants
const ANNOUNCEMENT_DELAY = 1000;
const AUTO_SPEAK_DELAY = 500;
const ERROR_VIBRATION_DURATION = 200;

const MESSAGES = {
  WELCOME_CAMERA:
    "Naira Note Detector loaded. Use camera to capture or upload an image of a naira note for detection.",
  WELCOME_RESULT:
    "Detection results displayed. Use back button to return to camera.",
  CAPTURE_PROCESSING: "Image captured, processing for naira note detection...",
  FILE_PROCESSING: "Image selected, processing for naira note detection...",
  PROCESSING_WAIT: "Processing image, please wait...",
  DETECTION_FAILED: "Detection failed. Please try again.",
  INVALID_FILE: "Invalid file type. Please select an image file.",
  PROCESSING_ERROR:
    "Failed to process image. Please try again with a different image or check your internet connection.",
  NO_RESULT: "No detection result available.",
  SETTINGS_OPENED: "Settings opened",
  SETTINGS_CLOSED: "Settings closed",
  RETURNED_TO_CAMERA:
    "Returned to camera view. Ready to capture or select new image.",
  NO_NAIRA_DETECTED:
    "No Naira note detected in this image. Please ensure you have a clear image of a Nigerian Naira banknote with good lighting.",
  LOW_CONFIDENCE_TIP:
    "Low confidence detected. Try capturing with better lighting, steadier hands, or ensure the entire note is visible.",
  HIGH_CONFIDENCE: "High confidence detection.",
} as const;

const KEYBOARD_INSTRUCTIONS = {
  CAMERA:
    "Camera view: Press spacebar or the capture button to capture photo, or press F or the upload button to select file. Press Ctrl+S or the settings button for settings, or press question mark for help.",
  RESULT:
    "Results view: Press R or the repeat button to repeat result, press B or the back button to go back to camera, press Ctrl+S or the settings button for settings.",
} as const;

const Home: React.FC = () => {
  // State
  const [currentView, setCurrentView] = useState<ViewType>("camera");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [detectionResult, setDetectionResult] =
    useState<DetectionResult | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);

  // Refs
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const hasAnnouncedWelcome = useRef(false); // Add this ref to track welcome message
  // Hooks
  const { speak, isSpeaking } = useSpeech();

  const announceMessage = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      // When auto-speak is on, TTS already reads the message aloud, so the
      // live region is skipped to avoid a screen reader announcing it twice.
      if (!getPreference("autoSpeak")) {
        announceToScreenReader(liveRegionRef, message, priority);
      }
    },
    []
  );

  const cleanupResources = useCallback(() => {
    if (resultImageUrl) {
      revokeImageUrl(resultImageUrl);
      setResultImageUrl(null);
    }
  }, [resultImageUrl]);

  const formatDetectionMessage = useCallback(
    (result: DetectionResult): string => {
      if (!result.top_detection) {
        return MESSAGES.NO_NAIRA_DETECTED;
      }

      const { denomination, confidence } = result.top_detection;
      const confidencePercent = Math.round(confidence * 100);
      let message = `Detected ${denomination} note with ${confidencePercent} percent confidence.`;

      if (confidence < 0.7) {
        message = MESSAGES.LOW_CONFIDENCE_TIP;
      } else if (confidence > 0.9) {
        message += ` ${MESSAGES.HIGH_CONFIDENCE}`;
      }

      return message;
    },
    []
  );

  const validateImageFile = useCallback(
    (file: File): boolean => {
      if (!file.type.startsWith("image/")) {
        const errorMsg = MESSAGES.INVALID_FILE;
        toastHandler.error(errorMsg);
        announceMessage(errorMsg, "assertive");
        speak(errorMsg);
        triggerVibration(ERROR_VIBRATION_DURATION);
        return false;
      }
      return true;
    },
    [speak]
  );

  const focusMainContent = useCallback(() => {
    if (mainContentRef.current) {
      mainContentRef.current.focus();
    }
  }, []);

  // Event handlers
  const handleCapture = useCallback(
    async (imageBlob: Blob) => {
      triggerVibration();
      announceMessage(MESSAGES.CAPTURE_PROCESSING, "assertive");
      processImage(imageBlob);
    },
    [announceMessage]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!validateImageFile(file)) return;

      triggerVibration();
      announceMessage(MESSAGES.FILE_PROCESSING, "assertive");
      processImage(file);
    },
    [validateImageFile, announceMessage]
  );

  const processImage = async (imageBlob: Blob) => {
    setIsLoading(true);
    speak(MESSAGES.PROCESSING_WAIT);
    announceMessage(MESSAGES.PROCESSING_WAIT, "assertive");

    try {
      const url = createImageUrl(imageBlob);
      setResultImageUrl(url);

      const result = await detectNairaNote(imageBlob);
      if (!result) {
        speak(MESSAGES.DETECTION_FAILED);
        announceMessage(MESSAGES.DETECTION_FAILED, "assertive");
        triggerVibration(ERROR_VIBRATION_DURATION);
        return;
      }

      setDetectionResult(result);
      setCurrentView("result");
      triggerVibration();
      hasAnnouncedWelcome.current = false; // Reset for new view
    } catch (error) {
      console.error("Error processing image:", error);
      const errorMsg = MESSAGES.PROCESSING_ERROR;
      speak(errorMsg);
      announceMessage(MESSAGES.DETECTION_FAILED, "assertive");
      triggerVibration(ERROR_VIBRATION_DURATION);
      toastHandler.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakResult = useCallback(() => {
    if (!detectionResult) {
      speak(MESSAGES.NO_RESULT);
      announceMessage(MESSAGES.NO_RESULT);
      return;
    }

    const resultMessage = formatDetectionMessage(detectionResult);
    const shouldAutoSpeak = getPreference("autoSpeak");

    if (shouldAutoSpeak) {
      speak(resultMessage);
    }
    announceMessage(resultMessage, "polite");
  }, [detectionResult, formatDetectionMessage]);

  const resetToCamera = useCallback(() => {
    setCurrentView("camera");
    announceMessage(MESSAGES.RETURNED_TO_CAMERA, "polite");
    cleanupResources();
    setDetectionResult(null);
    focusMainContent();
    hasAnnouncedWelcome.current = false; // Reset for new view
  }, [announceMessage, cleanupResources, focusMainContent]);

  const toggleSettings = useCallback(() => {
    const newShowSettings = !showSettings;
    setShowSettings(newShowSettings);
    announceMessage(
      newShowSettings ? MESSAGES.SETTINGS_OPENED : MESSAGES.SETTINGS_CLOSED
    );
  }, [showSettings, announceMessage]);

  const handleSettingsClose = useCallback(() => {
    setShowSettings(false);
    announceMessage(MESSAGES.SETTINGS_CLOSED);
  }, [announceMessage]);

  const announceHelpInstructions = useCallback(() => {
    const instructions =
      currentView === "camera"
        ? KEYBOARD_INSTRUCTIONS.CAMERA
        : KEYBOARD_INSTRUCTIONS.RESULT;

    announceMessage(instructions, "assertive");
  }, [currentView, announceMessage]);

  // Keyboard handlers
  const createKeyboardHandlers = useCallback((): KeyboardHandler => {
    const baseHandlers: KeyboardHandler = {
      "?": announceHelpInstructions,
      Escape: () => {
        if (showSettings) {
          handleSettingsClose();
        } else if (currentView === "result") {
          resetToCamera();
        }
      },
    };

    // Add conditional handlers based on current view
    if (currentView === "result" && detectionResult) {
      baseHandlers.r = handleSpeakResult;
      baseHandlers.R = handleSpeakResult;
      baseHandlers.b = resetToCamera;
      baseHandlers.B = resetToCamera;
    }

    return baseHandlers;
  }, [
    announceHelpInstructions,
    showSettings,
    currentView,
    detectionResult,
    handleSettingsClose,
    resetToCamera,
    handleSpeakResult,
  ]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Handle Ctrl+S for settings
      if (
        (event.key === "s" || event.key === "S") &&
        (event.ctrlKey || event.metaKey)
      ) {
        event.preventDefault();
        toggleSettings();
        return;
      }

      const handlers = createKeyboardHandlers();
      const handler = handlers[event.key];

      if (handler) {
        event.preventDefault();
        handler();
      }
    },
    [createKeyboardHandlers, toggleSettings]
  );

  // Effects
  useEffect(() => {
    return cleanupResources;
  }, [cleanupResources]);

  // Fixed welcome message effect - only runs once per view change
  useEffect(() => {
    if (currentView !== "camera") return;
    // Skip if we've already announced for this view
    if (hasAnnouncedWelcome.current) return;

    const welcomeMessage =
      currentView === "camera" ? MESSAGES.WELCOME_CAMERA : "";

    const announceWelcome = () => {
      hasAnnouncedWelcome.current = true;
      announceMessage(welcomeMessage, "polite");
      speak(welcomeMessage);
    };

    const timeoutId = setTimeout(announceWelcome, ANNOUNCEMENT_DELAY);
    return () => clearTimeout(timeoutId);
  }, [currentView, speak]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Auto-speak result when switching to result view (only once per result)
  useEffect(() => {
    if (
      currentView === "result" &&
      detectionResult &&
      getPreference("autoSpeak") &&
      !hasAnnouncedWelcome.current // Only if we haven't processed this result yet
    ) {
      const timeoutId = setTimeout(() => {
        handleSpeakResult();
      }, AUTO_SPEAK_DELAY);
      return () => clearTimeout(timeoutId);
    }
  }, [detectionResult, currentView, handleSpeakResult]);

  // Render helpers
  const renderHeader = () => (
    <header className={styles.header} role="banner">
      <h1 id="app-title">Naira Note Detector</h1>
      <button
        className={styles.settingsButton}
        onClick={toggleSettings}
        aria-label="Open settings menu"
        aria-describedby="settings-description"
        aria-expanded={showSettings}
        type="button"
      >
        <SettingsIcon size={24} aria-hidden="true" />
        <span className={styles.srOnly}>Open settings</span>
      </button>
      <div id="settings-description" className={styles.srOnly}>
        Configure voice settings, auto-speak preferences, and accessibility
        options
      </div>
    </header>
  );

  const renderMainContent = () => (
    <main
      className={styles.main}
      ref={mainContentRef}
      id="main-content"
      role="main"
      tabIndex={-1}
      aria-labelledby="app-title"
      aria-describedby="current-view-description"
    >
      {renderCurrentViewDescription()}
      {renderLoadingStatus()}
      {renderActiveView()}
    </main>
  );

  const renderCurrentViewDescription = () => (
    <div id="current-view-description" className={styles.srOnly}>
      {currentView === "camera"
        ? "Camera interface active. Capture or upload image of naira note for detection."
        : "Detection results displayed. Review detected denomination and confidence level."}
    </div>
  );

  const renderLoadingStatus = () =>
    isLoading && (
      <div
        role="status"
        aria-live="assertive"
        aria-label="Processing"
        className={styles.srOnly}
      >
        Processing image for naira note detection, please wait...
      </div>
    );

  const renderActiveView = () => {
    if (currentView === "camera") {
      return (
        <Camera
          onCapture={handleCapture}
          onFileSelect={handleFileSelect}
          isLoading={isLoading}
        />
      );
    }

    return (
      <Result
        imageUrl={resultImageUrl || ""}
        denomination={detectionResult?.top_detection?.denomination || null}
        confidence={detectionResult?.top_detection?.confidence || 0}
        onBack={resetToCamera}
        onNewScan={resetToCamera}
        onSpeak={handleSpeakResult}
        isSpeaking={isSpeaking}
        announceMessage={announceMessage}
      />
    );
  };

  const renderKeyboardShortcuts = () => (
    <div className={styles.srOnly}>
      <h2>Keyboard Shortcuts</h2>
      <ul>
        <li>Press ? for help instructions</li>
        <li>Press Ctrl+S to open settings</li>
        <li>Press Escape to close modals or return to camera</li>
        {currentView === "result" && (
          <>
            <li>Press R to repeat detection result</li>
            <li>Press B to go back to camera</li>
          </>
        )}
      </ul>
    </div>
  );

  const renderSettings = () =>
    showSettings && (
      <Settings isOpen={showSettings} onClose={handleSettingsClose} />
    );

  const renderLiveRegion = () => (
    <div
      ref={liveRegionRef}
      aria-live="polite"
      aria-atomic="true"
      className={styles.srOnly}
    />
  );

  // Main render
  return (
    <div className={styles.app}>
      {renderLiveRegion()}

      <div role="application" aria-label="Naira Note Detection System">
        {renderHeader()}
        {renderMainContent()}
        {renderKeyboardShortcuts()}
        {renderSettings()}
      </div>
    </div>
  );
};

export default Home;
