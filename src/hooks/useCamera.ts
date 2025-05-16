import { useState, useEffect, useRef } from "react";

interface UseCameraOptions {
  facingMode?: "environment" | "user";
  width?: number;
  height?: number;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  mediaStream: MediaStream | null;
  isStreamReady: boolean;
  error: string | null;
  captureImage: () => Promise<Blob | null>;
  switchCamera: () => void;
  stopCamera: () => void;
}

/**
 * Custom hook for camera functionality
 */
export function useCamera({
  facingMode = "environment",
  width = 1280,
  height = 720,
}: UseCameraOptions = {}): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState<
    "environment" | "user"
  >(facingMode);

  // Initialize camera stream
  useEffect(() => {
    let mounted = true;

    async function initCamera() {
      try {
        // Stop any existing streams first
        if (mediaStream) {
          stopCamera();
        }

        setError(null);

        // Request camera permissions
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: currentFacingMode,
            width: { ideal: width },
            height: { ideal: height },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (!mounted) {
          // Clean up if component unmounted during async operation
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        setMediaStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            if (mounted && videoRef.current) {
              videoRef.current
                .play()
                .then(() => setIsStreamReady(true))
                .catch((err) =>
                  setError(`Failed to play video: ${err.message}`)
                );
            }
          };
        }
      } catch (err) {
        if (mounted) {
          console.error("Error accessing camera:", err);
          setError(
            `Camera access error: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      }
    }

    initCamera();

    // Clean up on unmount
    return () => {
      mounted = false;
      stopCamera();
    };
  }, [currentFacingMode]);

  /**
   * Capture current frame from video stream
   */
  const captureImage = async (): Promise<Blob | null> => {
    if (!videoRef.current || !isStreamReady) {
      return null;
    }

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
      });
    } catch (err) {
      console.error("Error capturing image:", err);
      return null;
    }
  };

  /**
   * Switch between front and back cameras
   */
  const switchCamera = () => {
    setCurrentFacingMode((prev) =>
      prev === "environment" ? "user" : "environment"
    );
  };

  /**
   * Stop all camera streams
   */
  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
      setIsStreamReady(false);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  return {
    videoRef,
    mediaStream,
    isStreamReady,
    error,
    captureImage,
    switchCamera,
    stopCamera,
  };
}
