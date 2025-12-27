import { EngineState, EngineAction } from "./types";

export const initialState: EngineState = {
  status: "idle",
  timeLeft: 0,
  wpm: 0,
  cursor: 0,
  progress: 0,
  accuracy: 100,
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
      };
    case "START":
      return {
        ...state,
        status: "typing",
      };
    case "PAUSE":
      return {
        ...state,
        status: "paused",
      };
    case "RESUME":
      return {
        ...state,
        status: "typing",
      };
    case "END":
      return {
        ...state,
        status: "finished",
      };
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
      };
    }
    case "SET_STATUS":
      return {
        ...state,
        status: action.status,
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
      };
    }
    case "UPDATE_METRICS":
      return {
        ...state,
        wpm: action.wpm,
        accuracy: action.accuracy,
      };
    default:
      return state;
  }
}
