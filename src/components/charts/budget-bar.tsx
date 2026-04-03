"use client";

import { formatCurrency } from "@/lib/utils";

interface Props {
  income: number;
  expenses: number;
  debtPayments: number;
  contributions: number;
}

export function BudgetBar({ income, expenses, debtPayments, contributions }: Props) {
  const surplus = income - expenses - debtPayments - contributions;
  const total = income > 0 ? income : 1;

  const segments = [
    { label: "Expenses", amount: expenses, color: "#ef4444", pct: (expenses / total) * 100 },
    { label: "Debt", amount: debtPayments, color: "#f97316", pct: (debtPayments / total) * 100 },
    { label: "Contributions", amount: contributions, color: "#06b6d4", pct: (contributions / total) * 100 },
    { label: surplus >= 0 ? "Surplus" : "Deficit", amount: Math.abs(surplus), color: surplus >= 0 ? "#22c55e" : "#dc2626", pct: (Math.abs(surplus) / total) * 100 },
  ].filter((s) => s.amount > 0);

  return (
    <div className="space-y-3">
      {/* Income bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium">Monthly Income</span>
          <span className="text-sm font-bold text-emerald-600">{formatCurrency(income)}</span>
        </div>
        <div className="h-3 bg-emerald-500 rounded-full" />
      </div>

      {/* Stacked outflow bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium">Where it goes</span>
          <span className="text-sm font-bold text-muted-foreground">{formatCurrency(expenses + debtPayments + contributions)}</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden flex">
          {segments.map((seg) => (
            <div
              key={seg.label}
              className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
              title={`${seg.label}: ${formatCurrency(seg.amount)}`}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-muted-foreground">{seg.label}</span>
            <span className="text-xs font-medium">{formatCurrency(seg.amount)}</span>
            <span className="text-[10px] text-muted-foreground">({seg.pct.toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
