const isMobileDevice = () => /Mobi|Android/i.test(navigator.userAgent);

// Announce to screen readers
export const announceToScreenReader = (
  liveRegionRef: React.RefObject<HTMLDivElement | null>,
  message: string,
  priority: "polite" | "assertive" = "polite"
) => {
  const adjustedPriority =
    isMobileDevice() && priority === "assertive" ? "polite" : priority;
  if (liveRegionRef.current) {
    // Clear first to ensure the message is read
    liveRegionRef.current.textContent = "";
    setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = message;
        liveRegionRef.current.setAttribute("aria-live", adjustedPriority);
      }
    }, 100);
  }
};

export const triggerVibration = (duration: number | number[] = 100) => {
  if (navigator.vibrate) {
    navigator.vibrate(duration);
  }
};
