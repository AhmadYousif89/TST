"use client";

import { Badge } from "@/components/ui/badge";
import { getModeLabel } from "@/app/(home)/engine/engine-logic";
import { useEngineConfig } from "@/app/(home)/engine/engine.context";

export const TextInfo = () => {
  const { textData, mode } = useEngineConfig();

  return (
    <div className="text-muted-foreground flex items-center justify-center py-4">
      <Badge className="text-6 bg-muted/50 dark:bg-muted/25 min-w-24 font-medium capitalize">
        {textData?.category}
      </Badge>
      <div className="bg-border mx-2 size-1 rounded-full" />
      <Badge className="text-6 bg-muted/50 dark:bg-muted/25 min-w-24 font-medium capitalize">
        {textData?.difficulty}
      </Badge>
      <div className="bg-border mx-2 size-1 rounded-full" />
      <Badge className="text-6 bg-muted/50 dark:bg-muted/25 min-w-24 font-medium">
        {getModeLabel(mode)}
      </Badge>
    </div>
  );
};
