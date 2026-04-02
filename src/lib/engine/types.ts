export interface IncomeInput {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  taxRate: number;
}

export interface ExpenseInput {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  isFixed: boolean;
}

export interface DebtInput {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  type: string;
}

export interface AssetInput {
  id: string;
  name: string;
  value: number;
  type: string;
  growthRate: number;
}

export interface GoalInput {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: number;
  type: string;
}

export interface FinancialState {
  incomes: IncomeInput[];
  expenses: ExpenseInput[];
  debts: DebtInput[];
  assets: AssetInput[];
  goals: GoalInput[];
}

export interface MonthlySnapshot {
  month: number;
  label: string;
  totalIncome: number;
  totalExpenses: number;
  totalDebtPayments: number;
  netCashFlow: number;
  totalDebtBalance: number;
  totalAssetValue: number;
  netWorth: number;
  debtBalances: Record<string, number>;
  assetValues: Record<string, number>;
}

export interface DebtPayoffResult {
  debtId: string;
  debtName: string;
  monthsToPayoff: number;
  totalInterestPaid: number;
  totalPaid: number;
  payoffDate: string;
}

export interface GoalProjection {
  goalId: string;
  goalName: string;
  estimatedMonths: number;
  estimatedDate: string;
  monthlySavingsNeeded: number;
  onTrack: boolean;
}

export interface ScenarioChangeInput {
  entityType: string;
  entityId: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface ScenarioComparison {
  baselineCashFlow: number;
  scenarioCashFlow: number;
  cashFlowDifference: number;
  baselineNetWorth: number;
  scenarioNetWorth: number;
  netWorthDifference: number;
  baselineProjections: MonthlySnapshot[];
  scenarioProjections: MonthlySnapshot[];
}
