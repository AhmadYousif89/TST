import Link from "next/link";

import { cn } from "@/lib/utils";
import { getUserHistory } from "@/app/dal/user";
import { formatTime, getModeLabel } from "@/app/(home)/engine/engine-logic";
import { DeleteSessionButton } from "./delete-session.button";

export const HistoryPanel = async () => {
  const history = await getUserHistory();

  if (history.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center space-y-1 py-12">
        <p className="text-4 md:text-3">No history found</p>
        <p className="text-6 text-muted">Complete a test to see it here!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto py-8">
      {history.map((session) => (
        <div
          key={session._id}
          className="group relative flex items-center px-5"
        >
          <Link
            href={`/?sid=${session._id}`}
            className={cn(
              "relative flex w-full items-center justify-between rounded-md border p-4 transition-all duration-200",
              "hover:border-muted-foreground hover:bg-blue-400/5",
              session.isInvalid && "opacity-60",
            )}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-2 font-mono">
                  {Math.round(session.wpm)}
                  <span className="text-6 text-muted-foreground ml-0.5 font-normal uppercase">
                    wpm
                  </span>
                </span>
                {session.isInvalid && (
                  <span className="bg-red/10 text-red text-6 rounded-full px-1.5 py-0.5 font-bold uppercase">
                    Invalid
                  </span>
                )}
              </div>
              <div className="text-6 text-muted-foreground flex items-center gap-2">
                <span>{Math.round(session.accuracy)}% acc</span>
                <span>•</span>
                <span>{formatTime(session.durationMs / 1000)}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-6 rounded-full bg-blue-600/10 px-2 py-0.5 font-medium text-blue-400 capitalize">
                  {session.category}
                </span>
                <span className="text-6 rounded-full bg-blue-600/10 px-2 py-0.5 font-medium whitespace-nowrap text-blue-400">
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

            <div className="absolute top-1/2 -left-4.5 hidden -translate-y-1/2 group-hover:flex">
              <DeleteSessionButton sessionId={session._id} />
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};
