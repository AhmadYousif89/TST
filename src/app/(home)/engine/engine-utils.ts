import { UserSettings } from "./types";

export const getInitialSettings = (): UserSettings => {
  const defaultSettings: UserSettings = {
    soundName: "creamy",
    volume: 0.5,
    isMuted: false,
    cursorStyle: "pip",
  };

  if (typeof window === "undefined") return defaultSettings;

  try {
    const stored = localStorage.getItem("typing_settings");
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        soundName: parsed.soundName || defaultSettings.soundName,
        volume:
          typeof parsed.volume === "number"
            ? parsed.volume
            : defaultSettings.volume,
        isMuted:
          typeof parsed.isMuted === "boolean"
            ? parsed.isMuted
            : defaultSettings.isMuted,
        cursorStyle: parsed.cursorStyle || defaultSettings.cursorStyle,
      };
    }
  } catch (error) {
    console.warn("Failed to load settings from localStorage:", error);
  }

  return defaultSettings;
};
