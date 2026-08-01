"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Candle } from "@/lib/stellar/types";

export function VolumeChart({ candles }: { candles: Candle[] }) {
  const data = candles.map((c) => ({
    time: new Date(c.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    volume: Number(c.volumeCounter.toFixed(2)),
  }));

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c2540" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: "#5c6a8f", fontSize: 10 }}
            axisLine={{ stroke: "#1c2540" }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: "#5c6a8f", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(v: number) => `${v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v}`}
          />
          <Tooltip
            cursor={{ fill: "rgba(62,141,253,0.06)" }}
            contentStyle={{
              background: "#151d33",
              border: "1px solid #28345a",
              borderRadius: "0.75rem",
              fontSize: "0.75rem",
            }}
            formatter={(v) => [`${Number(v ?? 0).toFixed(2)} XLM`, "Volume"]}
          />
          <Bar dataKey="volume" fill="#3e8dfd" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
