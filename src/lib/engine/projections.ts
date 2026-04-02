import {
  FinancialState,
  MonthlySnapshot,
  GoalProjection,
  ScenarioChangeInput,
} from "./types";
import {
  calculateMonthlyNetIncome,
  calculateMonthlyExpenses,
  calculateMonthlyDebtPayments,
} from "./calculator";

export function projectMonthly(state: FinancialState, months: number): MonthlySnapshot[] {
  const snapshots: MonthlySnapshot[] = [];
  const now = new Date();

  const debtBalances: Record<string, number> = {};
  state.debts.forEach((d) => (debtBalances[d.id] = d.balance));

  const assetValues: Record<string, number> = {};
  state.assets.forEach((a) => (assetValues[a.id] = a.value));

  const monthlyIncome = calculateMonthlyNetIncome(state.incomes);
  const monthlyExpenses = calculateMonthlyExpenses(state.expenses);
  const monthlyDebtPayments = calculateMonthlyDebtPayments(state.debts);
  const netCashFlow = monthlyIncome - monthlyExpenses - monthlyDebtPayments;

  for (let m = 0; m <= months; m++) {
    const date = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const label = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    if (m > 0) {
      // Apply interest and payments to debts
      for (const debt of state.debts) {
        if (debtBalances[debt.id] > 0) {
          const monthlyRate = debt.interestRate / 100 / 12;
          debtBalances[debt.id] += debtBalances[debt.id] * monthlyRate;
          debtBalances[debt.id] -= debt.minimumPayment;
          if (debtBalances[debt.id] < 0) debtBalances[debt.id] = 0;
        }
      }

      // Grow assets
      for (const asset of state.assets) {
        const monthlyRate = asset.growthRate / 100 / 12;
        assetValues[asset.id] *= 1 + monthlyRate;
      }

      // Add surplus cash flow to first savings asset
      if (netCashFlow > 0) {
        const savingsAsset = state.assets.find((a) => a.type === "savings");
        if (savingsAsset) {
          assetValues[savingsAsset.id] += netCashFlow;
        }
      }
    }

    const totalDebtBalance = Object.values(debtBalances).reduce((s, v) => s + v, 0);
    const totalAssetValue = Object.values(assetValues).reduce((s, v) => s + v, 0);

    snapshots.push({
      month: m,
      label,
      totalIncome: Math.round(monthlyIncome * 100) / 100,
      totalExpenses: Math.round(monthlyExpenses * 100) / 100,
      totalDebtPayments: Math.round(monthlyDebtPayments * 100) / 100,
      netCashFlow: Math.round(netCashFlow * 100) / 100,
      totalDebtBalance: Math.round(totalDebtBalance * 100) / 100,
      totalAssetValue: Math.round(totalAssetValue * 100) / 100,
      netWorth: Math.round((totalAssetValue - totalDebtBalance) * 100) / 100,
      debtBalances: { ...debtBalances },
      assetValues: { ...assetValues },
    });
  }

  return snapshots;
}

export function projectToGoal(state: FinancialState, goal: { targetAmount: number; currentAmount: number; targetDate: string }): GoalProjection & { goalId: string; goalName: string } {
  const monthlyIncome = calculateMonthlyNetIncome(state.incomes);
  const monthlyExpenses = calculateMonthlyExpenses(state.expenses);
  const monthlyDebtPayments = calculateMonthlyDebtPayments(state.debts);
  const surplus = monthlyIncome - monthlyExpenses - monthlyDebtPayments;

  const remaining = goal.targetAmount - goal.currentAmount;
  const estimatedMonths = surplus > 0 ? Math.ceil(remaining / surplus) : Infinity;

  const estimatedDate = new Date();
  estimatedDate.setMonth(estimatedDate.getMonth() + estimatedMonths);

  const targetDate = new Date(goal.targetDate);
  const monthsUntilTarget = Math.max(
    0,
    (targetDate.getFullYear() - new Date().getFullYear()) * 12 +
      targetDate.getMonth() -
      new Date().getMonth()
  );
  const monthlySavingsNeeded =
    monthsUntilTarget > 0 ? remaining / monthsUntilTarget : remaining;

  return {
    goalId: "",
    goalName: "",
    estimatedMonths,
    estimatedDate: estimatedMonths === Infinity ? "Never" : estimatedDate.toISOString().split("T")[0],
    monthlySavingsNeeded: Math.round(monthlySavingsNeeded * 100) / 100,
    onTrack: estimatedMonths <= monthsUntilTarget,
  };
}

export function applyScenarioChanges(
  state: FinancialState,
  changes: ScenarioChangeInput[]
): FinancialState {
  const newState: FinancialState = {
    incomes: state.incomes.map((i) => ({ ...i })),
    expenses: state.expenses.map((e) => ({ ...e })),
    debts: state.debts.map((d) => ({ ...d })),
    assets: state.assets.map((a) => ({ ...a })),
    goals: state.goals.map((g) => ({ ...g })),
  };

  for (const change of changes) {
    const collection = newState[
      (change.entityType + "s") as keyof FinancialState
    ] as unknown as Array<Record<string, unknown>>;
    const entity = collection?.find((e) => e.id === change.entityId);
    if (entity) {
      const numVal = parseFloat(change.newValue);
      entity[change.field] = isNaN(numVal) ? change.newValue : numVal;
    }
  }

  return newState;
}
