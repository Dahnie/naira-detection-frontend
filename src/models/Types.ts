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

// App preferences stored in localStorage
export interface AppPreferences {
  autoSpeak: boolean;
  speechRate: number;
  speechPitch: number;
}
