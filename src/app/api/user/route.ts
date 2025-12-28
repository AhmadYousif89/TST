import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import connectToDB from "@/lib/db";
import { AnonUserDoc } from "@/lib/types";

export async function GET() {
  const cookieStore = await cookies();
  const anonUserId = cookieStore.get("anonUserId")?.value;

  if (!anonUserId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { db } = await connectToDB();
    const user = await db
      .collection<AnonUserDoc>("anonymous_users")
      .findOne({ anonUserId });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const cookieStore = await cookies();
  const anonUserId = cookieStore.get("anonUserId")?.value;

  if (!anonUserId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();

  try {
    const { db } = await connectToDB();

    const user = await db
      .collection<AnonUserDoc>("anonymous_users")
      .findOneAndUpdate(
        { anonUserId },
        {
          $set: {
            ...body,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" },
      );

    if (!user)
      return Response.json({ error: "User not found" }, { status: 404 });

    return Response.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
