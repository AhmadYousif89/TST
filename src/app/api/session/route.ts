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

  const { db, client } = await connectToDB();
  const dbSession = client.startSession();

  try {
    let insertedId: ObjectId | string = "";

    await dbSession.withTransaction(async () => {
      const sessionData = {
        anonUserId,
        ...data,
        startedAt: new Date(data.startedAt),
        finishedAt: new Date(data.finishedAt),
      } as TypingSessionDoc;

      const sessionRes = await db
        .collection<TypingSessionDoc>("typing_sessions")
        .insertOne(sessionData, { session: dbSession });

      insertedId = sessionRes.insertedId;

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
