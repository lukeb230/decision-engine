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
  // Income: bar from 0 to amount (green, going up)
  // Expenses/debts: bar from running total DOWN by the expense amount (red/orange, going down)
  // Surplus: bar from 0 to the final running total (blue, showing what's left)
  let running = 0;
  const data = items.map((item) => {
    if (item.type === "income") {
      running += item.amount;
      return {
        name: item.name,
        amount: item.amount,
        start: 0,
        value: item.amount,
        fill: "#22c55e",
        type: item.type,
        running,
      };
    }

    if (item.type === "surplus") {
      // Surplus shows the remaining amount from 0
      return {
        name: item.name,
        amount: item.amount,
        start: 0,
        value: Math.abs(running),
        fill: running >= 0 ? "#3b82f6" : "#ef4444",
        type: item.type,
        running,
      };
    }

    // Expenses and debts: bar drops from current running total
    const barTop = running;
    running += item.amount; // item.amount is negative
    return {
      name: item.name,
      amount: item.amount,
      start: Math.min(barTop, running), // bottom of bar
      value: Math.abs(item.amount),     // height of bar
      fill: item.type === "debt" ? "#f97316" : "#ef4444",
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
            tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            formatter={(_value, _name, props) => {
              const p = props?.payload as { amount?: number; type?: string } | undefined;
              const amt = p?.amount ?? 0;
              if (p?.type === "surplus") return [`$${Math.abs(amt).toLocaleString()}`, "Remaining"];
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
