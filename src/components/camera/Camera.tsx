import { useRef, useState, useEffect } from "react";
import { useCamera } from "@hooks/useCamera";
import styles from "./Camera.module.css";
import {
  Camera as CameraIcon,
  Upload,
  RefreshCw,
  FlipHorizontal,
  Zap,
  ZapOff,
} from "lucide-react";
import {
  announceToScreenReader,
  triggerVibration,
} from "@utils/accessibiltyHelper";
import { toastHandler } from "@utils/toastHandlerSingleton";
import { useSpeech } from "@hooks/useSpeech";

interface CameraProps {
  onCapture: (image: Blob) => void;
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

const Camera: React.FC<CameraProps> = ({
  onCapture,
  onFileSelect,
  isLoading,
}) => {
  const { speak: speakChange } = useSpeech();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureButtonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [isCapturing, setIsCapturing] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const {
    videoRef: cameraVideoRef,
    isStreamReady,
    error,
    captureImage,
    switchCamera,
    // stopCamera,
  } = useCamera();

  // Merge refs for video element
  useEffect(() => {
    if (cameraVideoRef.current && videoRef.current) {
      videoRef.current = cameraVideoRef.current;
    }
  }, [cameraVideoRef]);

  // Handle first user interaction for audio announcements
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        announceToScreenReader(
          liveRegionRef,
          "Camera interface ready. Position naira note within the frame guide and press capture button or spacebar to take photo.",
          "polite"
        );
      }
    };

    document.addEventListener("click", handleFirstInteraction, { once: true });
    document.addEventListener("keydown", handleFirstInteraction, {
      once: true,
    });
    document.addEventListener("touchstart", handleFirstInteraction, {
      once: true,
    });

    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [hasUserInteracted]);

  // Camera status announcements
  useEffect(() => {
    if (error) {
      const errorMessage = error.includes("permission")
        ? "Camera permission denied. Please allow camera access or use the upload option to select an image file."
        : `Camera error: ${error}. Please try refreshing the page or use the upload option.`;

      setPermissionDenied(error.includes("permission"));
      announceToScreenReader(liveRegionRef, errorMessage, "assertive");
      speakChange(errorMessage);
    } else if (isStreamReady) {
      const message =
        "Camera is ready. You can now capture images of naira notes.";
      announceToScreenReader(liveRegionRef, message, "polite");
      speakChange(message);
    }
  }, [error, isStreamReady]);

  // Keyboard navigation
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
        case " ":
        case "Enter":
          if (
            event.target === captureButtonRef.current ||
            !document.activeElement ||
            document.activeElement === document.body
          ) {
            event.preventDefault();
            handleCapture();
          }
          break;
        case "u":
        case "U":
          event.preventDefault();
          handleUploadClick();
          break;
        case "f":
        case "F":
          event.preventDefault();
          handleFlashToggle();
          break;
        case "s":
        case "S":
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            handleSwitchCamera();
          }
          break;
        case "c":
        case "C":
          event.preventDefault();
          handleCapture();
          break;
        case "?":
          event.preventDefault();
          announceHelpInstructions();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isStreamReady, isCapturing]);

  const announceHelpInstructions = () => {
    const instructions = `
      Camera controls: 
      Press C or Spacebar to capture photo.
      Press U to upload image file.
      Press F to toggle flash.
      Press S to switch camera.
      Press question mark for help.
      Position naira note within the center guide for best results.
    `;
    announceToScreenReader(liveRegionRef, instructions.trim(), "assertive");
  };

  const handleCapture = async () => {
    if (!isStreamReady || isCapturing || isLoading) {
      if (!isStreamReady) {
        announceToScreenReader(
          liveRegionRef,
          "Camera not ready. Please wait for camera to initialize or use upload option.",
          "assertive"
        );
      }
      return;
    }

    setIsCapturing(true);
    announceToScreenReader(liveRegionRef, "Capturing image...", "assertive");
    triggerVibration(100); // Capture feedback

    try {
      // Flash effect for visual feedback
      if (overlayRef.current) {
        overlayRef.current.classList.add(styles.flashEffect);
        setTimeout(() => {
          overlayRef.current?.classList.remove(styles.flashEffect);
        }, 200);
      }

      const imageBlob = await captureImage();
      if (imageBlob) {
        announceToScreenReader(
          liveRegionRef,
          "Image captured successfully. Processing for detection...",
          "assertive"
        );
        onCapture(imageBlob);
        triggerVibration([50, 50, 50]); // Success pattern
      } else {
        throw new Error("Failed to capture image");
      }
    } catch (err) {
      console.error("Error capturing image:", err);
      const errorMsg =
        "Failed to capture image. Please try again or use the upload option.";
      announceToScreenReader(liveRegionRef, errorMsg, "assertive");
      triggerVibration(200); // Error vibration
    } finally {
      setIsCapturing(false);
    }
  };

  const handleUploadClick = () => {
    if (isLoading) {
      announceToScreenReader(
        liveRegionRef,
        "Please wait, processing current image.",
        "polite"
      );
      return;
    }

    announceToScreenReader(
      liveRegionRef,
      "Opening file picker to select image...",
      "polite"
    );
    triggerVibration(50);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      // File validation
      if (!file.type.startsWith("image/")) {
        const errorMsg =
          "Invalid file type. Please select an image file (JPG, PNG, etc.).";
        announceToScreenReader(liveRegionRef, errorMsg, "assertive");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        const errorMsg =
          "File too large. Please select an image smaller than 10MB.";
        announceToScreenReader(liveRegionRef, errorMsg, "assertive");
        return;
      }

      announceToScreenReader(
        liveRegionRef,
        `Selected ${file.name}. Processing for naira note detection...`,
        "assertive"
      );

      onFileSelect(file);
      triggerVibration(50);

      // Reset input value so the same file can be selected again
      e.target.value = "";
    }
  };

  const handleFlashToggle = () => {
    if (!isStreamReady) {
      announceToScreenReader(
        liveRegionRef,
        "Flash not available - camera not ready.",
        "polite"
      );
      return;
    }

    setFlashEnabled(!flashEnabled);
    const flashStatus = flashEnabled ? "disabled" : "enabled";
    const message = `Flash ${flashStatus}.`;
    announceToScreenReader(liveRegionRef, message, "polite");
    speakChange(message);
    triggerVibration(30);
  };

  const handleSwitchCamera = () => {
    if (!isStreamReady) {
      announceToScreenReader(
        liveRegionRef,
        "Cannot switch camera - camera not ready.",
        "polite"
      );
      return;
    }

    try {
      switchCamera();
      const message = "Switching camera...";
      announceToScreenReader(liveRegionRef, message, "polite");
      speakChange(message);
      triggerVibration(50);
    } catch (err) {
      announceToScreenReader(
        liveRegionRef,
        "Failed to switch camera",
        "assertive"
      );
    }
  };

  const handleRetry = () => {
    announceToScreenReader(
      liveRegionRef,
      "Reloading page to retry camera access...",
      "assertive"
    );
    triggerVibration(100);
    window.location.reload();
  };

  const getVideoAriaLabel = () => {
    if (!isStreamReady) return "Camera initializing...";
    if (error) return "Camera unavailable";
    return "Live camera feed showing naira note detection area. Position note within center guide.";
  };

  return (
    <div
      className={styles.cameraContainer}
      role="region"
      aria-labelledby="camera-title"
    >
      {/* Screen reader instructions */}
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
          <li>Press ? for keyboard shortcuts help</li>
        </ul>
      </div>

      {error ? (
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
      ) : (
        <>
          {/* Camera feed section */}
          <div
            className={styles.videoContainer}
            role="img"
            aria-labelledby="video-description"
          >
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
              onLoadedMetadata={() => {
                announceToScreenReader(
                  liveRegionRef,
                  "Camera feed loaded successfully",
                  "polite"
                );
              }}
              onError={() => {
                toastHandler.error(
                  "Video feed error occurred. Please check camera permissions or try reloading the page."
                );
                announceToScreenReader(
                  liveRegionRef,
                  "Video feed error occurred",
                  "assertive"
                );
              }}
            />

            {/* Overlay guides and effects */}
            <div
              ref={overlayRef}
              className={styles.overlayGuides}
              aria-hidden="true"
            >
              <div className={styles.centerGuide}>
                <div className={styles.guideCorners}>
                  <span
                    className={styles.corner}
                    data-position="top-left"
                  ></span>
                  <span
                    className={styles.corner}
                    data-position="top-right"
                  ></span>
                  <span
                    className={styles.corner}
                    data-position="bottom-left"
                  ></span>
                  <span
                    className={styles.corner}
                    data-position="bottom-right"
                  ></span>
                </div>
                <div className={styles.guideText}>Position naira note here</div>
              </div>
            </div>

            {/* Camera status indicator */}
            <div className={styles.statusIndicator} aria-hidden="true">
              {isStreamReady ? (
                <div
                  className={`${styles.statusDot} ${styles.ready}`}
                  title="Camera ready"
                ></div>
              ) : (
                <div
                  className={`${styles.statusDot} ${styles.loading}`}
                  title="Camera loading"
                ></div>
              )}
            </div>

            {/* Loading overlay */}
            {(isLoading || isCapturing) && (
              <div
                className={styles.loadingOverlay}
                role="status"
                aria-live="assertive"
                aria-label={
                  isCapturing ? "Capturing image..." : "Processing image..."
                }
              >
                <div className={styles.loadingSpinner} aria-hidden="true"></div>
                <p>{isCapturing ? "Capturing..." : "Processing..."}</p>
              </div>
            )}
          </div>

          {/* Camera controls */}
          <div
            className={styles.cameraControls}
            role="toolbar"
            aria-label="Camera controls"
          >
            {/* Secondary controls */}
            <div className={styles.secondaryControls}>
              <button
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
              </button>

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

            {/* Main action buttons */}
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
                  isCapturing
                    ? "Capturing image..."
                    : "Capture photo of naira note"
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
                Press to capture image of naira note positioned within the guide
                frame. Also activated by spacebar or C key.
              </div>

              <button
                className={styles.uploadButton}
                onClick={handleUploadClick}
                disabled={isLoading}
                aria-label="Upload image file from device"
                aria-describedby="upload-instructions"
                type="button"
              >
                <Upload size={24} aria-hidden="true" />
                <span className={styles.buttonText}>Upload</span>
              </button>

              <div id="upload-instructions" className={styles.srOnly}>
                Select an existing image file from your device. Accepts JPG, PNG
                and other image formats. Also activated by U key.
              </div>
            </div>

            {/* Keyboard shortcuts info */}
            <div
              className={styles.keyboardInfo}
              aria-labelledby="shortcuts-info"
            >
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
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className={styles.fileInput}
            aria-label="Select image file for naira note detection"
          />

          {/* Live region for announcements */}
          <div
            ref={liveRegionRef}
            aria-live="polite"
            aria-atomic="true"
            className={styles.srOnly}
          ></div>
        </>
      )}
    </div>
  );
};

export default Camera;
