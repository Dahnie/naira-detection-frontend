import { useState, useEffect, useRef } from "react";
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
// import { cropCurrencyFromImage } from "@hooks/useCurrencyCropper";

// App component
const Home: React.FC = () => {
  // State
  const [currentView, setCurrentView] = useState<"camera" | "result">("camera");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [detectionResult, setDetectionResult] =
    useState<DetectionResult | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);

  // Accessibility refs
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const skipLinkRef = useRef<HTMLAnchorElement>(null);

  // Hooks
  const { speak, isSpeaking } = useSpeech();

  // Cleanup image URL when component unmounts
  useEffect(() => {
    return () => {
      if (resultImageUrl) {
        revokeImageUrl(resultImageUrl);
      }
    };
  }, [resultImageUrl]);

  // Welcome announcement on component mount
  useEffect(() => {
    const welcomeMessage =
      currentView === "camera"
        ? "Naira Note Detector loaded. Use camera to capture or upload an image of a naira note for detection. Settings button available in top right corner."
        : "Detection results displayed. Use back button to return to camera.";

    // Delay to ensure screen reader is ready
    setTimeout(() => {
      announceToScreenReader(liveRegionRef, welcomeMessage, "polite");
      if (getPreference("autoSpeak")) {
        speak(welcomeMessage);
      }
    }, 1000);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case "Escape":
          if (showSettings) {
            setShowSettings(false);
            announceToScreenReader(liveRegionRef, "Settings closed");
          } else if (currentView === "result") {
            resetToCamera();
          }
          break;
        case "s":
        case "S":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setShowSettings(!showSettings);
            announceToScreenReader(
              liveRegionRef,
              showSettings ? "Settings closed" : "Settings opened"
            );
          }
          break;
        case "r":
        case "R":
          if (currentView === "result" && detectionResult) {
            event.preventDefault();
            handleSpeakResult();
          }
          break;
        case "b":
        case "B":
          if (currentView === "result") {
            event.preventDefault();
            resetToCamera();
          }
          break;
        case "?":
          event.preventDefault();
          announceHelpInstructions();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentView, showSettings, detectionResult]);

  // Announce help instructions
  const announceHelpInstructions = () => {
    const instructions =
      currentView === "camera"
        ? "Camera view: Press spacebar to capture photo, or press F to select file. Press Ctrl+S for settings, or press question mark for help."
        : "Results view: Press R to repeat result, press B to go back to camera, press Ctrl+S for settings.";

    announceToScreenReader(liveRegionRef, instructions, "assertive");
    speak(instructions);
  };

  // Handle image capture from camera
  const handleCapture = async (imageBlob: Blob) => {
    triggerVibration(); // small vibration feedback
    announceToScreenReader(
      liveRegionRef,
      "Image captured, processing for naira note detection...",
      "assertive"
    );
    processImage(imageBlob);
  };

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      const errorMsg = "Invalid file type. Please select an image file.";
      toastHandler.error(errorMsg);
      announceToScreenReader(liveRegionRef, errorMsg, "assertive");
      speak(errorMsg);
      return;
    }

    triggerVibration(); // small vibration feedback
    announceToScreenReader(
      liveRegionRef,
      "Image selected, processing for naira note detection...",
      "assertive"
    );
    processImage(file);
  };

  // Process image for detection
  const processImage = async (imageBlob: Blob) => {
    setIsLoading(true);
    announceToScreenReader(
      liveRegionRef,
      "Processing image, please wait...",
      "assertive"
    );

    try {
      // Create URL for the original image
      const url = createImageUrl(imageBlob);
      setResultImageUrl(url);

      // Detect naira note
      const result = await detectNairaNote(imageBlob);
      if (!result) {
        announceToScreenReader(
          liveRegionRef,
          "Detection failed. Please try again.",
          "assertive"
        );
        speak("Detection failed. Please try again.");
        setIsLoading(false);
        triggerVibration(200); // longer vibration for error
        return;
      }

      setDetectionResult(result);
      // Switch to result view
      setCurrentView("result");
    } catch (error) {
      console.error("Error processing image:", error);
      const errorMsg =
        "Failed to process image. Please try again with a different image or check your internet connection.";
      toastHandler.error(errorMsg);
      announceToScreenReader(liveRegionRef, errorMsg, "assertive");
      speak(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle speaking result
  const handleSpeakResult = () => {
    if (!detectionResult) {
      const noResultMsg = "No detection result available.";
      announceToScreenReader(liveRegionRef, noResultMsg);
      speak(noResultMsg);
      return;
    }

    let resultMessage = "";
    if (detectionResult.top_detection) {
      const topResult = detectionResult.top_detection;
      const confidencePercent = Math.round(topResult.confidence * 100);
      resultMessage = `Detected ${topResult.denomination} note with ${confidencePercent} percent confidence.`;

      // Add tips based on confidence
      if (topResult.confidence < 0.7) {
        resultMessage +=
          " Low confidence detected. Try capturing with better lighting, steadier hands, or ensure the entire note is visible.";
      } else if (topResult.confidence > 0.9) {
        resultMessage += " High confidence detection.";
      }
    } else {
      resultMessage =
        "No Naira note detected in this image. Please ensure you have a clear image of a Nigerian Naira banknote with good lighting.";
    }

    // Speak result if auto-speak is enabled
    const shouldAutoSpeak = getPreference("autoSpeak");
    if (shouldAutoSpeak) {
      speak(resultMessage);
    }
    announceToScreenReader(liveRegionRef, resultMessage, "polite");
  };

  // Auto-speak result when detection completes (if enabled)
  useEffect(() => {
    if (currentView === "result" && detectionResult) {
      const shouldAutoSpeak = getPreference("autoSpeak");
      if (shouldAutoSpeak) {
        // Small delay to ensure view transition is complete
        setTimeout(() => {
          handleSpeakResult();
        }, 500);
      }
    }
  }, [detectionResult, currentView]);

  // Reset to camera view
  const resetToCamera = () => {
    setCurrentView("camera");
    announceToScreenReader(
      liveRegionRef,
      "Returned to camera view. Ready to capture or select new image.",
      "polite"
    );

    // Clean up resources
    if (resultImageUrl) {
      revokeImageUrl(resultImageUrl);
      setResultImageUrl(null);
    }

    setDetectionResult(null);

    // Focus management - return focus to main content
    if (mainContentRef.current) {
      mainContentRef.current.focus();
    }
  };

  // Handle skip link
  const handleSkipToContent = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (mainContentRef.current) {
      mainContentRef.current.focus();
      announceToScreenReader(liveRegionRef, "Skipped to main content");
    }
  };

  return (
    <div className={styles.app}>
      {/* Skip to content link for keyboard users */}
      <a
        href="#main-content"
        ref={skipLinkRef}
        className={styles.skipLink}
        onClick={handleSkipToContent}
      >
        Skip to main content
      </a>

      {/* Live region for screen reader announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className={styles.srOnly}
      >
        {/* Screen reader announcements appear here */}
      </div>

      {/* Application landmark */}
      <div role="application" aria-label="Naira Note Detection System">
        <header className={styles.header} role="banner">
          <h1 id="app-title">Naira Note Detector</h1>
          <button
            className={styles.settingsButton}
            onClick={() => {
              setShowSettings(true);
              announceToScreenReader(liveRegionRef, "Settings opened");
            }}
            aria-label="Open settings menu"
            aria-describedby="settings-description"
            aria-expanded={showSettings}
            type="button"
          >
            <SettingsIcon size={24} aria-hidden="true" />
            <span className={styles.srOnly}>Open settings</span> {/* <-- new */}
          </button>
          <div id="settings-description" className={styles.srOnly}>
            Configure voice settings, auto-speak preferences, and accessibility
            options
          </div>
        </header>

        <main
          className={styles.main}
          ref={mainContentRef}
          id="main-content"
          role="main"
          tabIndex={-1}
          aria-labelledby="app-title"
          aria-describedby="current-view-description"
        >
          {/* Current view description for context */}
          <div id="current-view-description" className={styles.srOnly}>
            {currentView === "camera"
              ? "Camera interface active. Capture or upload image of naira note for detection."
              : "Detection results displayed. Review detected denomination and confidence level."}
          </div>

          {/* Loading state announcement */}
          {isLoading && (
            <div
              role="status"
              aria-live="assertive"
              aria-label="Processing"
              className={styles.srOnly}
            >
              Processing image for naira note detection, please wait...
            </div>
          )}

          {/* Main content area */}
          {currentView === "camera" ? (
            <Camera
              onCapture={handleCapture}
              onFileSelect={handleFileSelect}
              isLoading={isLoading}
            />
          ) : (
            <Result
              imageUrl={resultImageUrl || ""}
              denomination={
                detectionResult?.top_detection?.denomination || null
              }
              confidence={detectionResult?.top_detection?.confidence || 0}
              onBack={resetToCamera}
              onNewScan={resetToCamera}
              onSpeak={handleSpeakResult}
              isSpeaking={isSpeaking}
            />
          )}
        </main>

        {/* Keyboard shortcuts help (visually hidden) */}
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

        {/* Settings Modal */}
        {showSettings && (
          <Settings
            isOpen={showSettings}
            onClose={() => {
              setShowSettings(false);
              announceToScreenReader(liveRegionRef, "Settings closed");
            }}
          />
        )}

        {/* Loading Indicator - keeping commented as per original */}
        {/* {isLoading && <Loading message="Processing Image..." />} */}
      </div>
    </div>
  );
};

export default Home;
