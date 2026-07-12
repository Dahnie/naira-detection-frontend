import { apiBaseUrl } from "@api/config";
import { handleAPIError } from "./handleAPIError";
import type { DetectionResult } from "@models/Types";

/**
 * Process an image and detect naira notes.
 * @param imageBlob - Image blob to process
 * @returns Detection result, or null if the request failed
 */
export async function detectNairaNote(
  imageBlob: Blob
): Promise<DetectionResult | null> {
  try {
    const formData = new FormData();
    formData.append("file", imageBlob);

    const response = await fetch(`${apiBaseUrl}/api/detection/detect/image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      handleAPIError(response);
      return null;
    }

    return (await response.json()) as DetectionResult;
  } catch (error) {
    console.error("Detection API error:", error);
    handleAPIError(error);
    return null;
  }
}

/**
 * Create an object URL from a blob.
 * @param blob - Image blob
 * @returns Object URL
 */
export function createImageUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Clean up an object URL to prevent memory leaks.
 * @param url - Object URL to revoke
 */
export function revokeImageUrl(url: string | null): void {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
