"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const PALETTE = [
  "#3e8dfd",
  "#22d3ee",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#a78bfa",
  "#f472b6",
  "#2dd4bf",
];

export interface AllocationSlice {
  name: string;
  value: number;
}

interface AllocationDonutProps {
  data: AllocationSlice[];
  totalLabel?: string;
}

export function AllocationDonut({ data, totalLabel = "Total" }: AllocationDonutProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="text-foreground-faint flex h-56 items-center justify-center text-sm">
        No allocations to display
      </div>
    );
  }

  return (
    <div className="relative h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={88}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#151d33",
              border: "1px solid #28345a",
              borderRadius: "0.75rem",
              fontSize: "0.75rem",
            }}
            formatter={(value) => [`${Number(value ?? 0).toFixed(2)} XLM`, "Value"]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-foreground-faint text-xs tracking-wider uppercase">{totalLabel}</span>
        <span className="font-display text-xl font-semibold tabular-nums">
          {total.toFixed(2)} <span className="text-foreground-muted text-sm">XLM</span>
        </span>
      </div>
    </div>
  );
}
