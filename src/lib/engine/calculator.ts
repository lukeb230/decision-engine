import { IncomeInput, ExpenseInput, DebtInput, AssetInput, DebtPayoffResult } from "./types";

function toMonthly(amount: number, frequency: string): number {
  switch (frequency) {
    case "annual":
      return amount / 12;
    case "biweekly":
      return (amount * 26) / 12;
    case "weekly":
      return (amount * 52) / 12;
    default:
      return amount;
  }
}

export function calculateMonthlyGrossIncome(incomes: IncomeInput[]): number {
  return incomes.reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0);
}

export function calculateMonthlyNetIncome(incomes: IncomeInput[]): number {
  return incomes.reduce((sum, i) => {
    const monthly = toMonthly(i.amount, i.frequency);
    return sum + monthly * (1 - i.taxRate / 100);
  }, 0);
}

export function calculateMonthlyExpenses(expenses: ExpenseInput[]): number {
  return expenses.reduce((sum, e) => sum + toMonthly(e.amount, e.frequency), 0);
}

export function calculateMonthlyDebtPayments(debts: DebtInput[]): number {
  return debts.reduce((sum, d) => sum + d.minimumPayment, 0);
}

export function calculateMonthlyCashFlow(
  incomes: IncomeInput[],
  expenses: ExpenseInput[],
  debts: DebtInput[]
): number {
  return (
    calculateMonthlyNetIncome(incomes) -
    calculateMonthlyExpenses(expenses) -
    calculateMonthlyDebtPayments(debts)
  );
}

export function calculateNetWorth(assets: AssetInput[], debts: DebtInput[]): number {
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalDebts = debts.reduce((sum, d) => sum + d.balance, 0);
  return totalAssets - totalDebts;
}

export function calculateTotalAssets(assets: AssetInput[]): number {
  return assets.reduce((sum, a) => sum + a.value, 0);
}

export function calculateTotalDebts(debts: DebtInput[]): number {
  return debts.reduce((sum, d) => sum + d.balance, 0);
}

export function calculateDebtPayoff(
  debt: DebtInput,
  extraPayment: number = 0
): DebtPayoffResult {
  const monthlyRate = debt.interestRate / 100 / 12;
  const payment = debt.minimumPayment + extraPayment;
  let balance = debt.balance;
  let months = 0;
  let totalInterest = 0;
  const maxMonths = 600; // 50 year cap

  if (payment <= balance * monthlyRate) {
    return {
      debtId: debt.id,
      debtName: debt.name,
      monthsToPayoff: Infinity,
      totalInterestPaid: Infinity,
      totalPaid: Infinity,
      payoffDate: "Never",
    };
  }

  while (balance > 0.01 && months < maxMonths) {
    const interest = balance * monthlyRate;
    totalInterest += interest;
    balance = balance + interest - payment;
    if (balance < 0) balance = 0;
    months++;
  }

  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + months);

  return {
    debtId: debt.id,
    debtName: debt.name,
    monthsToPayoff: months,
    totalInterestPaid: Math.round(totalInterest * 100) / 100,
    totalPaid: Math.round((debt.balance + totalInterest) * 100) / 100,
    payoffDate: payoffDate.toISOString().split("T")[0],
  };
}

export function calculateInvestmentGrowth(
  principal: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  let value = principal;

  for (let i = 0; i < months; i++) {
    value = value * (1 + monthlyRate) + monthlyContribution;
  }

  return Math.round(value * 100) / 100;
}

export function calculateEmergencyFundMonths(
  assets: AssetInput[],
  expenses: ExpenseInput[]
): number {
  const liquidAssets = assets
    .filter((a) => a.type === "savings")
    .reduce((sum, a) => sum + a.value, 0);
  const monthlyExpenses = calculateMonthlyExpenses(expenses);
  if (monthlyExpenses === 0) return Infinity;
  return Math.round((liquidAssets / monthlyExpenses) * 10) / 10;
}
