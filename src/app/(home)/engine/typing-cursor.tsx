"use client";

import { useEffect, memo } from "react";

import { Cursor } from "./cursor";
import { useEngineConfig, useEngineKeystroke } from "./engine.context";

const RIGHT_SIDE_BUFFER = 40;

type TypingCursorProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isFocused: boolean;
};

export const TypingCursor = memo(
  ({ containerRef, isFocused }: TypingCursorProps) => {
    const { cursor, extraOffset } = useEngineKeystroke();
    const { status } = useEngineConfig();

    // Dynamically scroll to cursor position when typing
    useEffect(() => {
      if (isFocused && status === "typing") {
        const cursorElement =
          containerRef.current?.querySelector<HTMLElement>(".active-cursor");
        if (cursorElement && containerRef.current) {
          const container = containerRef.current;
          const containerRect = container.getBoundingClientRect();
          const cursorRect = cursorElement.getBoundingClientRect();

          const relativeTop =
            cursorRect.top - containerRect.top + container.scrollTop;
          const targetTop = relativeTop - containerRect.height / 2;

          let targetLeft = container.scrollLeft;
          if (cursorRect.right > containerRect.right - RIGHT_SIDE_BUFFER) {
            targetLeft =
              container.scrollLeft +
              (cursorRect.right - containerRect.right + RIGHT_SIDE_BUFFER);
          }
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
    }, [cursor, isFocused, status, containerRef]);

    // Reset scroll logic
    useEffect(() => {
      if (status === "idle") {
        containerRef.current?.scrollTo({
          top: 0,
          left: 0,
          behavior: "smooth",
        });
      }
    }, [status, containerRef]);

    return (
      <Cursor
        containerRef={containerRef}
        isFocused={isFocused}
        cursor={cursor}
        extraOffset={extraOffset}
      />
    );
  },
);

TypingCursor.displayName = "TypingCursor";
