"use client";

import { useEffect, useRef, useMemo, memo, useState } from "react";
import { cn } from "@/lib/utils";
import { useEngine } from "@/app/(home)/engine.context";
import { CharState, Keystroke } from "@/lib/types";
import { Button } from "@/components/ui/button";

type CharacterProps = {
  char: string;
  isCursor: boolean;
} & CharState;

const Character = memo(
  ({ char, state, typedChar, isCursor }: CharacterProps) => {
    return (
      <span
        className={cn(
          "text-muted-foreground relative isolate mr-2 whitespace-pre transition-colors duration-100",
          "before:absolute before:inset-0 before:-z-10 before:-mx-0.5 before:rounded before:bg-transparent before:transition-colors",
          isCursor &&
            `text-foreground after:bg-input after:absolute after:inset-0 after:-z-10 after:-mx-0.5 after:animate-pulse after:rounded`,
          state === "correct" && "text-green before:bg-green/15",
          state === "incorrect" && "text-red before:bg-red/15",
        )}
      >
        {char}
        {state === "incorrect" && (
          <span className="animate-mistyped text-red pointer-events-none absolute top-0 left-0 select-none">
            {typedChar}
          </span>
        )}
      </span>
    );
  },
);

Character.displayName = "Character";

export const TypingEngine = () => {
  const {
    cursor,
    status,
    textData,
    progress,
    keystrokes,
    setCursor,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    getTimeElapsed,
  } = useEngine();

  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const characters = useMemo(
    () => textData?.text.split("") || [],
    [textData?.text],
  );

  // Group characters into words (prevents mid-word line breaks)
  const words = useMemo(() => {
    const result: { char: string; index: number }[][] = [];
    let currentWord: { char: string; index: number }[] = [];

    characters.forEach((char, index) => {
      currentWord.push({ char, index });
      if (char === " " || index === characters.length - 1) {
        result.push(currentWord);
        currentWord = [];
      }
    });

    return result;
  }, [characters]);

  const charStates = useMemo(
    () => getCharStates(characters, keystrokes.current),
    [cursor, characters, keystrokes],
  );

  const handleKeydown = (e: React.KeyboardEvent) => {
    // Ignore system shortcuts (command/ctrl keys)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (status === "finished") return;
    if (cursor >= characters.length) return;

    if (e.key === " ") e.preventDefault();

    if (status === "idle") {
      startSession();
    }

    const typedChar = e.key;
    const expectedChar = characters[cursor];
    const timestampMs = getTimeElapsed();

    // Ignore non-character keys except backspace
    if (typedChar.length !== 1 && typedChar !== "Backspace") return;

    // Ignore backspace at the start
    if (typedChar === "Backspace" && cursor === 0) return;

    // Handle backspace
    if (cursor > 0 && typedChar === "Backspace") {
      keystrokes.current?.push({
        charIndex: cursor - 1,
        expectedChar: characters[cursor - 1],
        typedChar: "Backspace",
        isCorrect: false,
        timestampMs,
      });

      setCursor((ps) => (ps > 0 ? ps - 1 : ps));
      return;
    }

    // Handle normal typing
    const isCorrect = typedChar === expectedChar;

    keystrokes.current?.push({
      charIndex: cursor,
      expectedChar,
      typedChar,
      isCorrect,
      timestampMs,
    });

    setCursor((ps) => ps + 1);
    if (cursor + 1 >= characters.length) endSession();
  };

  if (!textData) return null;

  return (
    <div
      tabIndex={0}
      ref={containerRef}
      onFocus={() => {
        setIsFocused(true);
        resumeSession();
      }}
      onBlur={() => {
        setIsFocused(false);
        pauseSession();
      }}
      onKeyDown={handleKeydown}
      className="relative isolate flex grow flex-col gap-4 outline-none"
    >
      {/* Progress Bar */}
      <div className="bg-border h-px w-full overflow-hidden rounded-full">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className={cn(
          "text-2 md:text-1-regular flex flex-wrap gap-y-1 pt-8 leading-relaxed transition-opacity duration-300",
          !isFocused &&
            (status === "idle" || status === "paused") &&
            "opacity-50 blur-xs select-none",
        )}
      >
        {words.map((word, wordIndex) => (
          <div key={wordIndex} className="flex h-fit">
            {word.map(({ char, index }) => (
              <Character
                key={index}
                char={char}
                state={charStates[index].state}
                typedChar={charStates[index].typedChar}
                isCursor={index === cursor && isFocused}
              />
            ))}
          </div>
        ))}
      </div>

      {!isFocused && status === "idle" && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center"
          onClick={() => containerRef.current?.focus()}
        >
          <div className="flex flex-col items-center gap-5">
            <Button
              className="text-3-semibold hover:text-foreground min-h-14 min-w-52 border-0 bg-blue-600 px-6 py-3 hover:bg-blue-400"
              onClick={(e) => {
                e.stopPropagation();
                containerRef.current?.focus();
              }}
            >
              Start Typing Test
            </Button>
            <p className="text-foreground text-3-semibold pointer-events-none">
              Or click the text and start typing
            </p>
          </div>
        </div>
      )}

      {!isFocused && status === "paused" && (
        <div
          className="bg-background/40 absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm"
          onClick={() => containerRef.current?.focus()}
        >
          <div className="flex flex-col items-center gap-3">
            <p className="text-foreground text-1-semibold animate-pulse">
              Test Paused
            </p>
            <p className="text-muted-foreground text-3-medium">
              Click here to resume
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Compute all character states in a single O(K) pass instead of O(N*K)
export const getCharStates = (
  characters: string[],
  keystrokes: Keystroke[],
) => {
  const states: CharState[] = new Array(characters.length)
    .fill(null)
    .map(() => ({
      state: "not-typed",
      typedChar: "",
    }));

  for (const k of keystrokes || []) {
    if (k.typedChar === "Backspace") {
      states[k.charIndex] = { state: "not-typed", typedChar: "" };
    } else {
      states[k.charIndex] = {
        state: k.isCorrect ? "correct" : "incorrect",
        typedChar: k.typedChar,
      };
    }
  }
  return states;
};
