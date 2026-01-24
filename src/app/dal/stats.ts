import connectToDB from "@/lib/db";
import { RecordOfAnonUserSessions, TypingSessionDoc } from "@/lib/types";

export async function aggregateUserSessions(): Promise<RecordOfAnonUserSessions> {
  const { db } = await connectToDB();

  const pipeline = [
    {
      $match: {
        isInvalid: { $ne: true },
      },
    },
    {
      $group: {
        _id: "$anonUserId",
        trys: { $sum: 1 },
        bestWPM: { $max: "$wpm" },
        bestAccuracy: { $max: "$accuracy" },
        sids: { $push: { $toString: "$_id" } },
      },
    },
  ];

  const results = await db
    .collection<TypingSessionDoc>("typing_sessions")
    .aggregate(pipeline)
    .sort({ trys: -1 })
    .toArray();

  const record: RecordOfAnonUserSessions = {};

  results.forEach((item) => {
    if (item._id && typeof item._id === "string") {
      record[item._id] = {
        trys: item.trys,
        bestWPM: item.bestWPM,
        bestAccuracy: item.bestAccuracy,
        sids: item.sids,
      };
    }
  });

  return record;
}
