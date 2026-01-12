import { getSession, getUser, getAnonUserId } from "../dal/user";
import { getInitialText, getNextText, getRandomText } from "../dal/data";

import { SoundProvider } from "./engine/sound.context";
import { EngineProvider } from "./engine/engine.context";
import { parseSearchParams } from "./engine/engine-utils";

import { Header } from "./_components/header";
import { MainContent } from "./_components/main/content";
import { Results } from "./_components/main/results";
import { Footer } from "./_components/footer";
import { LoadingOverlay } from "./_components/main/loading-overlay";

export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const { category, difficulty, mode, id, sessionId } = parseSearchParams(sp);

  const user = await getUser();
  const currentAnonUserId = await getAnonUserId();

  const sessionData = sessionId ? await getSession(sessionId) : null;
  const targetId = sessionData?.textId || id;

  const textData = await getInitialText({ id: targetId, category, difficulty });

  if (!textData) {
    return (
      <main className="flex grow flex-col items-center justify-center">
        <p className="text-muted-foreground">No text data found.</p>
      </main>
    );
  }

  const [nextText, randomText] = await Promise.all([
    getNextText({
      id: textData._id.toString(),
      category: textData.category,
      difficulty: textData.difficulty,
    }),
    getRandomText({ id: textData._id.toString() }),
  ]);

  const nextId = nextText?._id?.toString() || null;
  const randomId = randomText?._id?.toString() || null;

  return (
    <EngineProvider data={{ textData, mode }}>
      <SoundProvider>
        <div className="container">
          <Header user={user} />
          <LoadingOverlay />
          {!!sessionData ? (
            <Results
              user={user}
              text={textData.text}
              session={sessionData}
              nextTextId={nextId}
              currentAnonUserId={currentAnonUserId}
            />
          ) : (
            <MainContent nextTextId={nextId} randomId={randomId} />
          )}
          <Footer />
        </div>
      </SoundProvider>
    </EngineProvider>
  );
}
