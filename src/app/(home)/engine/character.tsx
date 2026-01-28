import { memo } from "react";
import { cn } from "@/lib/utils";
import { CharState } from "./types";

type CharacterProps = {
  char: string;
  state: CharState["state"];
  isRTL: boolean;
  extras?: string[];
  className?: string;
};

export const Character = memo(
  ({ char, state, isRTL, extras, className }: CharacterProps) => {
    return (
      <>
        {extras?.length ? (
          <div
            className={cn(isRTL ? "inline" : "inline-flex")}
            style={isRTL ? { letterSpacing: 0 } : undefined}
          >
            {extras?.map((extra, i) => (
              <span key={i} className="text-red">
                {extra}
              </span>
            ))}
          </div>
        ) : null}
        <span
          className={cn(
            "relative transition-colors duration-100 ease-linear",
            isRTL ? "inline" : "inline-flex",
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
