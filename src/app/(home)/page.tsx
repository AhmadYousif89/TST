import { getInitialText } from "../dal/data";
import { getSession, getUser, getAnonUserId } from "../dal/user";

import { SoundProvider } from "./engine/sound.context";
import { EngineProvider } from "./engine/engine.context";
import { TextCategory, TextDifficulty, TextMode } from "./engine/types";

import { Header } from "./_components/header";
import { MainContent } from "./_components/main/content";
import { Results } from "./_components/main/results";
import { Footer } from "./_components/footer";

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
  const sessionId = typeof sp.sid === "string" ? sp.sid : undefined;

  const user = await getUser();
  const currentAnonUserId = await getAnonUserId();
  const textData = await getInitialText({ id, category, difficulty });
  const sessionData = sessionId ? await getSession(sessionId) : null;

  if (!textData) {
    return (
      <main className="flex grow flex-col items-center justify-center">
        <p className="text-muted-foreground">No text data found.</p>
      </main>
    );
  }

  return (
    <EngineProvider data={{ textData, mode }}>
      <SoundProvider>
        <div className="container">
          <Header user={user} />
          {!!sessionData ? (
            <Results
              user={user}
              session={sessionData}
              currentAnonUserId={currentAnonUserId}
            />
          ) : (
            <MainContent />
          )}
          <Footer />
        </div>
      </SoundProvider>
    </EngineProvider>
  );
}
