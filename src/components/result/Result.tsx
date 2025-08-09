import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Volume2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import styles from "./Result.module.css";
import {
  announceToScreenReader,
  triggerVibration,
} from "@utils/accessibiltyHelper";
import { classNames } from "@utils/classNames";

interface ResultProps {
  imageUrl: string;
  denomination: string | null;
  confidence: number;
  onBack: () => void;
  onNewScan: () => void;
  onSpeak: () => void;
  isSpeaking?: boolean;
}

const Result: React.FC<ResultProps> = ({
  imageUrl,
  denomination,
  confidence,
  onBack,
  onNewScan,
  onSpeak,
  isSpeaking = false,
}) => {
  const [confidenceLevel, setConfidenceLevel] = useState<
    "high" | "medium" | "low"
  >("low");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Refs for accessibility
  const resultHeaderRef = useRef<HTMLElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const confidenceBarRef = useRef<HTMLDivElement>(null);

  // Determine confidence level and associated messaging
  useEffect(() => {
    if (confidence > 0.85) {
      setConfidenceLevel("high");
    } else if (confidence > 0.6) {
      setConfidenceLevel("medium");
    } else {
      setConfidenceLevel("low");
    }
  }, [confidence]);

  // Focus management when component mounts
  useEffect(() => {
    if (resultHeaderRef.current) {
      resultHeaderRef.current.focus();
    }

    // Announce result summary to screen readers
    setTimeout(() => {
      const resultSummary = denomination
        ? `Detection results loaded. ${denomination} detected with ${Math.round(
            confidence * 100
          )} percent confidence.`
        : "Detection results loaded. No naira note was detected in the image.";

      announceToScreenReader(liveRegionRef, resultSummary, "polite");
    }, 500);
  }, [denomination, confidence]);

  // Handle keyboard navigation
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
        case "Backspace":
          event.preventDefault();
          handleBack();
          break;
        case " ": // Spacebar
        case "Enter":
          if (
            event.target === document.activeElement &&
            (event.target as HTMLElement).tagName !== "BUTTON"
          ) {
            event.preventDefault();
            onSpeak();
          }
          break;
        case "r":
        case "R":
          event.preventDefault();
          onSpeak();
          break;
        case "n":
        case "N":
          event.preventDefault();
          handleNewScan();
          break;
        case "b":
        case "B":
          event.preventDefault();
          handleBack();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Enhanced back handler with accessibility
  const handleBack = () => {
    announceToScreenReader(liveRegionRef, "Returning to camera view", "polite");
    triggerVibration(50); // Short vibration feedback
    onBack();
  };

  // Enhanced new scan handler with accessibility
  const handleNewScan = () => {
    announceToScreenReader(liveRegionRef, "Starting new scan", "polite");
    triggerVibration(50); // Short vibration feedback
    onNewScan();
  };

  // Enhanced speak handler with accessibility
  const handleSpeak = () => {
    if (isSpeaking) {
      announceToScreenReader(liveRegionRef, "Speech in progress", "polite");
      return;
    }

    announceToScreenReader(liveRegionRef, "Reading detection result", "polite");
    triggerVibration(30); // Light vibration feedback
    onSpeak();
  };

  // Image load handlers
  const handleImageLoad = () => {
    setImageLoaded(true);
    announceToScreenReader(
      liveRegionRef,
      "Result image loaded successfully",
      "polite"
    );
  };

  const handleImageError = () => {
    setImageError(true);
    announceToScreenReader(
      liveRegionRef,
      "Failed to load result image",
      "assertive"
    );
  };

  // Get confidence icon and description
  const getConfidenceIcon = () => {
    switch (confidenceLevel) {
      case "high":
        return <CheckCircle size={20} aria-hidden="true" />;
      case "medium":
        return <AlertTriangle size={20} aria-hidden="true" />;
      case "low":
        return <XCircle size={20} aria-hidden="true" />;
    }
  };

  const getConfidenceDescription = () => {
    switch (confidenceLevel) {
      case "high":
        return "High confidence detection. Result is very reliable.";
      case "medium":
        return "Medium confidence detection. Result is likely accurate.";
      case "low":
        return "Low confidence detection. Consider retaking with better lighting or positioning.";
    }
  };

  const getAccessibleImageAlt = () => {
    if (imageError) return "Image failed to load";
    if (!imageLoaded) return "Result image loading";

    if (denomination) {
      return `Captured image showing detected ${denomination} with ${Math.round(
        confidence * 100
      )} percent confidence`;
    } else {
      return "Captured image where no naira note was detected";
    }
  };

  return (
    <div
      className={styles.resultContainer}
      role="main"
      aria-labelledby="result-header"
    >
      {/* Live region for dynamic announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className={styles.srOnly}
      />

      {/* Screen reader instructions */}
      <div className={styles.srOnly}>
        <h2>Result Navigation Instructions</h2>
        <p>
          Press R to repeat result, N for new scan, B or Escape to go back, or
          use the buttons below.
        </p>
      </div>

      <header
        className={styles.resultHeader}
        ref={resultHeaderRef}
        tabIndex={-1}
        role="banner"
      >
        <button
          className={styles.backButton}
          onClick={handleBack}
          aria-label="Go back to camera view"
          aria-describedby="back-button-description"
          type="button"
        >
          <ArrowLeft size={44} aria-hidden="true" />
          <span className={classNames(styles.buttonText, styles.srOnly)}>
            Back
          </span>
        </button>
        <div id="back-button-description" className={styles.srOnly}>
          Return to camera interface to capture or select another image
        </div>

        <h2 id="result-header" className={styles.resultTitle}>
          Detection Result
        </h2>
      </header>

      <div
        className={styles.resultContent}
        role="region"
        aria-labelledby="result-content-title"
      >
        <h2 id="result-content-title" className={styles.srOnly}>
          Detection Results and Image
        </h2>

        {/* Result Image Section */}
        <section
          className={styles.resultImageContainer}
          aria-labelledby="image-section-title"
        >
          <h3 id="image-section-title" className={styles.srOnly}>
            Captured Image
          </h3>

          {imageError ? (
            <div
              className={styles.imageError}
              role="img"
              aria-label="Failed to load result image"
            >
              <XCircle size={48} aria-hidden="true" />
              <p>Image could not be loaded</p>
            </div>
          ) : (
            <>
              <img
                src={imageUrl}
                alt={getAccessibleImageAlt()}
                className={styles.resultImage}
                onLoad={handleImageLoad}
                onError={handleImageError}
                aria-describedby="image-description"
              />
              <div id="image-description" className={styles.srOnly}>
                {denomination
                  ? `This image shows the naira note that was analyzed and identified as ${denomination}.`
                  : "This image shows the captured photo where no naira note was detected."}
              </div>
            </>
          )}
        </section>

        {/* Detection Results Section */}
        <section
          className={styles.resultInfo}
          aria-labelledby="detection-results-title"
        >
          <h3 id="detection-results-title" className={styles.srOnly}>
            Detection Analysis
          </h3>

          <div className={styles.denominationContainer}>
            <h2
              className={styles.denominationText}
              aria-describedby="denomination-description"
              role="status"
              aria-live="polite"
            >
              {denomination || "No Naira note detected"}
            </h2>
            <div id="denomination-description" className={styles.srOnly}>
              {denomination
                ? `Successfully identified a ${denomination} banknote`
                : "The analysis could not identify any Nigerian naira banknote in this image"}
            </div>
          </div>

          {denomination && (
            <div
              className={styles.confidenceContainer}
              aria-labelledby="confidence-title"
            >
              <h4 id="confidence-title" className={styles.srOnly}>
                Detection Confidence
              </h4>

              <div
                className={styles.confidenceBarContainer}
                role="progressbar"
                aria-valuenow={Math.round(confidence * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Detection confidence: ${Math.round(
                  confidence * 100
                )} percent`}
                aria-describedby="confidence-description"
              >
                <div
                  ref={confidenceBarRef}
                  className={`${styles.confidenceBar} ${styles[confidenceLevel]}`}
                  style={{ width: `${confidence * 100}%` }}
                  aria-hidden="true"
                />
              </div>

              <div className={styles.confidenceInfo}>
                <div className={styles.confidenceTextContainer}>
                  {getConfidenceIcon()}
                  <span className={styles.confidenceText}>
                    {`${Math.round(confidence * 100)}% Confidence`}
                  </span>
                </div>
                <div id="confidence-description" className={styles.srOnly}>
                  {getConfidenceDescription()}
                </div>
              </div>

              {/* Additional guidance based on confidence */}
              {confidenceLevel === "low" && (
                <div
                  className={styles.guidanceBox}
                  role="alert"
                  aria-labelledby="guidance-title"
                >
                  <h5 id="guidance-title" className={styles.srOnly}>
                    Improvement Suggestions
                  </h5>
                  <p className={styles.guidanceText}>
                    For better results, try: Better lighting, steadier hands,
                    clearer positioning of the entire note.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* No detection guidance */}
          {!denomination && (
            <div
              className={styles.noDetectionBox}
              role="alert"
              aria-labelledby="no-detection-title"
            >
              <h4 id="no-detection-title" className={styles.srOnly}>
                No Detection Guidance
              </h4>
              <XCircle
                size={24}
                className={styles.noDetectionIcon}
                aria-hidden="true"
              />
              <p className={styles.noDetectionText}>
                Try again with better lighting, ensure the entire note is
                visible, or check that you're capturing a Nigerian naira
                banknote.
              </p>
            </div>
          )}
        </section>

        {/* Action Buttons Section */}
        <section
          className={styles.resultActions}
          aria-labelledby="actions-title"
        >
          <h3 id="actions-title" className={styles.srOnly}>
            Available Actions
          </h3>

          <div
            className={styles.buttonGroup}
            role="group"
            aria-label="Result actions"
          >
            <button
              className={`${styles.actionButton} ${styles.speakButton} ${
                isSpeaking ? styles.speaking : ""
              }`}
              onClick={handleSpeak}
              aria-label={
                isSpeaking
                  ? "Currently speaking result"
                  : "Speak detection result aloud"
              }
              aria-describedby="speak-button-description"
              disabled={isSpeaking}
              type="button"
            >
              <Volume2 size={20} aria-hidden="true" />
              <span className={styles.buttonText}>
                {isSpeaking ? "Speaking..." : "Speak Result"}
              </span>
            </button>
            <div id="speak-button-description" className={styles.srOnly}>
              Reads the detection result and confidence level aloud using
              text-to-speech
            </div>

            <button
              className={`${styles.actionButton} ${styles.newScanButton}`}
              onClick={handleNewScan}
              aria-label="Start a new scan by returning to camera"
              aria-describedby="new-scan-description"
              type="button"
            >
              <RefreshCw size={20} aria-hidden="true" />
              <span className={styles.buttonText}>New Scan</span>
            </button>
            <div id="new-scan-description" className={styles.srOnly}>
              Return to camera view to capture or select a different image for
              analysis
            </div>
          </div>

          {/* Keyboard shortcuts reminder */}
          <div
            className={styles.keyboardHints}
            aria-labelledby="shortcuts-title"
          >
            <h4 id="shortcuts-title" className={styles.srOnly}>
              Keyboard Shortcuts
            </h4>
            <p className={styles.srOnly}>
              Press R to speak result, N for new scan, B or Escape to go back
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Result;
