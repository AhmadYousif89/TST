import { useRef, useState, useEffect, memo, useMemo } from "react";

import { cn } from "@/lib/utils";
import { getCharStates } from "./engine-logic";
import { useEngineKeystroke } from "./engine.context";

// Group characters into words (prevents mid-word line breaks)
const words = (characters: string[]) => {
  const result: { char: string; index: number }[][] = [];
  let currentWord: { char: string; index: number }[] = [];

  characters.forEach((char: string, index: number) => {
    currentWord.push({ char, index });
    if (char === " " || index === characters.length - 1) {
      result.push(currentWord);
      currentWord = [];
    }
  });

  return result;
};

type WordsProps = {
  characters: string[];
  isFocused: boolean;
};

export const Words = ({ characters, isFocused }: WordsProps) => {
  const { cursor, keystrokes } = useEngineKeystroke();
  const containerRef = useRef<HTMLDivElement>(null);

  const charStates = useMemo(
    () => getCharStates(characters, keystrokes.current),
    [characters, cursor],
  );

  const groupedWords = useMemo(() => words(characters), [characters]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-wrap items-center justify-start font-mono select-none"
    >
      <Cursor
        containerRef={containerRef}
        isFocused={isFocused}
        cursor={cursor}
      />
      {groupedWords.map((word, wordIndex) => {
        const endIndex = word[word.length - 1].index;
        const isWordCompleted = cursor > endIndex;
        const isWordError =
          isWordCompleted &&
          word.some((w) => charStates[w.index].state === "incorrect");

        return (
          <div
            key={wordIndex}
            className={cn(
              "text-1-regular-mobile md:text-1-regular relative mr-4 mb-4 border-b border-transparent",
              isWordError && "border-red",
            )}
          >
            {word.map(({ char, index }) => {
              const state = charStates[index].state;
              const typedChar = charStates[index].typedChar;
              return (
                <Character
                  key={`${index}-${char}`}
                  char={char}
                  state={state}
                  typedChar={typedChar}
                  className={
                    index === cursor ? "text-foreground active-cursor" : ""
                  }
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

type CharacterProps = {
  char: string;
  state: "not-typed" | "correct" | "incorrect";
  typedChar: string;
  className?: string;
};

const Character = memo(
  ({ char, state, typedChar, className }: CharacterProps) => {
    const isSpace = char === " ";
    const renderedChar =
      isSpace && state !== "incorrect"
        ? "_"
        : isSpace && state === "incorrect"
          ? typedChar
          : char;

    return (
      <span
        className={cn(
          "transition-colors",
          isSpace &&
            state !== "incorrect" &&
            "pointer-events-none absolute top-0 left-full opacity-0",
          state === "correct" && "text-green",
          state === "incorrect" && "text-red",
          isSpace && state === "incorrect" && "text-red",
          state === "not-typed" && "text-muted-foreground",
          className,
        )}
      >
        {renderedChar}
      </span>
    );
  },
);

Character.displayName = "Character";

type CursorProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isFocused: boolean;
  cursor: number;
};

type CursorPosition = {
  top: number;
  left: number;
  height: number;
  width: number;
};

const Cursor = ({ containerRef, isFocused, cursor }: CursorProps) => {
  const [position, setPosition] = useState<CursorPosition>({
    top: 0,
    left: 0,
    height: 0,
    width: 0,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const cursorEl = containerRef.current.querySelector(
      ".active-cursor",
    ) as HTMLElement;

    if (cursorEl) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const cursorRect = cursorEl.getBoundingClientRect();

      setPosition({
        top: cursorRect.top - containerRect.top,
        left: cursorRect.left - containerRect.left,
        width: cursorRect.width,
        height: cursorRect.height,
      });
    }
  }, [containerRef, cursor]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute z-10 rounded bg-blue-400 transition-all duration-200 ease-out",
        isFocused && cursor === 0 && "animate-blink",
        !isFocused && "bg-blue-400/50",
      )}
      style={{
        top: position.top,
        left: position.left,
        width: 3,
        height: position.height * 0.8,
        transform: `translateY(${position.height * 0.125}px)`,
      }}
    />
  );
};
