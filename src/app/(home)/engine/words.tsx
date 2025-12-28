import { memo, useMemo } from "react";

import { CharState } from "./types";
import { cn } from "@/lib/utils";
import { getCharStates } from "./engine-logic";
import { useEngineKeystroke, useEngineState } from "./engine.context";

type WordsProps = {
  characters: string[];
  isFocused: boolean;
};

export const Words = ({ characters, isFocused }: WordsProps) => {
  const { keystrokes } = useEngineState();
  const { cursor } = useEngineKeystroke();

  console.log({ cursor, keystrokes }); // Run on every TICK!!
  // Group characters into words (prevents mid-word line breaks)
  const words = useMemo(() => {
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
  }, [characters]);

  const charStates = useMemo(
    () => getCharStates(characters, keystrokes.current),
    [cursor, characters, keystrokes],
  );

  return (
    <>
      {words.map((word, wordIndex) => (
        <div key={wordIndex}>
          {word.map(({ char, index }) => (
            <Character
              key={index}
              char={char}
              state={charStates[index].state}
              typedChar={charStates[index].typedChar}
              isCursor={index === cursor && isFocused}
              className={cn(index === cursor && "active-cursor")}
            />
          ))}
        </div>
      ))}
    </>
  );
};

type CharacterProps = {
  char: string;
  isCursor: boolean;
  className?: string;
} & CharState;

const Character = memo(
  ({ char, state, typedChar, isCursor, className }: CharacterProps) => {
    console.log({ isCursor, char, typedChar, state }); // Only rendered when user actually types
    return (
      <span
        className={cn(
          className,
          "text-muted-foreground relative isolate ml-2 whitespace-pre transition-colors duration-100 ease-out",
          "before:absolute before:inset-0 before:-z-10 before:-mx-0.5 before:rounded before:bg-transparent before:transition-colors",
          isCursor &&
            `text-foreground after:bg-input after:absolute after:inset-0 after:-z-10 after:-mx-0.5 after:animate-pulse after:rounded`,
          state === "correct" && "text-green before:bg-green/15",
          state === "incorrect" && "text-red before:bg-red/15",
        )}
      >
        {char}
        {state === "incorrect" && (
          <span className="animate-mistyped text-yellow pointer-events-none absolute select-none">
            {typedChar === " " ? "_" : typedChar}
          </span>
        )}
      </span>
    );
  },
);

Character.displayName = "Character";
