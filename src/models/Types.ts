// Type definitions for the Naira Note Detector app

// Detection result from API
export interface DetectionResult {
  success: boolean;
  inference_time: number;
  detections: IDetection[];
  detection_count: number;
  annotated_image: string;
  top_detection: {
    denomination: string;
    confidence: number;
  };
  error: null;
}

interface IDetection {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
}

// Denomination of currency
export interface Denomination {
  value: string; // e.g. "1000", "500", "200", etc.
  confidence: number; // 0-1 value representing detection confidence
}

// App preferences stored in localStorage
export interface AppPreferences {
  autoSpeak: boolean;
  speechRate: number;
  speechPitch: number;
}

// Application state
export type AppMode = "camera" | "result";

// Toast notification types
export type ToastType = "info" | "success" | "error";

// Toast notification configuration
export interface ToastConfig {
  message: string;
  type: ToastType;
  visible: boolean;
}

// Settings modal props
export interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: AppPreferences;
  onPreferenceChange: (
    key: keyof AppPreferences,
    value: boolean | number
  ) => void;
  onResetDefaults: () => void;
}

// Camera component props
export interface CameraProps {
  onCapture: (imageBlob: Blob) => void;
  onUpload: (file: File) => void;
  showToast: (message: string, type?: ToastType) => void;
}

// Result component props
export interface ResultProps {
  result: DetectionResult | null;
  onBack: () => void;
  onNewScan: () => void;
  onSpeak: () => void;
  imageUrl: string | null;
}

// Loading indicator props
export interface LoadingProps {
  isLoading: boolean;
  message?: string;
}

// Toast component props
export interface ToastProps {
  config: ToastConfig;
  onClose: () => void;
}
