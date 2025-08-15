import { apiBaseUrl } from "@api/config";
import { handleAPIError } from "./handleAPIError";

export interface DetectionResult {
  denominations: {
    value: string;
    confidence: number;
  }[];
  processedImage: Blob;
}

/**
 * Process image and detect naira notes
 * @param imageBlob - Image blob to process
 * @returns Promise with detection results
 */

export async function detectNairaNote(imageBlob: Blob) {
  // ): Promise<DetectionResult> {
  try {
    // Create form data for API request
    const formData = new FormData();
    formData.append("file", imageBlob);

    // Call detection API
    const response = await fetch(`${apiBaseUrl}/api/detection/detect/image`, {
      method: "POST",
      body: formData,
    });
    console.log({ response });
    if (!response.ok) {
      handleAPIError(response);
      throw new Error(`Server returned ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Detection API error:", error);
    handleAPIError(error);

    // For development/testing, return mock data when API fails
    // This allows the UI to be developed without a working backend
    // return createMockDetectionResult(imageBlob);
  }
}

/**
 * Create mock detection result for development/testing
 * @param originalImage - Original image blob
 * @returns Mock detection result
 */
export function createMockDetectionResult(
  originalImage: Blob
): DetectionResult {
  // Generate random confidence between 0.6 and 0.98
  const confidence = 0.6 + Math.random() * 0.38;

  // Randomly choose a denomination
  const denominations = ["1000", "500", "200", "100", "50", "20", "10", "5"];
  const randomIndex = Math.floor(Math.random() * denominations.length);

  return {
    denominations: [
      {
        value: denominations[randomIndex],
        confidence,
      },
    ],
    processedImage: originalImage,
  };
}

/**
 * Create object URL from blob
 * @param blob - Image blob
 * @returns Object URL
 */
export function createImageUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Clean up object URL to prevent memory leaks
 * @param url - Object URL to revoke
 */
export function revokeImageUrl(url: string | null): void {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
