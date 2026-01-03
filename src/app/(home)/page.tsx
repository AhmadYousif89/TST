import { getUser } from "../dal/user";
import { getInitialText } from "../dal/data";
import { EngineProvider } from "./engine/engine.context";
import { MainContent } from "./_components/main/content";
import { Header } from "./_components/header";
import { Footer } from "./_components/footer";

import { TextCategory, TextDifficulty, TextMode } from "./engine/types";

export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;

  const category =
    typeof sp.category === "string" ? (sp.category as TextCategory) : "general";
  const difficulty =
    typeof sp.difficulty === "string"
      ? (sp.difficulty as TextDifficulty)
      : "easy";
  const mode = typeof sp.mode === "string" ? (sp.mode as TextMode) : "t:60";
  const id = typeof sp.id === "string" ? sp.id : undefined;

  const textData = await getInitialText({ id, category, difficulty });
  const user = await getUser();

  if (!textData) {
    return (
      <main className="flex grow flex-col items-center justify-center">
        <p className="text-muted-foreground">No text data found.</p>
      </main>
    );
  }

  return (
    <EngineProvider data={{ textData, mode }}>
      <div className="container">
        <Header user={user} />
        <MainContent />
        <Footer />
      </div>
    </EngineProvider>
  );
}
