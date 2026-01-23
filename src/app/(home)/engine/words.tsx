import { useRef, memo, useMemo } from "react";

import { cn } from "@/lib/utils";
import { getCharStates } from "./engine-logic";
import { useEngineKeystroke, useEngineConfig } from "./engine.context";
import { CharState } from "./types";

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
};

export const Words = memo(({ characters }: WordsProps) => {
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
        "relative flex flex-wrap pl-2 font-mono select-none",
        "transition-[opacity,filter] duration-300 ease-in-out",
        showOverlay && "opacity-50 blur-xs select-none",
      )}
    >
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
  charStates: CharState[];
  cursor: number;
  className?: string;
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

function areWordsEqual(prev: WordProps, next: WordProps) {
  if (prev.className !== next.className || prev.word !== next.word)
    return false;

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
}

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
