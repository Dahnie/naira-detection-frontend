import { useState, useEffect, useRef } from "react";

interface UseCameraOptions {
  facingMode?: "environment" | "user";
  width?: number;
  height?: number;
  quality?: number;
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

export function useCamera({
  facingMode = "environment",
  width = 1920, // Increased from 1280
  height = 1080, // Increased from 720
  quality = 0.95,
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
        if (mediaStream) {
          stopCamera();
        }

        setError(null);

        // Enhanced constraints for better quality
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: currentFacingMode,
            width: {
              min: 1280,
              ideal: width,
              max: 4096,
            },
            height: {
              min: 720,
              ideal: height,
              max: 2160,
            },
            // Additional quality constraints
            aspectRatio: { ideal: 16 / 9 },
            frameRate: { ideal: 30, max: 60 },
          },
          audio: false,
        };

        // Try to get the highest quality stream available
        let stream: MediaStream;

        try {
          // First attempt with high quality settings
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (highQualityError) {
          console.warn(
            "High quality stream failed, trying fallback:",
            highQualityError
          );

          // Fallback with more flexible constraints
          const fallbackConstraints: MediaStreamConstraints = {
            video: {
              facingMode: currentFacingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          };

          stream = await navigator.mediaDevices.getUserMedia(
            fallbackConstraints
          );
        }

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        // Log actual stream capabilities
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities();
          const settings = videoTrack.getSettings();
          console.log("Camera capabilities:", capabilities);
          console.log("Current settings:", settings);

          // Apply optimal settings if supported
          const constraints: MediaTrackConstraints = {};

          if (capabilities.width && capabilities.height) {
            constraints.width = Math.min(
              width,
              capabilities.width.max || width
            );
            constraints.height = Math.min(
              height,
              capabilities.height.max || height
            );
          }

          if (capabilities.frameRate) {
            constraints.frameRate = Math.min(
              30,
              capabilities.frameRate.max || 30
            );
          }

          // Apply the enhanced constraints
          try {
            await videoTrack.applyConstraints(constraints);
            console.log("Enhanced constraints applied successfully");
          } catch (constraintError) {
            console.warn(
              "Could not apply enhanced constraints:",
              constraintError
            );
          }
        }

        setMediaStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.onloadedmetadata = () => {
            if (mounted && videoRef.current) {
              // Log actual video dimensions
              console.log(
                `Video dimensions: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`
              );

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

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [currentFacingMode, width, height]);

  /**
   * Enhanced image capture with better quality
   */
  const captureImage = async (): Promise<Blob | null> => {
    if (!videoRef.current || !isStreamReady) {
      return null;
    }

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");

      // Use actual video dimensions for maximum quality
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      const ctx = canvas.getContext("2d", {
        alpha: false, // Better performance for photos
        willReadFrequently: false,
        desynchronized: true,
      });

      if (!ctx) return null;

      // Enhanced drawing with better quality settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw the current frame
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

      // Convert to blob with higher quality
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
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
