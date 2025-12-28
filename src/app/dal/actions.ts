"use server";

import { getRandomText } from "./data";
import { TextCategory, TextDifficulty } from "@/app/(home)/engine/types";

export async function getRandomTextAction({
  textId,
  category,
  difficulty,
}: {
  textId: string;
  category: TextCategory;
  difficulty: TextDifficulty;
}) {
  const randomText = await getRandomText({ id: textId, category, difficulty });
  return randomText ? randomText._id.toString() : null;
}
