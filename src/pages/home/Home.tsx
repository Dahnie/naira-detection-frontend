import { useState, useEffect } from "react";
import {
  detectNairaNote,
  createImageUrl,
  revokeImageUrl,
} from "../../utils/detection";
import styles from "./Home.module.css";
import Camera from "../../components/camera/Camera";
import Result from "../../components/result/Result";
import { useSpeech } from "../../hooks/useSpeech";
import type { DetectionResult } from "../../models/Types";
import Settings from "../../components/settings/Settings";
import { Settings as SettingsIcon } from "lucide-react";
import { getPreference } from "../../utils/preferences";
import { cropCurrencyFromImage } from "../../hooks/useCurrencyCropper";

// Types
interface ToastMessage {
  text: string;
  type: "info" | "success" | "error";
}

// App component
const Home: React.FC = () => {
  // State
  const [currentView, setCurrentView] = useState<"camera" | "result">("camera");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [detectionResult, setDetectionResult] =
    useState<DetectionResult | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);

  // Hooks
  const { speak, isSpeaking } = useSpeech({ autoSpeak: true });

  // Cleanup image URL when component unmounts
  useEffect(() => {
    return () => {
      if (resultImageUrl) {
        revokeImageUrl(resultImageUrl);
      }
    };
  }, [resultImageUrl]);

  // Handle toast dismissal
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Show toast message
  const showToast = (
    text: string,
    type: "info" | "success" | "error" = "info"
  ) => {
    setToast({ text, type });
  };

  // Handle image capture from camera
  const handleCapture = async (imageBlob: Blob) => {
    processImage(imageBlob);
  };

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.", "error");
      return;
    }

    processImage(file);
  };

  // Process image for detection
  const processImage = async (imageBlob: Blob) => {
    setIsLoading(true);

    try {
      // Create URL for the original image
      const url = createImageUrl(imageBlob);
      setResultImageUrl(url);

      // Detect naira note
      const result = await detectNairaNote(imageBlob);
      setDetectionResult(result);

      // Switch to result view
      setCurrentView("result");

      // Speak result if auto-speak is enabled
      if (result.denominations && result.denominations.length > 0) {
        const topResult = result.denominations[0];
        const confidencePercent = Math.round(topResult.confidence * 100);
        speak(
          `Detected ${topResult.value} Naira note with ${confidencePercent} percent confidence.`
        );
      } else {
        speak(
          "No Naira note detected. Please try again with better lighting or positioning."
        );
      }
    } catch (error) {
      console.error("Error processing image:", error);
      showToast("Failed to process image. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle speaking result
  const handleSpeakResult = () => {
    if (!detectionResult) return;

    if (
      detectionResult.denominations &&
      detectionResult.denominations.length > 0
    ) {
      const topResult = detectionResult.denominations[0];
      const confidencePercent = Math.round(topResult.confidence * 100);
      speak(
        `Detected ${topResult.value} Naira note with ${confidencePercent} percent confidence.`
      );
    } else {
      speak(
        "No Naira note detected. Please try again with better lighting or positioning."
      );
    }
  };

  useEffect(() => {
    // Speak result when detectionResult changes
    if (currentView === "result") {
      const shouldAutoSpeak = getPreference("autoSpeak");
      if (!shouldAutoSpeak) return;
      handleSpeakResult();
    }
  }, [detectionResult, currentView]);

  // Reset to camera view
  const resetToCamera = () => {
    setCurrentView("camera");

    // Clean up resources
    if (resultImageUrl) {
      revokeImageUrl(resultImageUrl);
      setResultImageUrl(null);
    }

    setDetectionResult(null);
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Naira Note Detector</h1>
        <button
          className={styles.settingsButton}
          onClick={() => setShowSettings(true)}
          aria-label="Settings"
        >
          <SettingsIcon size={24} />
        </button>
      </header>

      <main className={styles.main}>
        {currentView === "camera" ? (
          <Camera onCapture={handleCapture} onFileSelect={handleFileSelect} />
        ) : (
          <Result
            imageUrl={resultImageUrl || ""}
            denomination={
              detectionResult?.denominations?.[0]?.value
                ? `${detectionResult.denominations[0].value} Naira`
                : null
            }
            confidence={detectionResult?.denominations?.[0]?.confidence || 0}
            onBack={resetToCamera}
            onNewScan={resetToCamera}
            onSpeak={handleSpeakResult}
          />
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Loading Indicator */}
      {/* {isLoading && <Loading message="Processing Image..." />} */}

      {/* Toast Notification */}
      {/* {toast && <Toast message={toast.text} type={toast.type} />} */}
    </div>
  );
};

export default Home;
