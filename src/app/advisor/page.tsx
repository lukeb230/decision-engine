import { prisma } from "@/lib/db";
import {
  calculateMonthlyCashFlow,
  calculateNetWorth,
  calculateSavingsRate,
  calculateMonthlyNetIncome,
  calculateMonthlyExpenses,
  calculateMonthlyDebtPayments,
  calculateTotalAssets,
  calculateTotalDebts,
} from "@/lib/engine/calculator";
import { AdvisorClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdvisorPage() {
  const [incomes, expenses, debts, assets] = await Promise.all([
    prisma.income.findMany(),
    prisma.expense.findMany(),
    prisma.debt.findMany(),
    prisma.asset.findMany(),
  ]);

  const incomeInputs = incomes.map((i) => ({ id: i.id, name: i.name, amount: i.amount, frequency: i.frequency, taxRate: i.taxRate }));
  const expenseInputs = expenses.map((e) => ({ id: e.id, name: e.name, amount: e.amount, frequency: e.frequency, category: e.category, isFixed: e.isFixed }));
  const debtInputs = debts.map((d) => ({ id: d.id, name: d.name, balance: d.balance, interestRate: d.interestRate, minimumPayment: d.minimumPayment, type: d.type }));
  const assetInputs = assets.map((a) => ({ id: a.id, name: a.name, value: a.value, type: a.type, growthRate: a.growthRate }));

  const cashFlow = calculateMonthlyCashFlow(incomeInputs, expenseInputs, debtInputs);
  const netWorth = calculateNetWorth(assetInputs, debtInputs);
  const savingsRate = calculateSavingsRate(incomeInputs, expenseInputs, debtInputs);

  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  return (
    <AdvisorClient
      netWorth={netWorth}
      cashFlow={cashFlow}
      savingsRate={savingsRate}
      hasApiKey={hasApiKey}
    />
  );
}
