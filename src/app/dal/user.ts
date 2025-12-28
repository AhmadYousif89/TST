import { cookies } from "next/headers";
import connectToDB from "@/lib/db";
import { AnonUserDoc } from "@/lib/types";

export async function getUser(): Promise<AnonUserDoc | null> {
  const cookieStore = await cookies();
  const anonUserId = cookieStore.get("anonUserId")?.value;

  if (!anonUserId) return null;

  try {
    const { db } = await connectToDB();
    const user = await db
      .collection<AnonUserDoc>("anonymous_users")
      .findOne({ anonUserId });

    if (!user) return null;

    return {
      ...user,
      _id: user._id.toString(),
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}
