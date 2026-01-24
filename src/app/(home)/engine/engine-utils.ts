import { TypingSessionDoc } from "@/lib/types";
import { TextCategory, TextDifficulty, TextMode, UserSettings } from "./types";

// Returns the URL parameters for a typing session.
export function getSessionUrlParams(
  session: TypingSessionDoc | null,
): Record<string, string | null> {
  if (!session) return {};
  return {
    mode: session.mode,
    category: session.category,
    difficulty: session.difficulty,
  };
}

// Returns the test settings from localStorage or the default settings otherwise.
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

type SearchParams = { [key: string]: string | string[] | undefined };

// Returns the test settings from the URL parameters.
export function parseSearchParams(sp: SearchParams) {
  const category =
    typeof sp.category === "string" ? (sp.category as TextCategory) : "general";
  const difficulty =
    typeof sp.difficulty === "string"
      ? (sp.difficulty as TextDifficulty)
      : "easy";
  const mode = typeof sp.mode === "string" ? (sp.mode as TextMode) : "t:60";
  const id = typeof sp.id === "string" ? sp.id : undefined;
  const sessionId = typeof sp.sid === "string" ? sp.sid : undefined;

  return { category, difficulty, mode, id, sessionId };
}
