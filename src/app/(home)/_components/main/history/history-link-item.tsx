"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { TypingSessionDoc } from "@/lib/types";
import { DeleteSessionButton } from "../delete-session.button";
import { getModeLabel } from "@/app/(home)/engine/engine-logic";

type Props = {
  session: TypingSessionDoc;
  isBest: boolean;
  href: string;
  isActive: boolean;
  onSelect: () => void;
};

export const HistoryLinkItem = ({
  session,
  isBest,
  href,
  isActive,
  onSelect,
}: Props) => {
  return (
    <div className="group relative flex items-center px-6">
      <Link
        href={href}
        onClick={onSelect}
        className={cn(
          "relative flex w-full items-center justify-between rounded-md border p-4 transition-all duration-200",
          "hover:border-muted dark:hover:border-muted-foreground hover:bg-blue-400/5",
          session.isInvalid && "opacity-60",
          isActive && "border-muted-foreground bg-blue-400/5",
          isBest &&
            !isActive &&
            "dark:border-yellow/75 border-orange dark:hover:border-yellow/75 hover:border-orange shadow-[0_0_15px_rgba(230,156,96,0.5)] dark:shadow-[0_0_15px_rgba(250,204,21,0.5)]",
          isBest &&
            isActive &&
            "dark:border-yellow/75 border-orange shadow-[0_0_15px_rgba(230,156,96,0.5)] dark:shadow-[0_0_15px_rgba(250,204,21,0.5)]",
        )}
      >
        {/* Best session (Crown icon) */}
        {isBest && (
          <div className="text-orange dark:text-yellow absolute -top-4 -right-3 z-10 rotate-12 drop-shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-7"
            >
              <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V18H19V19Z" />
            </svg>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-2 font-mono">
              {Math.round(session.wpm)}
              <span className="text-6 text-muted-foreground ml-0.5 uppercase">
                wpm
              </span>
            </span>
            {session.isInvalid && (
              <span className="bg-red/10 text-red text-6 rounded-full px-1.5 py-0.5 font-bold uppercase">
                Invalid
              </span>
            )}
          </div>
          <div className="text-6 text-muted-foreground flex items-center gap-1 font-mono tracking-widest whitespace-nowrap uppercase">
            <span className="font-bold">{Math.round(session.accuracy)}%</span>
            <span>acc</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 text-right">
          <div className="flex items-center gap-1.5">
            <span className="text-6 rounded-full bg-blue-600/10 px-2 py-0.5 font-medium text-blue-400 capitalize">
              {session.difficulty}
            </span>
            <span className="text-6 min-w-24 rounded-full bg-blue-600/10 px-2 py-0.5 text-center font-medium whitespace-nowrap text-blue-400">
              {getModeLabel(session.mode)}
            </span>
          </div>
          <span className="text-6 text-muted-foreground/60">
            {new Date(session.finishedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="absolute top-1/2 -left-5 hidden -translate-y-1/2 group-hover:block has-data-[deleting=true]:block">
          <DeleteSessionButton
            sessionId={session._id.toString()}
            className="size-4"
          />
        </div>
      </Link>
    </div>
  );
};
