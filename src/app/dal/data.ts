import { ObjectId } from "mongodb";

import connectToDB from "@/lib/db";
import { TextDoc } from "@/lib/types";
import { TextCategory, TextDifficulty } from "@/app/(home)/engine/types";

type TextParams = {
  id?: string;
  category?: TextCategory;
  difficulty?: TextDifficulty;
};

export async function getInitialText(params: TextParams = {}) {
  const { id, category = "general", difficulty = "easy" } = params;

  try {
    const filter: Record<string, unknown> = {};
    if (id) {
      filter._id = new ObjectId(id);
    } else {
      filter.category = category;
      filter.difficulty = difficulty;
    }

    const { db } = await connectToDB();
    const textDocs = await db.collection<TextDoc>("texts").findOne(filter);

    if (!textDocs) return null;

    return {
      ...textDocs,
      _id: textDocs._id.toString(),
    };
  } catch (error) {
    console.error("Error fetching text data:", error);
    return null;
  }
}

type RandomTextParams = {
  id: string;
  category?: TextCategory;
  difficulty?: TextDifficulty;
};

// Get random text document of the pre-existed set (not the current one)
export async function getRandomText({
  id,
  category,
  difficulty,
}: RandomTextParams) {
  try {
    const { db } = await connectToDB();
    const textDocs = await db
      .collection<TextDoc>("texts")
      .find({ _id: { $ne: new ObjectId(id) }, category, difficulty })
      .toArray();
    if (!textDocs || textDocs.length === 0) return null;

    const randomText = textDocs[Math.floor(Math.random() * textDocs.length)];
    return randomText;
  } catch (error) {
    console.error("Error fetching random text data:", error);
    return null;
  }
}
