import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getActiveProfileIdFromRequest } from "@/lib/profile";
import { toMonthly } from "@/lib/engine/calculator";
import { computeGrades } from "@/lib/checkin/grading";

export async function POST(req: Request) {
  const profileId = await getActiveProfileIdFromRequest(req);
  const { expensesByCategory } = await req.json();

  // Fetch user's budgeted expenses
  const expenses = await prisma.expense.findMany({ where: { profileId } });

  // Sum budgeted amounts per category using toMonthly for frequency conversion
  const budgeted: Record<string, number> = {};
  for (const e of expenses) {
    const monthly = toMonthly(e.amount, e.frequency);
    budgeted[e.category] = (budgeted[e.category] || 0) + monthly;
  }

  const grades = computeGrades(expensesByCategory, budgeted);
  return NextResponse.json(grades);
}
