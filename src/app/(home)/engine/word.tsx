import { memo } from "react";
import { cn } from "@/lib/utils";
import { CharState } from "./types";
import { Character } from "./character";

type WordProps = {
  isRTL: boolean;
  wordIndex: number;
  word: { char: string; index: number }[];
  charStates: CharState[];
  cursor: number;
  className?: string;
  isReplay?: boolean;
};

export const Word = memo(
  ({
    isRTL,
    wordIndex,
    word,
    charStates,
    cursor,
    className,
    isReplay,
  }: WordProps) => {
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
        data-word-index={wordIndex}
        className={cn(
          "text-1-regular-mobile md:text-1-regular relative",
          isRTL ? "inline-block tracking-normal" : "flex items-center",
          className,
        )}
      >
        {/* Characters */}
        {word.map(({ char, index }) => {
          return (
            <Character
              key={`${index}-${char}`}
              isRTL={isRTL}
              char={char}
              state={charStates[index].state}
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
            "bg-red pointer-events-none absolute -z-10 h-0.5 scale-x-0 transform rounded-full transition-transform duration-100 ease-in-out",
            isRTL
              ? "right-0 -bottom-0.5 origin-right"
              : "bottom-0.5 left-0 origin-left",
            isReplay && "bottom-0",
            wordHasError && "scale-x-100",
          )}
        />
      </div>
    );
  },
  areWordsEqual,
);

function areWordsEqual(prev: WordProps, next: WordProps) {
  if (
    prev.wordIndex !== next.wordIndex ||
    prev.className !== next.className ||
    prev.isReplay !== next.isReplay ||
    prev.word !== next.word
  )
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
