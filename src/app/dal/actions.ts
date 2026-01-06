"use server";

import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import connectToDB from "@/lib/db";
import { AnonUserDoc, TypingSessionDoc, KeystrokeDoc } from "@/lib/types";

export async function deleteSessionAction(sessionId: string) {
  const cookieStore = await cookies();
  const anonUserId = cookieStore.get("anonUserId")?.value;

  if (!anonUserId) return { error: "Unauthorized" };

  const { db, client } = await connectToDB();
  const dbSession = client.startSession();

  try {
    await dbSession.withTransaction(async () => {
      const session = await db
        .collection<TypingSessionDoc>("typing_sessions")
        .findOne({ _id: new ObjectId(sessionId) }, { session: dbSession });

      if (!session) throw new Error("Session not found");
      if (session.anonUserId !== anonUserId) throw new Error("Forbidden");

      // Delete keystrokes
      await db
        .collection<KeystrokeDoc>("keystrokes")
        .deleteMany(
          { sessionId: new ObjectId(sessionId) },
          { session: dbSession },
        );

      // Delete the session
      await db
        .collection<TypingSessionDoc>("typing_sessions")
        .deleteOne({ _id: new ObjectId(sessionId) }, { session: dbSession });

      if (!session.isInvalid) {
        // Decrement total sessions
        await db
          .collection<AnonUserDoc>("anonymous_users")
          .updateOne(
            { anonUserId },
            { $inc: { totalSessions: -1 } },
            { session: dbSession },
          );

        // Recalculate best scores
        const bestStats = await db
          .collection<TypingSessionDoc>("typing_sessions")
          .aggregate(
            [
              { $match: { anonUserId, isInvalid: { $ne: true } } },
              {
                $group: {
                  _id: null,
                  bestWpm: { $max: "$wpm" },
                  bestAccuracy: { $max: "$accuracy" },
                },
              },
            ],
            { session: dbSession },
          )
          .toArray();

        const newBestWpm = bestStats[0]?.bestWpm || 0;
        const newBestAccuracy = bestStats[0]?.bestAccuracy || 0;

        await db.collection<AnonUserDoc>("anonymous_users").updateOne(
          { anonUserId },
          {
            $set: {
              bestWpm: newBestWpm,
              bestAccuracy: newBestAccuracy,
            },
          },
          { session: dbSession },
        );
      }
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete session:", error);
    return { error: "Failed to delete session" };
  } finally {
    await dbSession.endSession();
  }
}
