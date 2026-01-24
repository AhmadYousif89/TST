"use client";

import { useEffect, useRef } from "react";

import {
  getCharStates,
  getWordStart,
  isWordPerfect,
  calculateNextCursor,
} from "./engine-logic";
import {
  useEngineActions,
  useEngineConfig,
  useEngineKeystroke,
} from "./engine.context";
import { useSound } from "./sound.context";

const RIGHT_SIDE_BUFFER = 40;

type TypingInputProps = {
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  characters: string[];
};

export const TypingInput = ({
  hiddenInputRef,
  containerRef,
  characters,
}: TypingInputProps) => {
  const { status } = useEngineConfig();
  const { cursor, extraOffset, keystrokes } = useEngineKeystroke();
  const { setCursor, startSession, resumeSession, endSession, getTimeElapsed } =
    useEngineActions();
  const { playSound } = useSound();

  const lockedCursorRef = useRef(0);

  // Reset locked cursor when session is reset or cursor is back at start
  useEffect(() => {
    if (status === "idle" || cursor === 0) lockedCursorRef.current = 0;
  }, [status, cursor]);

  const handleBeforeInput = (e: React.InputEvent<HTMLTextAreaElement>) => {
    const data = e.data;
    if (!data || data.length !== 1) return;
    handleTyping(data);
  };

  const handleTyping = (typedChar: string) => {
    if (status === "finished" || cursor >= characters.length) return;
    if (typedChar === " " && cursor === 0) return;

    playSound();

    if (status === "idle") startSession();
    if (status === "paused") resumeSession();

    const expectedChar = characters[cursor];
    const timestampMs = getTimeElapsed();
    const isCorrect = typedChar === expectedChar;

    if (expectedChar === " " && typedChar !== " ") {
      const containerRect = containerRef.current?.getBoundingClientRect();
      const cursorElement =
        containerRef.current?.querySelector<HTMLElement>(".active-cursor");
      const cursorRect = cursorElement?.getBoundingClientRect();
      if (cursorRect && containerRect) {
        if (cursorRect.right > containerRect.right - RIGHT_SIDE_BUFFER) {
          return;
        }
      }
    }

    if (typedChar === " " && isCorrect) {
      const wordStart = getWordStart(cursor, characters);
      const currentStates = getCharStates(characters, keystrokes.current || []);
      const wordIsPerfect = isWordPerfect(wordStart, cursor, currentStates);

      if (wordIsPerfect) {
        lockedCursorRef.current = cursor + 1;
      }
    }

    if (expectedChar === " " && typedChar !== " ") {
      if (extraOffset >= 20) return;

      keystrokes.current?.push({
        charIndex: cursor,
        expectedChar,
        typedChar,
        isCorrect: false,
        timestampMs,
        positionGroup: Math.floor(cursor / 10),
      });
      setCursor(cursor, extraOffset + 1);
      return;
    }

    if (typedChar === " " && expectedChar !== " ") {
      const isWordStart = cursor === getWordStart(cursor, characters);
      const currentStates = getCharStates(characters, keystrokes.current || []);
      const isDirty =
        currentStates[cursor].typedChar !== "" ||
        (currentStates[cursor].extras &&
          currentStates[cursor].extras.length > 0);

      if (isWordStart && !isDirty) return;

      let spaceIndex = cursor;
      while (spaceIndex < characters.length && characters[spaceIndex] !== " ") {
        spaceIndex++;
      }

      const targetIndex = Math.min(characters.length - 1, spaceIndex);
      keystrokes.current?.push({
        charIndex: targetIndex,
        expectedChar: characters[targetIndex],
        typedChar: " ",
        isCorrect: false,
        timestampMs,
        positionGroup: Math.floor(targetIndex / 10),
        skipOrigin: cursor,
      });

      const nextCursor = Math.min(characters.length, spaceIndex + 1);
      setCursor(nextCursor, 0);
      if (nextCursor >= characters.length) endSession();
      return;
    }

    keystrokes.current?.push({
      charIndex: cursor,
      expectedChar,
      typedChar,
      isCorrect,
      timestampMs,
      positionGroup: Math.floor(cursor / 10),
    });

    setCursor((ps: number) => {
      const nextCursor = calculateNextCursor(ps, typedChar, characters);
      if (nextCursor >= characters.length) {
        endSession();
      }
      return nextCursor;
    }, 0);
  };

  const handleKeydown = (e: React.KeyboardEvent) => {
    if (status === "finished") return;

    const typedChar = e.key;
    const isTab = typedChar === "Tab";
    const isModifier = ["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(
      typedChar,
    );

    if (!isTab && !isModifier) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (typedChar === "Backspace") {
      e.preventDefault();
      e.stopPropagation();

      if (status === "paused") resumeSession();
      if (cursor === 0 && extraOffset === 0) return;
      if (cursor <= lockedCursorRef.current && extraOffset === 0) return;

      playSound();

      const isControlModifier = e.ctrlKey || e.metaKey || e.altKey;
      const expectedChar = characters[cursor];
      const timestampMs = getTimeElapsed();

      if (extraOffset > 0) {
        if (isControlModifier) {
          for (let i = 0; i < extraOffset; i++) {
            keystrokes.current?.push({
              charIndex: cursor,
              expectedChar,
              typedChar: "Backspace",
              isCorrect: false,
              timestampMs,
              positionGroup: Math.floor(cursor / 10),
            });
          }
          setCursor(cursor, 0);
        } else {
          keystrokes.current?.push({
            charIndex: cursor,
            expectedChar,
            typedChar: "Backspace",
            isCorrect: false,
            timestampMs,
            positionGroup: Math.floor(cursor / 10),
          });
          setCursor(cursor, extraOffset - 1);
        }
        return;
      }

      let nextCursor = calculateNextCursor(
        cursor,
        "Backspace",
        characters,
        isControlModifier,
        lockedCursorRef.current,
      );

      if (nextCursor < cursor) {
        const currentStates = getCharStates(
          characters,
          keystrokes.current || [],
        );
        if (isControlModifier) {
          for (let i = cursor - 1; i >= nextCursor; i--) {
            const totalExtraOffset = currentStates[i].extras?.length || 0;
            for (let j = 0; j <= totalExtraOffset; j++) {
              keystrokes.current?.push({
                charIndex: i,
                expectedChar: characters[i],
                typedChar: "Backspace",
                isCorrect: false,
                timestampMs,
                positionGroup: Math.floor(i / 10),
              });
            }
          }
          setCursor(nextCursor, 0);
        } else {
          const targetIndex = nextCursor;
          const totalExtraOffset =
            currentStates[targetIndex].extras?.length || 0;
          const lastStroke = keystrokes.current
            ?.slice()
            .reverse()
            .find(
              (k) => k.charIndex === targetIndex && k.typedChar !== "Backspace",
            );

          const finalCursor =
            lastStroke?.skipOrigin !== undefined
              ? lastStroke.skipOrigin
              : targetIndex;

          keystrokes.current?.push({
            charIndex: targetIndex,
            expectedChar: characters[targetIndex],
            typedChar: "Backspace",
            isCorrect: false,
            timestampMs,
            positionGroup: Math.floor(targetIndex / 10),
          });
          setCursor(finalCursor, totalExtraOffset);
        }
      }
      return;
    }

    if (typedChar.length === 1) {
      const isControlModifier = e.ctrlKey || e.metaKey || e.altKey;
      if (isControlModifier && e.repeat) return;
      handleTyping(typedChar);
    }
  };

  return (
    <textarea
      ref={hiddenInputRef}
      onKeyDown={handleKeydown}
      onBeforeInput={handleBeforeInput}
      className="pointer-events-none absolute top-0 left-0 h-14 w-6 resize-none overflow-hidden opacity-0 outline-none"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck="false"
      inputMode="text"
    />
  );
};
