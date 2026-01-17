import { EngineState, EngineAction } from "./types";

export const initialState: EngineState = {
  status: "idle",
  wpm: 0,
  cursor: 0,
  timeLeft: 0,
  progress: 0,
  accuracy: 100,
  extraOffset: 0,
  showOverlay: true,
  volume: 0.5,
  isMuted: false,
  soundName: "creamy",
  cursorStyle: "pip",
};

export function engineReducer(
  state: EngineState,
  action: EngineAction,
): EngineState {
  switch (action.type) {
    case "RESET":
      return {
        ...initialState,
        timeLeft: action.timeLeft,
        showOverlay: action.showOverlay ?? initialState.showOverlay,
        volume: state.volume,
        isMuted: state.isMuted,
        soundName: state.soundName,
        cursorStyle: state.cursorStyle,
      };
    case "START":
      return {
        ...state,
        status: "typing",
        showOverlay: false,
        extraOffset: 0,
      };
    case "PAUSE":
      return {
        ...state,
        status: "paused",
        showOverlay: true,
      };
    case "RESUME":
      return {
        ...state,
        status: "typing",
        showOverlay: false,
        extraOffset: 0,
      };
    case "END":
      return {
        ...state,
        status: "finished",
      };
    case "TICK": {
      const isTimed = action.mode !== "passage";
      const nextTime = isTimed
        ? Math.max(0, state.timeLeft - 1)
        : state.timeLeft + 1;
      const status = isTimed && nextTime === 0 ? "finished" : state.status;
      return {
        ...state,
        timeLeft: nextTime,
        status,
        wpm: action.wpm ?? state.wpm,
        accuracy: action.accuracy ?? state.accuracy,
      };
    }
    case "SET_CURSOR": {
      const nextCursor =
        typeof action.cursor === "function"
          ? action.cursor(state.cursor)
          : action.cursor;
      const progress = action.charCount
        ? Math.min((nextCursor / action.charCount) * 100, 100)
        : state.progress;
      return {
        ...state,
        cursor: nextCursor,
        progress,
        extraOffset: action.extraOffset ?? state.extraOffset,
      };
    }
    case "SET_STATUS":
      return {
        ...state,
        status: action.status,
      };
    case "SET_METRICS":
      return {
        ...state,
        wpm: action.wpm,
        accuracy: action.accuracy,
      };
    case "SET_OVERLAY":
      return {
        ...state,
        showOverlay: action.show,
      };
    case "SET_SOUND": {
      const newState = {
        ...state,
        soundName: action.soundName,
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "typing_settings",
            JSON.stringify({
              soundName: newState.soundName,
              volume: newState.volume,
              isMuted: newState.isMuted,
              cursorStyle: newState.cursorStyle,
            }),
          );
        } catch (error) {
          console.warn("Failed to save settings:", error);
        }
      }
      return newState;
    }
    case "SET_VOLUME": {
      const newState = {
        ...state,
        volume: action.volume,
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "typing_settings",
            JSON.stringify({
              soundName: newState.soundName,
              volume: newState.volume,
              isMuted: newState.isMuted,
              cursorStyle: newState.cursorStyle,
            }),
          );
        } catch (error) {
          console.warn("Failed to save settings:", error);
        }
      }
      return newState;
    }
    case "SET_MUTED": {
      const newState = {
        ...state,
        isMuted: action.isMuted,
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "typing_settings",
            JSON.stringify({
              soundName: newState.soundName,
              volume: newState.volume,
              isMuted: newState.isMuted,
              cursorStyle: newState.cursorStyle,
            }),
          );
        } catch (error) {
          console.warn("Failed to save settings:", error);
        }
      }
      return newState;
    }
    case "SET_CURSOR_STYLE": {
      const newState = {
        ...state,
        cursorStyle: action.style,
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "typing_settings",
            JSON.stringify({
              soundName: newState.soundName,
              volume: newState.volume,
              isMuted: newState.isMuted,
              cursorStyle: newState.cursorStyle,
            }),
          );
        } catch (error) {
          console.warn("Failed to save settings:", error);
        }
      }
      return newState;
    }

    default:
      return state;
  }
}
