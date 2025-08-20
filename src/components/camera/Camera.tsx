import { useRef, useState, useEffect, useCallback } from "react";
import { useCamera } from "@hooks/useCamera";
import styles from "./Camera.module.css";
import {
  Camera as CameraIcon,
  Upload,
  RefreshCw,
  FlipHorizontal,
} from "lucide-react";
import {
  announceToScreenReader,
  triggerVibration,
} from "@utils/accessibiltyHelper";
import { toastHandler } from "@utils/toastHandlerSingleton";
import { useSpeech } from "@hooks/useSpeech";
import Loader from "@components/loader/Loader";
import { getPreference } from "@utils/preferences";

// Types
interface CameraProps {
  onCapture: (image: Blob) => void;
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

interface KeyboardHandler {
  [key: string]: () => void;
}

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VIBRATION_PATTERNS = {
  CAPTURE: 100,
  SUCCESS: [50, 50, 50],
  ERROR: 200,
  GENERAL: 50,
  FLASH: 30,
};

const Camera: React.FC<CameraProps> = ({
  onCapture,
  onFileSelect,
  isLoading,
}) => {
  // Hooks
  const { speak: speakChange } = useSpeech();
  const canSpeak = getPreference("autoSpeak");
  const {
    videoRef: cameraVideoRef,
    isStreamReady,
    error,
    captureImage,
    switchCamera,
  } = useCamera();

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureButtonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // State
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Utility functions
  const announceMessage = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      if (!canSpeak) announceToScreenReader(liveRegionRef, message, priority);
    },
    []
  );

  const announceAndSpeak = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      announceMessage(message, priority);
      speakChange(message);
    },
    [announceMessage, speakChange]
  );

  const validateFile = useCallback((file: File): string | null => {
    if (!file.type.startsWith("image/")) {
      return "Invalid file type. Please select an image file (JPG, PNG, etc.).";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File too large. Please select an image smaller than 10MB.";
    }
    return null;
  }, []);

  const addFlashEffect = useCallback(() => {
    if (overlayRef.current) {
      overlayRef.current.classList.add(styles.flashEffect);
      setTimeout(() => {
        overlayRef.current?.classList.remove(styles.flashEffect);
      }, 200);
    }
  }, []);

  // Event handlers
  const handleCapture = useCallback(async () => {
    if (!isStreamReady || isCapturing || isLoading) {
      if (!isStreamReady) {
        announceMessage(
          "Camera not ready. Please wait for camera to initialize or use upload option.",
          "assertive"
        );
      }
      return;
    }

    setIsCapturing(true);
    announceMessage("Capturing image...", "assertive");
    triggerVibration(VIBRATION_PATTERNS.CAPTURE);

    try {
      addFlashEffect();

      const imageBlob = await captureImage();
      if (imageBlob) {
        announceMessage(
          "Image captured successfully. Processing for detection...",
          "assertive"
        );
        onCapture(imageBlob);
        triggerVibration(VIBRATION_PATTERNS.SUCCESS);
      } else {
        throw new Error("Failed to capture image");
      }
    } catch (err) {
      console.error("Error capturing image:", err);
      const errorMsg =
        "Failed to capture image. Please try again or use the upload option.";
      announceMessage(errorMsg, "assertive");
      triggerVibration(VIBRATION_PATTERNS.ERROR);
    } finally {
      setIsCapturing(false);
    }
  }, [
    isStreamReady,
    isCapturing,
    isLoading,
    addFlashEffect,
    captureImage,
    onCapture,
  ]);

  const handleUploadClick = useCallback(() => {
    if (isLoading) {
      announceMessage("Please wait, processing current image.", "polite");
      return;
    }

    announceMessage("Opening file picker to select image...", "polite");
    triggerVibration(VIBRATION_PATTERNS.GENERAL);
    fileInputRef.current?.click();
  }, [isLoading]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const validationError = validateFile(file);

      if (validationError) {
        announceMessage(validationError, "assertive");
        return;
      }

      announceMessage(
        `Selected ${file.name}. Processing for naira note detection...`,
        "assertive"
      );

      onFileSelect(file);
      triggerVibration(VIBRATION_PATTERNS.GENERAL);

      // Reset input value for reselection
      e.target.value = "";
    },
    [validateFile, announceMessage, onFileSelect]
  );

  const handleFlashToggle = useCallback(() => {
    if (!isStreamReady) {
      announceMessage("Flash not available - camera not ready.", "polite");
      return;
    }

    const newFlashState = !flashEnabled;
    setFlashEnabled(newFlashState);
    const message = `Flash ${newFlashState ? "enabled" : "disabled"}.`;
    announceAndSpeak(message, "polite");
    triggerVibration(VIBRATION_PATTERNS.FLASH);
  }, [isStreamReady, flashEnabled, announceAndSpeak]);

  const handleSwitchCamera = useCallback(() => {
    if (!isStreamReady) {
      announceMessage("Cannot switch camera - camera not ready.", "polite");
      return;
    }

    try {
      switchCamera();
      const message = "Switching camera...";
      announceAndSpeak(message, "polite");
      triggerVibration(VIBRATION_PATTERNS.GENERAL);
    } catch (err) {
      announceMessage("Failed to switch camera", "assertive");
    }
  }, [isStreamReady, switchCamera, announceAndSpeak, announceMessage]);

  const handleRetry = useCallback(() => {
    announceMessage("Reloading page to retry camera access...", "assertive");
    triggerVibration(VIBRATION_PATTERNS.CAPTURE);
    window.location.reload();
  }, []);

  const announceHelpInstructions = useCallback(() => {
    const instructions = `
      Camera controls: 
      Press C or Spacebar to capture photo.
      Press U to upload image file.
      Press F to toggle flash.
      Press S to switch camera.
      Press question mark for help.
      Position naira note within the center guide for best results.
    `;
    announceMessage(instructions.trim(), "assertive");
  }, [announceMessage]);

  const handleVideoLoadedMetadata = useCallback(() => {
    announceMessage("Camera feed loaded successfully", "polite");
  }, [announceMessage]);

  const handleVideoError = useCallback(() => {
    const errorMsg =
      "Video feed error occurred. Please check camera permissions or try reloading the page.";
    toastHandler.error(errorMsg);
    announceMessage("Video feed error occurred", "assertive");
  }, [announceMessage]);

  // Keyboard handlers
  const keyboardHandlers: KeyboardHandler = {
    " ": handleCapture,
    Enter: handleCapture,
    c: handleCapture,
    C: handleCapture,
    u: handleUploadClick,
    U: handleUploadClick,
    f: handleFlashToggle,
    F: handleFlashToggle,
    s: handleSwitchCamera,
    S: handleSwitchCamera,
    "?": announceHelpInstructions,
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Handle spacebar and enter with special conditions
      if (event.key === " " || event.key === "Enter") {
        if (
          event.target === captureButtonRef.current ||
          !document.activeElement ||
          document.activeElement === document.body
        ) {
          event.preventDefault();
          handleCapture();
        }
        return;
      }

      // Handle S key with ctrl/cmd check
      if (
        (event.key === "s" || event.key === "S") &&
        (event.ctrlKey || event.metaKey)
      ) {
        return; // Allow browser save
      }

      const handler = keyboardHandlers[event.key];
      if (handler) {
        event.preventDefault();
        handler();
      }
    },
    [keyboardHandlers, handleCapture]
  );

  const getVideoAriaLabel = useCallback(() => {
    if (!isStreamReady) return "Camera initializing...";
    if (error) return "Camera unavailable";
    return "Live camera feed showing naira note detection area. Position note within center guide.";
  }, [isStreamReady, error]);

  // Effects
  useEffect(() => {
    if (cameraVideoRef.current && videoRef.current) {
      videoRef.current = cameraVideoRef.current;
    }
  }, [cameraVideoRef]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        announceMessage(
          "Camera interface ready. Position naira note within the frame guide and press capture button or spacebar to take photo.",
          "polite"
        );
      }
    };

    const events = ["click", "keydown", "touchstart"];
    events.forEach((event) => {
      document.addEventListener(event, handleFirstInteraction, { once: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleFirstInteraction);
      });
    };
  }, [hasUserInteracted]);

  useEffect(() => {
    if (error) {
      const errorMessage = error.includes("permission")
        ? "Camera permission denied. Please allow camera access or use the upload option to select an image file."
        : `Camera error: ${error}. Please try refreshing the page or use the upload option.`;

      setPermissionDenied(error.includes("permission"));
      announceAndSpeak(errorMessage, "assertive");
    } else if (isStreamReady) {
      console.log({ message: "Camera stream is ready." });
      // const message =
      //   "Camera is ready. You can now capture images of naira notes.";
      // announceAndSpeak(message, "polite");
    }
  }, [error, isStreamReady]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Render helpers
  const renderErrorState = () => (
    <div
      className={styles.errorContainer}
      role="alert"
      aria-labelledby="error-title"
    >
      <h3 id="error-title" className={styles.srOnly}>
        Camera Error
      </h3>

      <div className={styles.errorIcon} aria-hidden="true">
        <CameraIcon size={48} />
      </div>

      <p className={styles.errorMessage}>
        {permissionDenied
          ? "Camera access was denied. Please allow camera permissions in your browser settings, or use the upload option below to select an image file."
          : error}
      </p>

      <div className={styles.errorActions}>
        {!permissionDenied && (
          <button
            className={styles.retryButton}
            onClick={handleRetry}
            aria-label="Retry camera access by reloading page"
            type="button"
          >
            <RefreshCw size={20} aria-hidden="true" />
            <span>Retry Camera</span>
          </button>
        )}

        <button
          className={styles.uploadButton}
          onClick={handleUploadClick}
          aria-label="Upload image file instead of using camera"
          type="button"
        >
          <Upload size={20} aria-hidden="true" />
          <span>Upload Image</span>
        </button>
      </div>
    </div>
  );

  const renderVideoContainer = useCallback(() => {
    const loading = isLoading || isCapturing;
    return (
      <div
        className={styles.videoContainer}
        role="img"
        aria-labelledby="video-description"
      >
        {!loading && (
          <>
            <div id="video-description" className={styles.srOnly}>
              {getVideoAriaLabel()}
            </div>

            <video
              ref={cameraVideoRef}
              className={styles.videoFeed}
              autoPlay
              playsInline
              muted
              aria-hidden="true"
              onLoadedMetadata={handleVideoLoadedMetadata}
              onError={handleVideoError}
            />

            {renderOverlayGuides()}
            {renderStatusIndicator()}
          </>
        )}
        {loading && renderLoadingOverlay()}
      </div>
    );
  }, [
    isLoading,
    isCapturing,
    getVideoAriaLabel,
    handleVideoLoadedMetadata,
    handleVideoError,
  ]);

  const renderOverlayGuides = () => (
    <div ref={overlayRef} className={styles.overlayGuides} aria-hidden="true">
      <div className={styles.centerGuide}>
        <div className={styles.guideCorners}>
          {["top-left", "top-right", "bottom-left", "bottom-right"].map(
            (position) => (
              <span
                key={position}
                className={styles.corner}
                data-position={position}
              />
            )
          )}
        </div>
        <div className={styles.guideText}>Position naira note here</div>
      </div>
    </div>
  );

  const renderStatusIndicator = () => (
    <div className={styles.statusIndicator} aria-hidden="true">
      <div
        className={`${styles.statusDot} ${
          isStreamReady ? styles.ready : styles.loading
        }`}
        title={isStreamReady ? "Camera ready" : "Camera loading"}
      />
    </div>
  );

  const renderLoadingOverlay = () => <Loader />;

  const renderCameraControls = () => (
    <div
      className={styles.cameraControls}
      role="toolbar"
      aria-label="Camera controls"
    >
      {renderSecondaryControls()}
      {renderActionButtons()}
      {renderKeyboardInfo()}
    </div>
  );

  const renderSecondaryControls = () => (
    <div className={styles.secondaryControls}>
      {/* <button
        className={`${styles.controlButton} ${styles.flashButton}`}
        onClick={handleFlashToggle}
        aria-label={`${flashEnabled ? "Disable" : "Enable"} flash`}
        aria-pressed={flashEnabled}
        disabled={!isStreamReady}
        type="button"
      >
        {flashEnabled ? (
          <Zap size={20} aria-hidden="true" />
        ) : (
          <ZapOff size={20} aria-hidden="true" />
        )}
        <span className={styles.srOnly}>
          Flash {flashEnabled ? "on" : "off"}
        </span>
      </button> */}

      <button
        className={`${styles.controlButton} ${styles.switchButton}`}
        onClick={handleSwitchCamera}
        aria-label="Switch between front and back camera"
        disabled={!isStreamReady}
        type="button"
      >
        <FlipHorizontal size={20} aria-hidden="true" />
        <span className={styles.buttonLabel}>Switch</span>
      </button>
    </div>
  );

  const renderActionButtons = () => (
    <div
      className={styles.actionButtons}
      role="group"
      aria-label="Main camera actions"
    >
      <button
        ref={captureButtonRef}
        className={`${styles.captureButton} ${
          isCapturing ? styles.capturing : ""
        }`}
        onClick={handleCapture}
        disabled={!isStreamReady || isCapturing || isLoading}
        aria-label={
          isCapturing ? "Capturing image..." : "Capture photo of naira note"
        }
        aria-describedby="capture-instructions"
        type="button"
      >
        <CameraIcon size={24} aria-hidden="true" />
        <span className={styles.buttonText}>
          {isCapturing ? "Capturing..." : "Capture"}
        </span>
      </button>

      <div id="capture-instructions" className={styles.srOnly}>
        Press to capture image of naira note positioned within the guide frame.
        Also activated by spacebar or C key.
      </div>

      <button
        className={styles.uploadButton}
        onClick={handleUploadClick}
        disabled={isLoading || isCapturing}
        aria-label="Upload image file from device"
        aria-describedby="upload-instructions"
        type="button"
      >
        <Upload size={24} aria-hidden="true" />
        <span className={styles.buttonText}>Upload</span>
      </button>

      <div id="upload-instructions" className={styles.srOnly}>
        Select an existing image file from your device. Accepts JPG, PNG and
        other image formats. Also activated by U key.
      </div>
    </div>
  );

  const renderKeyboardInfo = () => (
    <div className={styles.keyboardInfo} aria-labelledby="shortcuts-info">
      <div id="shortcuts-info" className={styles.srOnly}>
        <h3>Keyboard Shortcuts</h3>
        <ul>
          <li>C or Spacebar: Capture photo</li>
          <li>U: Upload file</li>
          <li>F: Toggle flash</li>
          <li>S: Switch camera</li>
          <li>?: Show help</li>
        </ul>
      </div>
    </div>
  );

  const renderScreenReaderInstructions = () => (
    <div className={styles.srOnly}>
      <h2 id="camera-title">Camera Interface</h2>
      <p>
        Use this interface to capture or upload images of Nigerian naira
        banknotes for detection.
      </p>
      <h3>Instructions</h3>
      <ul>
        <li>Position the naira note within the center guide frame</li>
        <li>Ensure good lighting and the entire note is visible</li>
        <li>Press capture button or spacebar to take photo</li>
        <li>
          Alternatively, press U or use upload button to select existing image
        </li>
        {/* <li>Press ? for keyboard shortcuts help</li> */}
      </ul>
    </div>
  );

  const renderHiddenElements = () => (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className={styles.fileInput}
        aria-label="Select image file for naira note detection"
      />

      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className={styles.srOnly}
      />
    </>
  );

  // Main render
  return (
    <div
      className={styles.cameraContainer}
      role="region"
      aria-labelledby="camera-title"
    >
      {renderScreenReaderInstructions()}

      {error ? (
        renderErrorState()
      ) : (
        <>
          {renderVideoContainer()}
          {renderCameraControls()}
        </>
      )}

      {renderHiddenElements()}
    </div>
  );
};

export default Camera;
