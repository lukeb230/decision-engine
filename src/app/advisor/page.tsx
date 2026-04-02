import { prisma } from "@/lib/db";
import {
  calculateMonthlyCashFlow,
  calculateNetWorth,
  calculateEmergencyFundMonths,
  calculateDebtPayoff,
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

  const cashFlow = calculateMonthlyCashFlow(incomeInputs, expenseInputs, debtInputs);
  const netWorth = calculateNetWorth(assetInputs, debtInputs);
  const emergencyMonths = calculateEmergencyFundMonths(assetInputs, expenseInputs);
  const debtPayoffs = debtInputs.map((d) => calculateDebtPayoff(d));
  const highestRateDebt = debtInputs.length > 0
    ? debtInputs.reduce((a, b) => (a.interestRate > b.interestRate ? a : b))
    : null;

  const insights: string[] = [];

  if (cashFlow > 0) {
    insights.push(`You have ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cashFlow)}/mo in surplus cash flow. Consider directing this toward your highest-priority goal.`);
  } else if (cashFlow < 0) {
    insights.push(`Your expenses exceed income by ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.abs(cashFlow))}/mo. Review variable expenses for potential cuts.`);
  }

  if (emergencyMonths < 3 && emergencyMonths !== Infinity) {
    insights.push(`Your emergency fund covers only ${emergencyMonths} months of expenses. Aim for 3-6 months.`);
  } else if (emergencyMonths >= 6) {
    insights.push(`Your emergency fund is healthy at ${emergencyMonths} months. Consider investing surplus savings.`);
  }

  if (highestRateDebt && highestRateDebt.interestRate > 10) {
    insights.push(`"${highestRateDebt.name}" has a ${highestRateDebt.interestRate}% rate. Paying this off aggressively could save significant interest.`);
  }

  if (debtPayoffs.some((d) => d.monthsToPayoff > 120)) {
    const longDebts = debtPayoffs.filter((d) => d.monthsToPayoff > 120);
    insights.push(`${longDebts.length} debt(s) will take 10+ years to pay off at minimum payments. Consider increasing payments or refinancing.`);
  }

  if (cashFlow > 500) {
    insights.push("With strong cash flow, create a scenario to model investing the surplus. Even small amounts compound significantly over time.");
  }

  if (insights.length === 0) {
    insights.push("Add your financial data (income, expenses, debts, assets) to receive personalized insights.");
  }

  return <AdvisorClient insights={insights} netWorth={netWorth} cashFlow={cashFlow} />;
}
