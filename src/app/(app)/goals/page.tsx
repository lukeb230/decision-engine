import { prisma } from "@/lib/db";
import { getActiveProfileId } from "@/lib/profile";
import { GoalsClient } from "./client";
import {
  calculateMonthlyCashFlow,
  calculateMonthlyNetIncome,
  calculateMonthlyExpenses,
  calculateMonthlyDebtPayments,
  calculateDebtPayoff,
} from "@/lib/engine/calculator";
import { projectToGoal } from "@/lib/engine/projections";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const profileId = await getActiveProfileId();
  const [goals, incomes, expenses, debts, assets, scenarios] = await Promise.all([
    prisma.goal.findMany({ where: { profileId }, orderBy: { priority: "asc" } }),
    prisma.income.findMany({ where: { profileId } }),
    prisma.expense.findMany({ where: { profileId } }),
    prisma.debt.findMany({ where: { profileId } }),
    prisma.asset.findMany({ where: { profileId } }),
    prisma.scenario.findMany({ where: { profileId, isBaseline: false }, include: { changes: true }, take: 5 }),
  ]);

  const incomeInputs = incomes.map((i) => ({ id: i.id, name: i.name, amount: i.amount, frequency: i.frequency, taxRate: i.taxRate }));
  const expenseInputs = expenses.map((e) => ({ id: e.id, name: e.name, amount: e.amount, frequency: e.frequency, category: e.category, isFixed: e.isFixed }));
  const debtInputs = debts.map((d) => ({ id: d.id, name: d.name, balance: d.balance, interestRate: d.interestRate, minimumPayment: d.minimumPayment, type: d.type }));
  const assetInputs = assets.map((a) => ({ id: a.id, name: a.name, value: a.value, type: a.type, growthRate: a.growthRate }));

  const state = { incomes: incomeInputs, expenses: expenseInputs, debts: debtInputs, assets: assetInputs, goals: [] as typeof goalInputs };

  const cashFlow = calculateMonthlyCashFlow(incomeInputs, expenseInputs, debtInputs);
  const debtPayoffs = debtInputs.map((d) => calculateDebtPayoff(d));

  const goalInputs = goals.map((g) => ({
    id: g.id,
    name: g.name,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount,
    targetDate: g.targetDate.toISOString(),
    priority: g.priority,
    type: g.type,
  }));

  state.goals = goalInputs;

  // Compute projections for each goal
  const goalProjections = goalInputs.map((g) => {
    // For debt_free goals, use debt payoff calculation instead
    if (g.type === "debt_free") {
      const matchingDebt = debtPayoffs.find(
        (dp) => g.name.toLowerCase().includes(dp.debtName.toLowerCase())
      );
      if (matchingDebt) {
        return {
          goalId: g.id,
          goalName: g.name,
          estimatedMonths: matchingDebt.monthsToPayoff,
          estimatedDate: matchingDebt.payoffDate,
          monthlySavingsNeeded: matchingDebt.monthsToPayoff !== Infinity
            ? Math.round((matchingDebt.totalPaid / matchingDebt.monthsToPayoff) * 100) / 100
            : 0,
          onTrack: matchingDebt.monthsToPayoff !== Infinity,
        };
      }
    }

    const proj = projectToGoal(state, g);
    return { ...proj, goalId: g.id, goalName: g.name };
  });

  return (
    <GoalsClient
      items={goalInputs}
      projections={goalProjections}
      cashFlow={cashFlow}
      debtPayoffs={JSON.parse(JSON.stringify(debtPayoffs))}
      debts={debtInputs}
    />
  );
}
