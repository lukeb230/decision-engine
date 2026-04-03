import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getActiveProfileIdFromRequest } from "@/lib/profile";

export async function GET(req: Request) {
  const profileId = await getActiveProfileIdFromRequest(req);
  const items = await prisma.monthlyCheckin.findMany({
    where: { profileId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: {
      id: true, month: true, year: true, totalIncome: true, totalExpenses: true,
      overallGrade: true, expensesByCategory: true, gradeDetails: true, aiSuggestions: true, createdAt: true,
    },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const profileId = await getActiveProfileIdFromRequest(req);
  const body = await req.json();
  const { transactions, ...checkinData } = body;

  const checkin = await prisma.$transaction(async (tx) => {
    const created = await tx.monthlyCheckin.create({
      data: {
        profileId,
        month: checkinData.month,
        year: checkinData.year,
        totalIncome: checkinData.totalIncome,
        totalExpenses: checkinData.totalExpenses,
        expensesByCategory: JSON.stringify(checkinData.expensesByCategory),
        netWorth: checkinData.netWorth ?? null,
        overallGrade: checkinData.overallGrade,
        gradeDetails: JSON.stringify(checkinData.gradeDetails),
        aiSuggestions: checkinData.aiSuggestions ? JSON.stringify(checkinData.aiSuggestions) : null,
      },
    });

    if (transactions && transactions.length > 0) {
      await tx.transaction.createMany({
        data: transactions.map((t: any) => ({
          checkinId: created.id,
          date: new Date(t.date),
          description: t.description,
          amount: t.amount,
          isIncome: t.isIncome,
          category: t.category,
          source: t.source,
          excluded: t.excluded || false,
        })),
      });
    }

    return created;
  });

  return NextResponse.json(checkin);
}
