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

  const validSessions = history.filter((s) => !s.isInvalid);
  const invalidSessions = history.filter((s) => s.isInvalid);

  // Find the all-time best valid session
  const bestSession =
    validSessions.length > 0
      ? validSessions.reduce(
          (best, s) => (s.wpm > best.wpm ? s : best),
          validSessions[0],
        )
      : null;

  // Sort valid: best first, then by date
  const sortedValid = [...validSessions].sort((a, b) => {
    if (a._id === bestSession?._id) return -1;
    if (b._id === bestSession?._id) return 1;
    return new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime();
  });

  // Build link with session ID and maintain old params
  const buildLink = (session: (typeof history)[0]) => {
    const params = new URLSearchParams();
    params.set("sid", session._id);
    params.set("mode", session.mode);
    params.set("category", session.category);
    params.set("difficulty", session.difficulty);
    return `/?${params.toString()}`;
  };

  const renderSession = (session: (typeof history)[0]) => {
    const isBest = session._id === bestSession?._id;

    return (
      <div key={session._id} className="group relative flex items-center px-5">
        <Link
          href={buildLink(session)}
          className={cn(
            "relative flex w-full items-center justify-between rounded-md border px-2 py-4 transition-all duration-200 sm:p-4",
            "hover:border-muted-foreground hover:bg-blue-400/5",
            session.isInvalid && "opacity-60",
            isBest &&
              "border-yellow/60 shadow-[0_0_15px_rgba(250,204,21,0.15)]",
          )}
        >
          {/* Best session indicator (Crown) */}
          {isBest && (
            <div className="text-yellow absolute -top-4 -right-3 z-10 rotate-12 drop-shadow-sm">
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
            <div className="text-6 text-muted-foreground flex items-center gap-2 whitespace-nowrap">
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

          <div className="absolute top-1/2 -left-4.5 -translate-y-1/2 group-hover:flex md:hidden">
            <DeleteSessionButton sessionId={session._id} />
          </div>
        </Link>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 overflow-y-auto py-8">
      {sortedValid.map(renderSession)}

      {invalidSessions.length > 0 && (
        <>
          <div className="bg-border mx-5 my-4 h-px shrink-0" />
          {invalidSessions.map(renderSession)}
        </>
      )}
    </div>
  );
};
