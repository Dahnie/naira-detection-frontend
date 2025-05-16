import { useRef, useState } from "react";
import { useCamera } from "../../hooks/useCamera";
import styles from "./Camera.module.css";
import { Camera as CameraIcon, Upload, RefreshCw } from "lucide-react";

interface CameraProps {
  onCapture: (image: Blob) => void;
  onFileSelect: (file: File) => void;
}

const Camera: React.FC<CameraProps> = ({ onCapture, onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const {
    videoRef,
    isStreamReady,
    error,
    captureImage,
    switchCamera,
    stopCamera,
  } = useCamera();

  const handleCapture = async () => {
    if (!isStreamReady) return;

    setIsCapturing(true);
    try {
      const imageBlob = await captureImage();
      if (imageBlob) {
        onCapture(imageBlob);
      }
    } catch (err) {
      console.error("Error capturing image:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
      // Reset input value so the same file can be selected again
      e.target.value = "";
    }
  };

  return (
    <div className={styles.cameraContainer}>
      {error ? (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={20} />
            <span>Retry</span>
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className={styles.videoFeed}
            autoPlay
            playsInline
            muted
          />

          <div className={styles.overlayGuides}>
            <div className={styles.centerGuide}></div>
          </div>

          <div className={styles.actionButtons}>
            <button
              className={styles.captureButton}
              onClick={handleCapture}
              disabled={!isStreamReady || isCapturing}
              aria-label="Capture Photo"
            >
              <CameraIcon size={24} />
              <span>Capture</span>
            </button>

            <button
              className={styles.uploadButton}
              onClick={handleUploadClick}
              aria-label="Upload Photo"
            >
              <Upload size={24} />
              <span>Upload</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Camera;
