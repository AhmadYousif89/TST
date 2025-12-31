"use client";

import { useEffect, useRef, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  useEngineActions,
  useEngineKeystroke,
  useEngineState,
} from "./engine.context";
import {
  calculateNextCursor,
  getCharStates,
  getWordStart,
  isWordPerfect,
} from "./engine-logic";
import { Words } from "./words";

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
  const { status, textData, showOverlay } = useEngineState();

  const lockedCursorRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [maxHeight, setMaxHeight] = useState<number | string>("none");

  const characters = useMemo(
    () => textData?.text.split("") || [],
    [textData?.text],
  );

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

  // Calculate dynamic max-height of the engine container
  useEffect(() => {
    const calculateHeight = () => {
      if (!containerRef.current) return;

      // Use visualViewport for mobile stability if available
      const viewportHeight =
        window.visualViewport?.height || window.innerHeight;
      const rect = containerRef.current.getBoundingClientRect();
      const topOffset = rect.top;
      // Calculate height of all elements (around the engine container) marked as offsets
      const offsets = document.querySelectorAll("[data-engine-offset]");
      let totalOffsetHeight = 0;
      offsets.forEach((el) => {
        totalOffsetHeight += el.getBoundingClientRect().height;
      });
      // Approximate accumulation of total gaps/spaces around the engine container
      const safetyBuffer = 120;
      const containerMinHeight = 150;
      const availableHeight =
        viewportHeight - topOffset - totalOffsetHeight - safetyBuffer;

      setMaxHeight(Math.max(availableHeight, containerMinHeight));
    };
    // Calculate height on initial render
    calculateHeight();

    const currentContainer = containerRef.current;
    const observer = new ResizeObserver(calculateHeight);
    if (currentContainer?.parentElement) {
      observer.observe(currentContainer.parentElement);
    }
    window.addEventListener("resize", calculateHeight);

    return () => {
      window.removeEventListener("resize", calculateHeight);
      observer.disconnect();
    };
  }, [status]);

  // Reset locked cursor when session is reset or cursor is back at start
  useEffect(() => {
    if (status === "idle" || cursor === 0) {
      lockedCursorRef.current = 0;
    }
  }, [status, cursor]);

  // Reset pause timer when session is reset
  const pauseTimerRef = useRef<NodeJS.Timeout>(undefined);
  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  const handleKeydown = (e: React.KeyboardEvent) => {
    if (status === "finished") return;
    const typedChar = e.key;

    // Ignore non-character keys except backspace
    if (typedChar.length !== 1 && typedChar !== "Backspace") return;
    // Ignore backspace at the start of text
    if (typedChar === "Backspace" && cursor === 0 && extraOffset === 0) return;
    // Ignore backspace at the locked cursor prevent attempts to correct previous words
    if (
      typedChar === "Backspace" &&
      cursor <= lockedCursorRef.current &&
      extraOffset === 0
    )
      return;

    // Ignore standalone meta keys and shift key (allow only if typing or Backspace)
    const isControlModifier = e.ctrlKey || e.metaKey || e.altKey;
    const isBackspace = typedChar === "Backspace";
    const isShiftKey = typedChar === "Shift";
    // If it's a modifier alone or Shift key, ignore
    if ((isControlModifier && !isBackspace) || isShiftKey) return;
    // Ignore non-character keys except backspace
    if (typedChar.length !== 1 && !isBackspace) return;
    // Ignore F1~F12 keys
    if (/^F([1-9]|1[0-2])$/.test(typedChar)) return;

    if (status === "idle") startSession();
    if (status === "paused") resumeSession();

    e.preventDefault();
    e.stopPropagation();

    const expectedChar = characters[cursor];
    const timestampMs = getTimeElapsed();

    // Handle backspace
    if (isBackspace) {
      // Handle backspace with extra characters
      if (extraOffset > 0) {
        if (isControlModifier) {
          // Record backspaces for all extras and set offset to 0 [CTRL + BACKSPACE]
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
          // Record backspace for the single extra and decrement [BACKSPACE]
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

      // Normal backspace logic
      let nextCursor = calculateNextCursor(
        cursor,
        "Backspace",
        characters,
        isControlModifier,
        lockedCursorRef.current,
      );

      if (nextCursor < cursor) {
        const currentStates = getCharStates(characters, keystrokes.current);
        if (isControlModifier) {
          // Fully clear every skipped index, including its extras [CTRL + BACKSPACE]
          for (let i = cursor - 1; i >= nextCursor; i--) {
            const totalExtraOffset = currentStates[i].extras?.length || 0;
            // One backspace for each extra + one for the main char itself
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
          // Standard backspace moves cursor back and "un-types" the character at that index.
          // This clears the main character (space or letter) but leaves existing extras visible, exactly where the cursor will now land.
          keystrokes.current?.push({
            charIndex: targetIndex,
            expectedChar: characters[targetIndex],
            typedChar: "Backspace",
            isCorrect: false,
            timestampMs,
            positionGroup: Math.floor(targetIndex / 10),
          });
          setCursor(targetIndex, totalExtraOffset);
        }
      }
      return;
    }

    // Handle normal typing
    const isCorrect = typedChar === expectedChar;

    // Prevent typing extra characters if the word is about to wrap to the next line
    // Only blocks extra characters when typing at the edge of the container
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
      // Limit to 20 extra characters
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

    keystrokes.current?.push({
      charIndex: cursor,
      expectedChar,
      typedChar,
      isCorrect,
      timestampMs,
      positionGroup: Math.floor(cursor / 10),
    });

    // Set cursor to the next character
    setCursor((ps: number) => {
      const nextCursor = calculateNextCursor(ps, typedChar, characters);
      if (nextCursor >= characters.length) {
        endSession();
      }
      return nextCursor;
    }, 0); // Reset extraOffset on forward movement
  };

  if (!textData) return null;

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
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = undefined;
    }
  };

  const handleResumeSession = () => {
    console.log("resume");
    resumeSession();
    containerRef.current?.focus();
  };

  const maxHeightValue = typeof maxHeight === "number" ? maxHeight : 0;

  return (
    <div className="relative isolate flex grow flex-col">
      {/* Progress Bar */}
      <div className="bg-border h-px w-full overflow-hidden rounded-full">
        <div
          className="h-full bg-blue-600 transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Engine Container */}
      <div
        tabIndex={0}
        ref={containerRef}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeydown}
        style={{ maxHeight: `${maxHeightValue}px` }}
        className={cn(
          "mt-8 flex grow flex-col",
          "scrollbar-none overflow-auto overscroll-none scroll-smooth outline-none",
          "transition-[opacity,filter] duration-300 ease-out",
          // (status === "idle" || status === "paused") &&
          //   showOverlay &&
          //   "opacity-50 blur-xs select-none",
        )}
      >
        <Words characters={characters} isFocused={isFocused} />
      </div>

      {/* Start backdrop overlay */}
      {status === "idle" && showOverlay && (
        <div
          onClick={() => containerRef.current?.focus()}
          className="bg-background/5 absolute inset-0 z-20 flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-5">
            <Button
              onClick={() => containerRef.current?.focus()}
              className="text-3-semibold hover:text-foreground min-h-14 min-w-52 border-0 bg-blue-600 px-6 py-3 hover:bg-blue-400"
            >
              Start Typing Test
            </Button>
            <p className="text-foreground text-3-semibold pointer-events-none">
              Or click the text and start typing
            </p>
          </div>
        </div>
      )}

      {/* Pause backdrop overlay */}
      {status === "paused" && showOverlay && (
        <div
          onClick={handleResumeSession}
          className="bg-background/5 absolute inset-0 z-20 flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-3">
            <p className="text-yellow text-5 animate-pulse">Test Paused</p>
            <p className="text-muted-foreground text-4 flex items-center gap-1 font-medium tracking-wide">
              <svg
                width="20px"
                height="20px"
                fill="currentColor"
                viewBox="0 -960 960 960"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M537-96 399-391 240-192v-672l528 432H486l138 295-87 41Z" />
              </svg>
              <span>Click to resume</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
