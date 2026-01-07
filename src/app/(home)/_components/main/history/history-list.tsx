"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TypingSessionDoc } from "@/lib/types";
import { HistoryLinkItem } from "./history-link-item";

type Props = {
  sortedValid: TypingSessionDoc[];
  invalidSessions: TypingSessionDoc[];
  bestSessionId: string | null;
};

export const HistoryList = ({
  sortedValid,
  invalidSessions,
  bestSessionId,
}: Props) => {
  const searchParams = useSearchParams();
  const serverSid = searchParams.get("sid");

  const [activeSid, setActiveSid] = useState<string | null>(serverSid);

  // Sync state with URL if it changes manually
  useEffect(() => {
    setActiveSid(serverSid);
  }, [serverSid]);

  const buildLink = (session: TypingSessionDoc) => {
    const params = new URLSearchParams();
    params.set("sid", session._id.toString());
    params.set("mode", session.mode);
    params.set("category", session.category);
    params.set("difficulty", session.difficulty);
    return `/?${params.toString()}`;
  };

  const activeSidString = activeSid?.toString() ?? null;

  const handleSelect = (sid: string) => setActiveSid(sid);

  const renderSession = (session: TypingSessionDoc) => {
    const isBest = session._id === bestSessionId;
    const sidString = session._id.toString();

    return (
      <HistoryLinkItem
        key={session._id.toString()}
        isBest={isBest}
        session={session}
        href={buildLink(session)}
        isActive={activeSidString === sidString}
        onSelect={() => handleSelect(sidString)}
      />
    );
  };

  return (
    <div className="flex flex-col gap-3 overflow-y-auto py-8">
      {sortedValid.map(renderSession)}

      {invalidSessions.length > 0 && (
        <>
          <div className="bg-border mx-5 my-4 h-px shrink-0" />
          {invalidSessions.map(renderSession)}
        </>
      )}
    </div>
  );
};
