import { useRef, useState, useEffect, memo, useMemo } from "react";

import { cn } from "@/lib/utils";
import { getCharStates } from "./engine-logic";
import { useEngineKeystroke, useEngineConfig } from "./engine.context";
import { CursorStyle } from "./types";

// Group characters into words (prevents mid-word line breaks)
export const wordsGroup = (characters: string[]) => {
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

export const Words = memo(({ characters, isFocused }: WordsProps) => {
  const { cursor, extraOffset, keystrokes } = useEngineKeystroke();
  const { status, showOverlay } = useEngineConfig();
  const containerRef = useRef<HTMLDivElement>(null);

  const groupedWords = useMemo(() => wordsGroup(characters), [characters]);
  const charStates = useMemo(
    () => getCharStates(characters, keystrokes.current || []),
    [characters, cursor, extraOffset, keystrokes],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-wrap font-mono select-none",
        (status === "idle" || status === "paused") &&
          showOverlay &&
          "opacity-50 blur-xs select-none",
      )}
    >
      <Cursor
        containerRef={containerRef}
        isFocused={isFocused}
        cursor={cursor}
        extraOffset={extraOffset}
      />
      {groupedWords.map((word, wordIndex) => (
        <Word
          key={wordIndex}
          word={word}
          cursor={cursor}
          charStates={charStates}
        />
      ))}
    </div>
  );
});

type WordProps = {
  word: { char: string; index: number }[];
  charStates: any[];
  cursor: number;
  className?: string;
};

const areWordsEqual = (prev: WordProps, next: WordProps) => {
  if (prev.className !== next.className) return false;

  const startIndex = prev.word[0].index;
  const endIndex = prev.word[prev.word.length - 1].index;

  // If the cursor enters or leaves the word, it must re-render
  const wasCursorInWord = prev.cursor >= startIndex && prev.cursor <= endIndex;
  const isCursorInWord = next.cursor >= startIndex && next.cursor <= endIndex;
  if (wasCursorInWord !== isCursorInWord) return false;

  // If the cursor is inside the word and it moved, we need to re-render to update the active-cursor
  if (isCursorInWord && prev.cursor !== next.cursor) return false;

  // wordIsProcessed check (affects error underline)
  const wasProcessed = prev.cursor > endIndex;
  const isProcessed = next.cursor > endIndex;
  if (wasProcessed !== isProcessed) return false;

  // Check if character states changed (only for characters in this word)
  for (let i = 0; i < prev.word.length; i++) {
    const idx = prev.word[i].index;
    const p = prev.charStates[idx];
    const n = next.charStates[idx];

    const charNotEqual =
      p.state !== n.state ||
      p.typedChar !== n.typedChar ||
      p.extras?.length !== n.extras?.length;

    if (charNotEqual) return false;

    // Deep check for extras if they exist
    if (p.extras && n.extras)
      for (let j = 0; j < p.extras.length; j++)
        if (p.extras[j] !== n.extras[j]) return false;
  }

  return true;
};

export const Word = memo(
  ({ word, charStates, cursor, className }: WordProps) => {
    const lastCharObj = word[word.length - 1];
    const isLastCharSpace = lastCharObj.char === " ";
    const endIndex = lastCharObj.index;
    const wordIsProcessed = cursor > endIndex;
    const wordHasError =
      wordIsProcessed &&
      word.some(
        (w) =>
          charStates[w.index].state === "incorrect" ||
          (charStates[w.index].extras?.length ?? 0) > 0,
      );

    return (
      <div
        data-error={wordHasError}
        className={cn(
          "md:text-1-regular text-1-regular-mobile relative flex items-center",
          className,
        )}
      >
        {/* Characters */}
        {word.map(({ char, index }) => {
          const state = charStates[index].state;
          return (
            <Character
              key={`${index}-${char}`}
              char={char}
              state={state}
              extras={charStates[index].extras}
              className={cn(
                index === cursor && "active-cursor text-foreground/80",
              )}
            />
          );
        })}
        {/* Error underline */}
        <div
          style={{ width: isLastCharSpace ? "calc(100% - 1ch)" : "100%" }}
          className={cn(
            "bg-red pointer-events-none absolute bottom-0 left-0 -z-10 h-0.5 origin-left scale-x-0 transform rounded-full transition-transform duration-100 ease-in-out",
            wordHasError && "scale-x-100",
          )}
        />
      </div>
    );
  },
  areWordsEqual,
);

type CharacterProps = {
  char: string;
  state: "not-typed" | "correct" | "incorrect";
  extras?: string[];
  className?: string;
};

export const Character = memo(
  ({ char, state, extras, className }: CharacterProps) => {
    return (
      <>
        {extras?.length ? (
          <div className="flex">
            {extras?.map((extra, i) => (
              <span key={i} className="text-red">
                {extra}
              </span>
            ))}
          </div>
        ) : null}
        <span
          className={cn(
            "relative flex transition-colors duration-100 ease-linear",
            state === "correct" && "text-green",
            state === "incorrect" && "text-red",
            state === "not-typed" && "text-muted-foreground",
            className,
          )}
        >
          {char === " " ? "\u00a0" : char}
        </span>
      </>
    );
  },
);

Character.displayName = "Character";

type CursorProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isFocused: boolean;
  cursor: number;
  extraOffset: number;
  cursorStyle?: CursorStyle;
};

type CursorPosition = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export const Cursor = memo(
  ({
    containerRef,
    isFocused,
    cursor,
    extraOffset,
    cursorStyle: cursorStyleProp,
  }: CursorProps) => {
    const { cursorStyle: configCursorStyle } = useEngineConfig();
    const cursorStyle = cursorStyleProp || configCursorStyle;
    const [position, setPosition] = useState<CursorPosition>({
      top: 0,
      left: 0,
      width: 0,
      height: 0,
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
    }, [containerRef, cursor, extraOffset]);

    return (
      <div
        className={cn(
          "pointer-events-none absolute z-10 rounded bg-blue-400 transition-all duration-100 ease-linear",
          isFocused && cursor === 0 && "animate-blink",
          !isFocused && "bg-blue-400/50",
          cursorStyle === "box" &&
            "border border-blue-400 bg-transparent opacity-50",
        )}
        style={{
          top: position.top || 0,
          left: position.left || 0,
          width:
            cursorStyle === "box" || cursorStyle === "underline"
              ? position.width || 0
              : 3,
          height:
            cursorStyle === "box"
              ? position.height || 0
              : cursorStyle === "underline"
                ? 2
                : (position.height || 0) * 0.8,
          transform:
            cursorStyle === "box"
              ? "none"
              : cursorStyle === "underline"
                ? `translateY(${(position.height || 0) - 2}px)`
                : `translateY(${(position.height || 0) * 0.125}px)`,
        }}
      />
    );
  },
);
