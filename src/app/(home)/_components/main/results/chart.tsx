"use client";

import { useMemo } from "react";
import {
  Line,
  XAxis,
  YAxis,
  Label,
  Tooltip,
  Scatter,
  ComposedChart,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { TypingSessionDoc } from "@/lib/types";

type CustomTooltipProps = {
  active?: boolean;
  payload?: {
    name: string;
    value: number;
    color: string;
    fill: string;
    payload: {
      errorCount: number;
    };
  }[];
};

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-background border-border rounded-lg border p-2 shadow-sm">
      {payload.map((entry) => {
        if (entry.name === "second" || entry.name === "errorCount") return null;
        if (entry.name === "Errors" && entry.value === null) return null;

        const isError = entry.name === "Errors";
        const value = isError ? entry.payload.errorCount : entry.value;

        return (
          <div
            key={entry.name}
            className="text-6 flex items-center gap-2 py-0.5"
          >
            <span
              className="size-3"
              style={{
                backgroundColor: isError
                  ? "var(--red-500)"
                  : entry.color || entry.fill,
              }}
            />
            <span className="text-muted-foreground">
              {entry.name} : {value}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const SessionChart = ({ session }: { session: TypingSessionDoc }) => {
  const chartData = useMemo(() => {
    if (!session.keystrokes || session.keystrokes.length === 0) return [];

    const durationSec = Math.ceil(session.durationMs / 1000);
    const data: Record<string, number | null>[] = [];

    let cumulativeCorrect = 0;
    let cumulativeTotal = 0;

    for (let s = 1; s <= durationSec; s++) {
      const startTime = (s - 1) * 1000;
      const endTime = s * 1000;

      const ksInSecond = session.keystrokes.filter(
        (k) => k.timestampMs >= startTime && k.timestampMs < endTime,
      );
      const correctInSecond = ksInSecond.filter(
        (k) => k.isCorrect && k.typedChar !== "Backspace",
      ).length;
      const totalInSecond = ksInSecond.filter(
        (k) => k.typedChar !== "Backspace",
      ).length;
      const errorsInSecond = ksInSecond.filter(
        (k) => !k.isCorrect && k.typedChar !== "Backspace",
      ).length;

      cumulativeCorrect += correctInSecond;
      cumulativeTotal += totalInSecond;

      const wpm = Math.round(cumulativeCorrect / 5 / (s / 60));
      const raw = Math.round(cumulativeTotal / 5 / (s / 60));
      // Burst is the speed of just this second (total keys * 60 / 5)
      const burst = totalInSecond * 12;

      data.push({
        second: s,
        wpm: s === 0 ? 0 : wpm,
        raw: s === 0 ? 0 : raw,
        burst: s === 0 ? 0 : burst,
        errors: errorsInSecond > 0 ? wpm : null,
        errorCount: errorsInSecond,
      });
    }

    return data;
  }, [session]);

  if (chartData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={chartData}
        margin={{ top: 10, right: 0, left: 0, bottom: 20 }}
      >
        <CartesianGrid
          strokeDasharray="2 2"
          strokeOpacity={0.5}
          strokeLinecap="round"
          stroke="var(--border)"
          vertical={false}
        />
        <XAxis
          dataKey="second"
          stroke="var(--muted-foreground)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)" }}
        >
          <Label
            value="Seconds"
            position="insideBottom"
            offset={-15}
            fill="var(--muted-foreground)"
            fontSize={12}
          />
        </XAxis>
        <YAxis hide domain={[0, "auto"]} />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="raw"
          stroke="var(--green-500)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          name="Raw"
          isAnimationActive={true}
        />
        <Line
          type="monotone"
          dataKey="wpm"
          stroke="var(--blue-400)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          name="WPM"
          isAnimationActive={true}
        />
        <Line
          type="monotone"
          name="Burst"
          dataKey="burst"
          stroke="var(--muted)"
          strokeWidth={2}
          strokeDasharray="3 3"
          dot={false}
          activeDot={false}
          isAnimationActive={true}
        />
        <Scatter
          dataKey="errors"
          fill="var(--red-500)"
          stroke="var(--red-500)"
          name="Errors"
          shape="circle"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
