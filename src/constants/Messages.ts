export const HOME_MESSAGES = {
  WELCOME_CAMERA:
    "Naira Note Detector loaded. Use camera to capture or upload an image of a naira note for detection. Settings button available in top right corner.",
  WELCOME_RESULT:
    "Detection results displayed. Use back button to return to camera.",
  CAPTURE_PROCESSING: "Image captured, processing for naira note detection...",
  FILE_PROCESSING: "Image selected, processing for naira note detection...",
  PROCESSING_WAIT: "Processing image. Please wait...",
  DETECTION_FAILED: "Detection failed. Please try again.",
  INVALID_FILE: "Invalid file type. Please select an image file.",
  PROCESSING_ERROR:
    "Failed to process image. Please try again with a different image or check your internet connection.",
  NO_RESULT: "No detection result available.",
  SETTINGS_OPENED: "Settings opened",
  SETTINGS_CLOSED: "Settings closed",
  RETURNED_TO_CAMERA:
    "Returned to camera view. Ready to capture or select new image.",
  NO_NAIRA_DETECTED:
    "No Naira note detected in this image. Please ensure you have a clear image of a Nigerian Naira banknote with good lighting.",
  LOW_CONFIDENCE_TIP:
    "Low confidence detected. Try capturing with better lighting, steadier hands, or ensure the entire note is visible.",
  HIGH_CONFIDENCE: "High confidence detection.",
} as const;

export const HOME_KEYBOARD_INSTRUCTIONS = {
  CAMERA:
    "Camera view: Press spacebar to capture photo, or press F to select file. Press Ctrl+S for settings, or press question mark for help.",
  RESULT:
    "Results view: Press R to repeat result, press B to go back to camera, press Ctrl+S for settings.",
};
