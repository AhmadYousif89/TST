"use client";

import { useEffect, useRef, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import {
  calculateNextCursor,
  getCharStates,
  getWordStart,
  isWordPerfect,
} from "./engine-logic";
import {
  useEngineActions,
  useEngineConfig,
  useEngineKeystroke,
} from "./engine.context";
import { useSound } from "./sound.context";

import { Words } from "./words";
import { Button } from "@/components/ui/button";
import { ArrowIcon } from "@/components/arrow.icon";
import { TimeWarning } from "../_components/main/timer-warning";

const RIGHT_SIDE_BUFFER = 40;

export const EngineContainer = () => {
  const {
    setCursor,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    getTimeElapsed,
    setShowOverlay,
  } = useEngineActions();
  const { cursor, extraOffset, progress, keystrokes } = useEngineKeystroke();
  const { status, textData, showOverlay } = useEngineConfig();
  const { playSound } = useSound();

  const lockedCursorRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const characters = useMemo(
    () => textData?.text.split("") || [],
    [textData?.text],
  );

  /* ------------- Effects ------------- */

  // Scroll engine container to cursor position if text is overflowing the container height
  useEffect(() => {
    if (isFocused && status === "typing") {
      const cursorElement =
        containerRef.current?.querySelector<HTMLElement>(".active-cursor");
      if (cursorElement && containerRef.current) {
        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const cursorRect = cursorElement.getBoundingClientRect();

        // Calculate the top position relative to the container and center it
        const relativeTop =
          cursorRect.top - containerRect.top + container.scrollTop;
        const targetTop = relativeTop - containerRect.height / 2;

        // Calculate the left position relative to the container and center it
        let targetLeft = container.scrollLeft;
        if (cursorRect.right > containerRect.right - RIGHT_SIDE_BUFFER) {
          targetLeft =
            container.scrollLeft +
            (cursorRect.right - containerRect.right + RIGHT_SIDE_BUFFER);
        }
        // If cursor moves back towards the left (new line), reset scroll
        if (cursorRect.left < containerRect.left + RIGHT_SIDE_BUFFER) {
          targetLeft = 0;
        }

        container.scrollTo({
          top: targetTop,
          left: targetLeft,
          behavior: "smooth",
        });
      }
    }
  }, [cursor, isFocused, status]);

  // Reset scroll when session is reset
  useEffect(() => {
    if (status === "idle") {
      containerRef.current?.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }
  }, [status]);

  // Reset locked cursor when session is reset or cursor is back at start
  useEffect(() => {
    if (status === "idle" || cursor === 0) lockedCursorRef.current = 0;
  }, [status, cursor]);

  // Auto-focus input when overlay is hidden in idle state (e.g. after a restart)
  useEffect(() => {
    if (status === "idle" && !showOverlay) {
      hiddenInputRef.current?.focus();
    }
  }, [status, showOverlay]);

  // Reset pause timer when session is reset
  const pauseTimerRef = useRef<NodeJS.Timeout>(undefined);
  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  /* ------------- Handlers ------------- */

  const handleBeforeInput = (e: React.InputEvent<HTMLTextAreaElement>) => {
    // onBeforeInput provides the actual character on mobile virtual keyboards
    const data = e.data;
    if (!data || data.length !== 1) return;
    handleTyping(data);
  };

  const handleTyping = (typedChar: string) => {
    if (status === "finished") return;
    // Ignore space at the start
    if (typedChar === " " && cursor === 0) return;

    playSound();

    if (status === "idle") startSession();
    if (status === "paused") resumeSession();

    const expectedChar = characters[cursor];
    const timestampMs = getTimeElapsed();

    const isCorrect = typedChar === expectedChar;

    // Prevent typing extra characters if the word is about to wrap to the next line
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

    // Logic to prevent correction over correct words
    if (typedChar === " " && isCorrect) {
      const wordStart = getWordStart(cursor, characters);
      const currentStates = getCharStates(characters, keystrokes.current);
      const wordIsPerfect = isWordPerfect(wordStart, cursor, currentStates);

      if (wordIsPerfect) {
        lockedCursorRef.current = cursor + 1;
      }
    }

    // If we are at a space but typed a letter, it's an extra char
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

    // Skip Word Logic: if user hits space mid-word, jump to the start of the next word
    if (typedChar === " " && expectedChar !== " ") {
      // Prevent skipping if we are at the beginning of a word
      // This prevents multiple teleportations back to back
      const isWordStart = cursor === getWordStart(cursor, characters);
      const currentStates = getCharStates(characters, keystrokes.current || []);
      const isDirty =
        currentStates[cursor].typedChar !== "" ||
        (currentStates[cursor].extras &&
          currentStates[cursor].extras.length > 0);

      if (isWordStart && !isDirty) return;

      let spaceIndex = cursor;
      while (spaceIndex < characters.length && characters[spaceIndex] !== " ") {
        spaceIndex++; // advance to the start of the next word
      }

      const targetIndex = Math.min(characters.length - 1, spaceIndex);
      keystrokes.current?.push({
        charIndex: targetIndex,
        expectedChar: characters[targetIndex],
        typedChar: " ",
        isCorrect: false,
        timestampMs,
        positionGroup: Math.floor(targetIndex / 10),
        skipOrigin: cursor, // Record where we jumped from
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
    // Allow tab key and modifiers to behave naturally for navigation and shortcuts
    const isTab = typedChar === "Tab";
    const isModifier = ["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(
      typedChar,
    );

    if (!isTab && !isModifier) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Handle Backspace
    if (typedChar === "Backspace") {
      e.preventDefault();
      e.stopPropagation();

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

      // Normal backspace logic
      if (nextCursor < cursor) {
        const currentStates = getCharStates(characters, keystrokes.current);
        // [CTRL + BACKSPACE]
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
          // Record backspace for the single extra and decrement [BACKSPACE]
          const targetIndex = nextCursor;
          const totalExtraOffset =
            currentStates[targetIndex].extras?.length || 0;

          // If this was a skip, jump back to where the skip originated
          // We look for the last keystroke at this index that wasn't a backspace
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
      // Ignore special shortcuts that shouldn't trigger typing
      const isControlModifier = e.ctrlKey || e.metaKey || e.altKey;
      if (isControlModifier && e.repeat) return;

      handleTyping(typedChar);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (status === "typing") {
      pauseTimerRef.current = setTimeout(() => {
        pauseSession();
      }, 1000);
    } else {
      setShowOverlay(true);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowOverlay(false);
    hiddenInputRef.current?.focus();
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = undefined;
    }
  };

  const handleResumeSession = () => {
    resumeSession();
    hiddenInputRef.current?.focus();
  };

  if (!textData) return null;

  return (
    <div className="relative isolate grid grow grid-rows-[auto_1fr_auto] place-items-center">
      <TimeWarning />
      {/* Progress Bar */}
      <div className="bg-border h-px w-full overflow-hidden rounded-full">
        <div
          className="h-full bg-blue-600 transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        ref={containerRef}
        className={cn(
          "h-43.25 md:h-54.5",
          "scrollbar-none overflow-hidden overscroll-none scroll-smooth outline-none",
          "transition-[opacity,filter] duration-300 ease-in-out",
          (status === "idle" || status === "paused") &&
            showOverlay &&
            "opacity-50 blur-xs select-none",
        )}
      >
        <textarea
          ref={hiddenInputRef}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeydown}
          onBeforeInput={(e) => handleBeforeInput(e)}
          className="pointer-events-none absolute top-0 left-0 h-14 w-6 resize-none overflow-hidden opacity-0 outline-none"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          inputMode="text"
        />
        <Words characters={characters} isFocused={isFocused} />
      </div>

      {/* Start backdrop overlay */}
      {status === "idle" && showOverlay && (
        <div
          onClick={() => hiddenInputRef.current?.focus()}
          className="bg-background/5 absolute z-20 flex h-43.25 w-full items-center justify-center md:h-54.5"
        >
          <div className="flex flex-col items-center gap-5">
            <Button
              onClick={() => hiddenInputRef.current?.focus()}
              className="hover:text-foreground min-h-14 min-w-52 border-0 bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-400"
            >
              Start Typing Test
            </Button>
            <p className="text-foreground pointer-events-none font-semibold">
              Or click the text and start typing
            </p>
          </div>
        </div>
      )}

      {/* Pause backdrop overlay */}
      {status === "paused" && showOverlay && (
        <div
          onClick={handleResumeSession}
          className="bg-background/5 absolute z-20 flex h-43.25 w-full items-center justify-center md:h-54.5"
        >
          <div className="flex flex-col items-center gap-3">
            <p className="text-orange dark:text-yellow text-2 animate-pulse font-medium">
              Test Paused
            </p>
            <p className="text-foreground text-5 flex items-center gap-1 font-medium tracking-wide">
              <ArrowIcon />
              <span>Click here to resume</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
