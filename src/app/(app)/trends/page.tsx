import { prisma } from "@/lib/db";
import { getActiveProfileId } from "@/lib/profile";
import { toMonthly } from "@/lib/engine/calculator";
import { TrendsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const profileId = await getActiveProfileId();

  const [checkins, expenses] = await Promise.all([
    prisma.monthlyCheckin.findMany({
      where: { profileId },
      orderBy: [{ year: "asc" }, { month: "asc" }],
      select: {
        id: true, month: true, year: true, totalIncome: true, totalExpenses: true,
        expensesByCategory: true, overallGrade: true, gradeDetails: true,
      },
    }),
    prisma.expense.findMany({ where: { profileId } }),
  ]);

  const parsed = checkins.map((c) => ({
    id: c.id, month: c.month, year: c.year, totalIncome: c.totalIncome,
    totalExpenses: c.totalExpenses, overallGrade: c.overallGrade,
    expensesByCategory: JSON.parse(c.expensesByCategory || "{}") as Record<string, number>,
    gradeDetails: JSON.parse(c.gradeDetails || "{}") as Record<string, { budgeted: number; actual: number; grade: string }>,
  }));

  // Build budget map
  const budget: Record<string, number> = {};
  for (const e of expenses) {
    const monthly = toMonthly(e.amount, e.frequency);
    budget[e.category] = (budget[e.category] || 0) + monthly;
  }

  return <TrendsClient checkins={parsed} budget={budget} />;
}
