import { Metrics } from "./metrics";
import { TypingEngine } from "./engine";

export const Main = () => {
  return (
    <main className="flex grow flex-col gap-8 border-b">
      <Metrics />
      <TypingEngine />
    </main>
  );
};
