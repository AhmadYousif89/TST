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

    const data: TextDoc = {
      ...textDocs,
      _id: textDocs._id.toString(),
    };

    return data;
  } catch (error) {
    console.error("Error fetching text data:", error);
    return null;
  }
}

export async function getRandomText({ id }: { id: string }) {
  try {
    const { db } = await connectToDB();
    const textDocs = await db
      .collection<TextDoc>("texts")
      .find({ _id: { $ne: new ObjectId(id) } })
      .project({ _id: 1 })
      .toArray();

    if (textDocs.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * textDocs.length);
    const randomId = textDocs[randomIndex]._id;

    return await db.collection<TextDoc>("texts").findOne({ _id: randomId });
  } catch (error) {
    console.error("Error fetching random text data:", error);
    return null;
  }
}

export async function getNextText({ id, category, difficulty }: TextParams) {
  try {
    const { db } = await connectToDB();
    const texts = await db
      .collection<TextDoc>("texts")
      .find({ category, difficulty }, { projection: { _id: 1 } })
      .toArray();

    if (texts.length <= 1) return null;

    const currentIndex = texts.findIndex((t) => t._id.toString() === id);
    const nextIndex = (currentIndex + 1) % texts.length;
    const nextId = texts[nextIndex]._id;

    const nextText = await db
      .collection<TextDoc>("texts")
      .findOne({ _id: nextId });

    return nextText;
  } catch (error) {
    console.error("Error fetching next text data:", error);
    return null;
  }
}
