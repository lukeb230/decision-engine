"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

interface WaterfallItem {
  name: string;
  amount: number;
  type: "income" | "expense" | "debt" | "surplus";
}

interface Props {
  items: WaterfallItem[];
}

export function WaterfallChart({ items }: Props) {
  // Build waterfall data with running totals
  let running = 0;
  const data = items.map((item) => {
    const start = running;
    running += item.amount;
    return {
      name: item.name,
      amount: item.amount,
      start: item.type === "income" ? 0 : start,
      value: Math.abs(item.amount),
      fill:
        item.type === "income"
          ? "#22c55e"
          : item.type === "surplus"
          ? running >= 0
            ? "#3b82f6"
            : "#ef4444"
          : item.type === "debt"
          ? "#f97316"
          : "#ef4444",
      type: item.type,
      running,
    };
  });

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
          <XAxis
            dataKey="name"
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            formatter={(_value, _name, props) => {
              const p = props?.payload as { amount?: number; type?: string } | undefined;
              const amt = p?.amount ?? 0;
              const prefix = amt >= 0 ? "+" : "";
              return [`${prefix}$${Math.abs(amt).toLocaleString()}`, p?.type ?? ""];
            }}
          />
          <ReferenceLine y={0} stroke="hsl(var(--border))" />
          {/* Invisible bar for the "start" offset */}
          <Bar dataKey="start" stackId="a" fill="transparent" />
          {/* Visible bar for the value */}
          <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
