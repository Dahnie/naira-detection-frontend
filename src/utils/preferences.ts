import type { AppPreferences } from "../models/Types";

const STORAGE_KEY = "nairaScanPrefs";

// Default preferences
export const DEFAULT_PREFERENCES: AppPreferences = {
  autoSpeak: true,
  speechRate: 1,
  speechPitch: 1,
};

/**
 * Get user preference from localStorage
 * @param key - Preference key
 * @param defaultValue - Default value if not found
 * @returns The preference value
 */
export function getPreference<K extends keyof AppPreferences>(
  key: K,
  defaultValue = DEFAULT_PREFERENCES[key]
): AppPreferences[K] {
  const prefString = localStorage.getItem(STORAGE_KEY);
  if (!prefString) return defaultValue;

  try {
    const prefs = JSON.parse(prefString) as AppPreferences;
    return prefs[key] !== undefined ? prefs[key] : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Save user preference to localStorage
 * @param key - Preference key
 * @param value - Value to save
 */
export function savePreference<K extends keyof AppPreferences>(
  key: K,
  value: AppPreferences[K]
): void {
  const prefString = localStorage.getItem(STORAGE_KEY);
  let prefs: AppPreferences = { ...DEFAULT_PREFERENCES };

  if (prefString) {
    try {
      prefs = {
        ...prefs,
        ...JSON.parse(prefString),
      };
    } catch {
      // Use defaults if parsing fails
    }
  }

  prefs[key] = value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
