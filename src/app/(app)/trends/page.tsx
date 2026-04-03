import { prisma } from "@/lib/db";
import { getActiveProfileId } from "@/lib/profile";
import { TrendsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const profileId = await getActiveProfileId();

  const checkins = await prisma.monthlyCheckin.findMany({
    where: { profileId },
    orderBy: [{ year: "asc" }, { month: "asc" }],
    select: {
      id: true,
      month: true,
      year: true,
      totalIncome: true,
      totalExpenses: true,
      expensesByCategory: true,
      overallGrade: true,
      gradeDetails: true,
    },
  });

  // Parse JSON fields
  const parsed = checkins.map((c) => ({
    id: c.id,
    month: c.month,
    year: c.year,
    totalIncome: c.totalIncome,
    totalExpenses: c.totalExpenses,
    overallGrade: c.overallGrade,
    expensesByCategory: JSON.parse(c.expensesByCategory || "{}") as Record<string, number>,
    gradeDetails: JSON.parse(c.gradeDetails || "{}") as Record<string, { budgeted: number; actual: number; grade: string }>,
  }));

  return <TrendsClient checkins={parsed} />;
}
