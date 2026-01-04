import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { ObjectId } from "mongodb";
import connectToDB from "@/lib/db";
import {
  TextDoc,
  AnonUserDoc,
  KeystrokeDoc,
  TypingSessionDoc,
} from "@/lib/types";
import { Keystroke } from "@/app/(home)/engine/types";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const anonUserId = cookieStore.get("anonUserId")?.value;

  if (!anonUserId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { keystrokes, ...data } = body;

  /* --------- SPAM & VALIDATION CHECKS ------------ */

  const MIN_WL = 5; // Minimum word length
  const MIN_WPM = 10;
  const MIN_ACCURACY = 20;
  const MIN_DURATION_MS = 2000;

  // Server-side recalculation to prevent client-side manipulation
  const ks = keystrokes || [];
  const totalTyped = ks.filter(
    (k: Keystroke) => k.typedChar !== "Backspace",
  ).length;
  const correctKeys = ks.filter((k: Keystroke) => k.isCorrect).length;
  const durationMin = data.durationMs / 60000;

  const serverWpm =
    durationMin > 0 ? Math.round(correctKeys / MIN_WL / durationMin) : 0;
  const serverAccuracy =
    totalTyped > 0 ? Math.round((correctKeys / totalTyped) * 100) : 100;

  // Integrity Check: Compare client metrics with server-calculated ones
  // Allow a small margin of error (e.g., 2 units) for rounding differences
  const isManipulated =
    Math.abs(serverWpm - data.wpm) > 2 ||
    Math.abs(serverAccuracy - data.accuracy) > 2;

  const isSpam =
    data.wpm < MIN_WPM ||
    data.accuracy < MIN_ACCURACY ||
    data.durationMs < MIN_DURATION_MS ||
    ks.length < MIN_WL ||
    isManipulated;

  /* ----------------------------------------------- */

  const { db, client } = await connectToDB();
  const dbSession = client.startSession();

  try {
    let insertedId: ObjectId | string = "";

    await dbSession.withTransaction(async () => {
      const sessionData = {
        anonUserId,
        ...data,
        isInvalid: isSpam,
        startedAt: new Date(data.startedAt),
        finishedAt: new Date(data.finishedAt),
      } as TypingSessionDoc;

      // Insert typing session
      const sessionRes = await db
        .collection<TypingSessionDoc>("typing_sessions")
        .insertOne(sessionData, { session: dbSession });

      insertedId = sessionRes.insertedId;

      if (isSpam) return; // Skip stats update for invalid sessions
      // Update anonymous user stats
      await db.collection<AnonUserDoc>("anonymous_users").updateOne(
        { anonUserId },
        {
          $inc: { totalSessions: 1 },
          $max: {
            bestWpm: data.wpm,
            bestAccuracy: data.accuracy,
          },
          $set: { updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true, session: dbSession },
      );
      // Insert keystrokes
      if (keystrokes?.length) {
        const keystrokesDocs = keystrokes.map((k: Keystroke) => ({
          ...k,
          textId: data.textId,
          sessionId: insertedId,
          anonUserId,
          createdAt: new Date(),
        }));
        await db
          .collection<KeystrokeDoc>("keystrokes")
          .insertMany(keystrokesDocs, { session: dbSession });
      }
      // Update text doc with total completions and average wpm
      const textObjectId =
        typeof data.textId === "string"
          ? new ObjectId(data.textId)
          : data.textId;
      await db.collection<TextDoc>("texts").updateOne(
        { _id: textObjectId },
        [
          {
            $set: {
              totalCompletions: {
                $add: [{ $ifNull: ["$totalCompletions", 0] }, 1],
              },
              averageWpm: {
                $cond: {
                  if: { $eq: [{ $ifNull: ["$totalCompletions", 0] }, 0] },
                  then: data.wpm,
                  else: {
                    $divide: [
                      {
                        $add: [
                          { $multiply: ["$averageWpm", "$totalCompletions"] },
                          data.wpm,
                        ],
                      },
                      { $add: ["$totalCompletions", 1] },
                    ],
                  },
                },
              },
            },
          },
        ],
        { session: dbSession },
      );
    });

    return Response.json({ ok: true, sessionId: insertedId });
  } catch (error) {
    console.error("Transaction failed:", error);
    return Response.json({ error: "Failed to save session" }, { status: 500 });
  } finally {
    await dbSession.endSession();
  }
}
