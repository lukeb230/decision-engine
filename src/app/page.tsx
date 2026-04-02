import { prisma } from "@/lib/db";
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
} from "@/lib/engine/calculator";
import { projectMonthly, projectToGoal } from "@/lib/engine/projections";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [incomes, expenses, debts, assets, goals] = await Promise.all([
    prisma.income.findMany(),
    prisma.expense.findMany(),
    prisma.debt.findMany(),
    prisma.asset.findMany(),
    prisma.goal.findMany(),
  ]);

  const incomeInputs = incomes.map((i) => ({
    id: i.id,
    name: i.name,
    amount: i.amount,
    frequency: i.frequency,
    taxRate: i.taxRate,
  }));
  const expenseInputs = expenses.map((e) => ({
    id: e.id,
    name: e.name,
    amount: e.amount,
    frequency: e.frequency,
    category: e.category,
    isFixed: e.isFixed,
  }));
  const debtInputs = debts.map((d) => ({
    id: d.id,
    name: d.name,
    balance: d.balance,
    interestRate: d.interestRate,
    minimumPayment: d.minimumPayment,
    type: d.type,
  }));
  const assetInputs = assets.map((a) => ({
    id: a.id,
    name: a.name,
    value: a.value,
    type: a.type,
    growthRate: a.growthRate,
  }));
  const goalInputs = goals.map((g) => ({
    id: g.id,
    name: g.name,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount,
    targetDate: g.targetDate.toISOString(),
    priority: g.priority,
    type: g.type,
  }));

  const state = {
    incomes: incomeInputs,
    expenses: expenseInputs,
    debts: debtInputs,
    assets: assetInputs,
    goals: goalInputs,
  };

  const monthlyIncome = calculateMonthlyNetIncome(incomeInputs);
  const monthlyExpenses = calculateMonthlyExpenses(expenseInputs);
  const monthlyDebtPayments = calculateMonthlyDebtPayments(debtInputs);
  const cashFlow = calculateMonthlyCashFlow(incomeInputs, expenseInputs, debtInputs);
  const netWorth = calculateNetWorth(assetInputs, debtInputs);
  const totalAssets = calculateTotalAssets(assetInputs);
  const totalDebts = calculateTotalDebts(debtInputs);
  const emergencyMonths = calculateEmergencyFundMonths(assetInputs, expenseInputs);
  const projections = projectMonthly(state, 36);
  const debtPayoffs = debtInputs.map((d) => calculateDebtPayoff(d));

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
      projections={projections}
      debtPayoffs={debtPayoffs}
      goalProjections={goalProjections}
      goals={goalInputs}
    />
  );
}
