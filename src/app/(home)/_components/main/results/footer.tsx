"use client";

import Image from "next/image";

import Star1 from "@/assets/images/pattern-star-1.svg";

import { Button } from "@/components/ui/button";
import { RestartIcon } from "@/components/restart.icon";
import { useUrlState } from "@/hooks/use-url-state";

type Props = { caption?: string; isNewRecord?: boolean };

export const ResultFooter = ({
  caption = "Beat This Score",
  isNewRecord = false,
}: Props) => {
  const { updateURL } = useUrlState();

  return (
    <footer className="text-background relative flex items-center justify-center gap-4 max-md:flex-col">
      <Button
        variant="secondary"
        className="bg-foreground text-3-semibold hover:bg-foreground/90 min-h-14 min-w-54 gap-2.5"
        onClick={() => updateURL({ sid: null })}
      >
        <span>{caption}</span>
        <RestartIcon />
      </Button>
      {!isNewRecord && (
        <Image
          src={Star1}
          alt="Star Pattern"
          className="absolute top-full right-0 -z-10 max-md:mt-11 max-md:size-10 md:top-2/4"
        />
      )}
    </footer>
  );
};
