import {
  IncomeInput,
  ExpenseInput,
  DebtInput,
  AssetInput,
  DebtPayoffResult,
  FinancialState,
  MilestoneEstimate,
  SavingsProjectionPoint,
} from "./types";

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

/**
 * Savings rate = free cash flow / net income.
 * A healthy savings rate is 20%+. Returns 0-100 scale.
 */
export function calculateSavingsRate(
  incomes: IncomeInput[],
  expenses: ExpenseInput[],
  debts: DebtInput[]
): number {
  const netIncome = calculateMonthlyNetIncome(incomes);
  if (netIncome <= 0) return 0;
  const cashFlow = calculateMonthlyCashFlow(incomes, expenses, debts);
  return Math.round((Math.max(0, cashFlow) / netIncome) * 1000) / 10;
}

/**
 * Projects savings account growth over time, assuming surplus cash flow
 * is deposited monthly. Includes interest earned on savings.
 */
export function projectSavings(
  assets: AssetInput[],
  monthlySurplus: number,
  months: number
): SavingsProjectionPoint[] {
  const points: SavingsProjectionPoint[] = [];
  const now = new Date();

  // Separate savings from investments
  let savings = assets
    .filter((a) => a.type === "savings")
    .reduce((sum, a) => sum + a.value, 0);
  let investments = assets
    .filter((a) => a.type === "investment")
    .reduce((sum, a) => sum + a.value, 0);

  // Assume 4.5% APY on savings, 8% on investments
  const savingsMonthlyRate = 0.045 / 12;
  const investmentMonthlyRate = 0.08 / 12;

  for (let m = 0; m <= months; m++) {
    const date = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const label = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    if (m > 0) {
      savings = savings * (1 + savingsMonthlyRate) + Math.max(0, monthlySurplus);
      investments = investments * (1 + investmentMonthlyRate);
    }

    points.push({
      month: m,
      label,
      savings: Math.round(savings * 100) / 100,
      investments: Math.round(investments * 100) / 100,
      totalLiquid: Math.round((savings + investments) * 100) / 100,
    });
  }

  return points;
}

/**
 * Estimates when key financial milestones will be reached.
 * Uses current trajectory (cash flow + asset growth) to project forward.
 */
export function estimateMilestones(state: FinancialState): MilestoneEstimate[] {
  const milestones: MilestoneEstimate[] = [];
  const now = new Date();
  const netIncome = calculateMonthlyNetIncome(state.incomes);
  const totalExpenses = calculateMonthlyExpenses(state.expenses);
  const debtPayments = calculateMonthlyDebtPayments(state.debts);
  const cashFlow = netIncome - totalExpenses - debtPayments;
  const currentNetWorth = calculateNetWorth(state.assets, state.debts);
  const totalDebt = calculateTotalDebts(state.debts);
  const totalAssets = calculateTotalAssets(state.assets);

  // Milestone: Debt-free date
  if (totalDebt > 0) {
    // Simulate month-by-month debt payoff
    const debtBalances = state.debts.map((d) => ({ ...d, currentBalance: d.balance }));
    let months = 0;
    const maxMonths = 600;
    let allPaid = false;

    while (!allPaid && months < maxMonths) {
      months++;
      allPaid = true;
      for (const debt of debtBalances) {
        if (debt.currentBalance > 0.01) {
          const interest = debt.currentBalance * (debt.interestRate / 100 / 12);
          debt.currentBalance = Math.max(0, debt.currentBalance + interest - debt.minimumPayment);
          if (debt.currentBalance > 0.01) allPaid = false;
        }
      }
    }

    const debtFreeDate = new Date(now);
    debtFreeDate.setMonth(debtFreeDate.getMonth() + months);

    milestones.push({
      name: "Debt Free",
      targetValue: 0,
      currentValue: totalDebt,
      estimatedMonths: allPaid ? months : Infinity,
      estimatedDate: allPaid ? debtFreeDate.toISOString().split("T")[0] : "Never",
      achievable: allPaid,
    });
  }

  // Milestone: $100K net worth
  if (currentNetWorth < 100000) {
    const monthlyGrowth = cashFlow + totalAssets * 0.005; // rough monthly appreciation
    const remaining = 100000 - currentNetWorth;
    const months = monthlyGrowth > 0 ? Math.ceil(remaining / monthlyGrowth) : Infinity;
    const date = new Date(now);
    date.setMonth(date.getMonth() + months);

    milestones.push({
      name: "$100K Net Worth",
      targetValue: 100000,
      currentValue: currentNetWorth,
      estimatedMonths: months === Infinity ? Infinity : months,
      estimatedDate: months === Infinity ? "Never" : date.toISOString().split("T")[0],
      achievable: months !== Infinity && months < 600,
    });
  }

  // Milestone: 6-month emergency fund
  const liquidSavings = state.assets
    .filter((a) => a.type === "savings")
    .reduce((sum, a) => sum + a.value, 0);
  const monthlyExpensesTotal = totalExpenses + debtPayments;
  const emergencyTarget = monthlyExpensesTotal * 6;

  if (liquidSavings < emergencyTarget) {
    const remaining = emergencyTarget - liquidSavings;
    const months = cashFlow > 0 ? Math.ceil(remaining / cashFlow) : Infinity;
    const date = new Date(now);
    date.setMonth(date.getMonth() + months);

    milestones.push({
      name: "6-Month Emergency Fund",
      targetValue: emergencyTarget,
      currentValue: liquidSavings,
      estimatedMonths: months === Infinity ? Infinity : months,
      estimatedDate: months === Infinity ? "Never" : date.toISOString().split("T")[0],
      achievable: months !== Infinity && months < 600,
    });
  }

  // Milestone: $250K net worth
  if (currentNetWorth < 250000) {
    const monthlyGrowth = cashFlow + totalAssets * 0.005;
    const remaining = 250000 - currentNetWorth;
    const months = monthlyGrowth > 0 ? Math.ceil(remaining / monthlyGrowth) : Infinity;
    const date = new Date(now);
    date.setMonth(date.getMonth() + months);

    milestones.push({
      name: "$250K Net Worth",
      targetValue: 250000,
      currentValue: currentNetWorth,
      estimatedMonths: months === Infinity ? Infinity : months,
      estimatedDate: months === Infinity ? "Never" : date.toISOString().split("T")[0],
      achievable: months !== Infinity && months < 600,
    });
  }

  return milestones;
}
