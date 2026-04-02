import { prisma } from "@/lib/db";
import { getActiveProfileId } from "@/lib/profile";
import {
  calculateMonthlyCashFlow,
  calculateMonthlyNetIncome,
  calculateMonthlyExpenses,
  calculateMonthlyDebtPayments,
  calculateNetWorth,
  calculateTotalAssets,
  calculateTotalDebts,
  calculateEmergencyFundMonths,
  calculateDebtPayoff,
  calculateSavingsRate,
  estimateMilestones,
  projectSavings,
} from "@/lib/engine/calculator";
import { projectMonthly, projectToGoal } from "@/lib/engine/projections";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profileId = await getActiveProfileId();
  const [incomes, expenses, debts, assets, goals] = await Promise.all([
    prisma.income.findMany({ where: { profileId } }),
    prisma.expense.findMany({ where: { profileId } }),
    prisma.debt.findMany({ where: { profileId } }),
    prisma.asset.findMany({ where: { profileId } }),
    prisma.goal.findMany({ where: { profileId } }),
  ]);

  const incomeInputs = incomes.map((i) => ({
    id: i.id, name: i.name, amount: i.amount, frequency: i.frequency, taxRate: i.taxRate,
  }));
  const expenseInputs = expenses.map((e) => ({
    id: e.id, name: e.name, amount: e.amount, frequency: e.frequency, category: e.category, isFixed: e.isFixed,
  }));
  const debtInputs = debts.map((d) => ({
    id: d.id, name: d.name, balance: d.balance, interestRate: d.interestRate, minimumPayment: d.minimumPayment, type: d.type,
  }));
  const assetInputs = assets.map((a) => ({
    id: a.id, name: a.name, value: a.value, type: a.type, growthRate: a.growthRate,
  }));
  const goalInputs = goals.map((g) => ({
    id: g.id, name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount, targetDate: g.targetDate.toISOString(), priority: g.priority, type: g.type,
  }));

  const state = { incomes: incomeInputs, expenses: expenseInputs, debts: debtInputs, assets: assetInputs, goals: goalInputs };

  const monthlyIncome = calculateMonthlyNetIncome(incomeInputs);
  const monthlyExpenses = calculateMonthlyExpenses(expenseInputs);
  const monthlyDebtPayments = calculateMonthlyDebtPayments(debtInputs);
  const cashFlow = calculateMonthlyCashFlow(incomeInputs, expenseInputs, debtInputs);
  const netWorth = calculateNetWorth(assetInputs, debtInputs);
  const totalAssets = calculateTotalAssets(assetInputs);
  const totalDebts = calculateTotalDebts(debtInputs);
  const emergencyMonths = calculateEmergencyFundMonths(assetInputs, expenseInputs);
  const savingsRate = calculateSavingsRate(incomeInputs, expenseInputs, debtInputs);
  const projections1yr = projectMonthly(state, 12);
  const projections5yr = projectMonthly(state, 60);
  const debtPayoffs = debtInputs.map((d) => calculateDebtPayoff(d));
  const milestones = estimateMilestones(state);
  const savingsProjection = projectSavings(assetInputs, cashFlow, 60);

  const goalProjections = goalInputs.map((g) => {
    const proj = projectToGoal(state, g);
    return { ...proj, goalId: g.id, goalName: g.name };
  });

  return (
    <DashboardClient
      monthlyIncome={monthlyIncome}
      monthlyExpenses={monthlyExpenses}
      monthlyDebtPayments={monthlyDebtPayments}
      cashFlow={cashFlow}
      netWorth={netWorth}
      totalAssets={totalAssets}
      totalDebts={totalDebts}
      emergencyMonths={emergencyMonths}
      savingsRate={savingsRate}
      projections1yr={projections1yr}
      projections5yr={projections5yr}
      debtPayoffs={debtPayoffs}
      goalProjections={goalProjections}
      goals={goalInputs}
      milestones={milestones}
      savingsProjection={savingsProjection}
    />
  );
}
