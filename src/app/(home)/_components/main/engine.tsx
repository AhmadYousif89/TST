"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export type Keystroke = {
  charIndex: number;
  expectedChar: string;
  typedChar: string;
  isCorrect: boolean;
  timestampMs: number;
};

const TEXT = `The archaeological expedition unearthed artifacts that complicated prevailing theories about Bronze Age trade networks. Obsidian from Anatolia, lapis lazuli from Afghanistan, and amber from the Baltic—all discovered in a single Mycenaean tomb—suggested commercial connections far more extensive than previously hypothesized. "We've underestimated ancient peoples' navigational capabilities and their appetite for luxury goods," the lead researcher observed. "Globalization isn't as modern as we assume."`;

export const getCharState = (
  keystrokes: Keystroke[],
  index: number,
  cursor: number,
) => {
  //  Future characters
  if (index > cursor) return "not-typed";

  // Find the last backspace that moved the cursor to or before this index
  const lastInvalidationIndex = keystrokes.findLastIndex(
    (k) => k.typedChar === "Backspace" && k.charIndex === index,
  );

  // Get valid keystrokes AFTER that backspace
  const relevantKeys = (
    lastInvalidationIndex === -1
      ? keystrokes
      : keystrokes.slice(lastInvalidationIndex + 1)
  ).filter((k) => k.charIndex === index && k.typedChar !== "Backspace");

  //  No relevant keystrokes, not typed
  if (!relevantKeys.length) return "not-typed";

  const lastKey = relevantKeys[relevantKeys.length - 1];
  return lastKey.isCorrect ? "correct" : "incorrect";
};

export const TypingEngine = () => {
  const textRef = useRef(TEXT.split(""));
  const [cursor, setCursor] = useState(0);
  const [, forceRender] = useState(0);
  const keystrokes = useRef<Keystroke[]>([]);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (cursor >= textRef.current.length) return;

      if (!startedAtRef.current) {
        startedAtRef.current = Date.now();
      }

      const typedChar = event.key;
      const expectedChar = textRef.current[cursor];
      const timestampMs = Date.now() - startedAtRef.current;

      //  Ignore non-character keys
      if (typedChar.length !== 1 && typedChar !== "Backspace") return;
      //  Ignore backspace at the start
      if (typedChar === "Backspace" && cursor === 0) return;
      //  Handle backspace
      if (cursor > 0 && typedChar === "Backspace") {
        keystrokes.current.push({
          charIndex: Math.max(cursor - 1, 0), //  Set cursor to previous char
          expectedChar,
          typedChar: "Backspace",
          isCorrect: false, //  Backspace is considered as a user action
          timestampMs,
        });
        setCursor((ps) => (ps > 0 ? ps - 1 : ps));
        return;
      }

      const isCorrect = typedChar === expectedChar;

      keystrokes.current.push({
        charIndex: cursor,
        expectedChar,
        typedChar,
        isCorrect,
        timestampMs,
      });

      if (isCorrect) {
        setCursor((ps) => ps + 1);
      }
      //  Needed to trigger a re-render for highlighting mismatched characters
      forceRender((ps) => ps + 1);
    };

    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [cursor]);

  console.log("keystrokes buffer: ", keystrokes.current);
  console.log("Cursor: ", cursor);

  return (
    <section className="grow">
      <p className="text-1-regular-mobile md:text-1-regular text-muted-foreground space-x-0.5">
        {textRef.current.map((char, index) => {
          const charState = getCharState(keystrokes.current, index, cursor);

          return (
            <span
              key={index}
              className={cn(
                index === cursor &&
                  `after:bg-input text-foreground/75 relative isolate after:absolute after:inset-0 after:-z-10 after:-mx-0.5 after:animate-pulse after:rounded`,
                // charState === "not-typed" && "text-muted-foreground",
                charState === "correct" && "text-green",
                charState === "incorrect" && index === cursor && "text-red",
              )}
            >
              {char}
            </span>
          );
        })}
      </p>
    </section>
  );
};
