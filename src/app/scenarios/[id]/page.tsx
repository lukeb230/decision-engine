import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ScenarioDetailClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ScenarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = await prisma.scenario.findUnique({
    where: { id },
    include: { changes: true },
  });

  if (!scenario) return notFound();

  const [incomes, expenses, debts, assets, goals] = await Promise.all([
    prisma.income.findMany(),
    prisma.expense.findMany(),
    prisma.debt.findMany(),
    prisma.asset.findMany(),
    prisma.goal.findMany(),
  ]);

  const state = {
    incomes: incomes.map((i) => ({ id: i.id, name: i.name, amount: i.amount, frequency: i.frequency, taxRate: i.taxRate })),
    expenses: expenses.map((e) => ({ id: e.id, name: e.name, amount: e.amount, frequency: e.frequency, category: e.category, isFixed: e.isFixed })),
    debts: debts.map((d) => ({ id: d.id, name: d.name, balance: d.balance, interestRate: d.interestRate, minimumPayment: d.minimumPayment, type: d.type })),
    assets: assets.map((a) => ({ id: a.id, name: a.name, value: a.value, type: a.type, growthRate: a.growthRate })),
    goals: goals.map((g) => ({ id: g.id, name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount, targetDate: g.targetDate.toISOString(), priority: g.priority, type: g.type })),
  };

  return (
    <ScenarioDetailClient
      scenario={JSON.parse(JSON.stringify(scenario))}
      financialState={state}
    />
  );
}
