"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { AnonUserDoc } from "@/lib/types";
import PBIcon from "@/assets/images/icon-personal-best.svg";

type Props = {
  initialUser: AnonUserDoc | null;
};

export const PersonalBest = ({ initialUser }: Props) => {
  const [bestWpm, setBestWpm] = useState<number>(initialUser?.bestWpm || 0);

  useEffect(() => {
    const handleUpdate = async () => {
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const data = await res.json();
          setBestWpm(data.bestWpm || 0);
        }
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
      }
    };

    window.addEventListener("session-finished", handleUpdate);
    return () => window.removeEventListener("session-finished", handleUpdate);
  }, []);

  return (
    <div className="flex items-center gap-2.5">
      <Image
        src={PBIcon}
        alt="personal best"
        width={20}
        height={20}
        className="size-5"
      />
      <p className="text-3-mobile md:text-4">
        <span className="text-muted-foreground md:hidden">Best:</span>
        <span className="text-muted-foreground hidden md:inline-block">
          Personal best:
        </span>
        <span> {Math.round(bestWpm)} WPM</span>
      </p>
    </div>
  );
};
