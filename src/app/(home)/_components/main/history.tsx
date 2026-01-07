import { getUserHistory } from "@/app/dal/user";
import { HistoryList } from "./history/history-list";

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

  return (
    <HistoryList
      sortedValid={sortedValid}
      invalidSessions={invalidSessions}
      bestSessionId={bestSession?._id.toString() ?? null}
    />
  );
};
