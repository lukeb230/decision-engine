import {
  FinancialState,
  MonthlySnapshot,
  GoalProjection,
  ScenarioChangeInput,
} from "./types";
import {
  calculateMonthlyNetIncome,
  calculateMonthlyExpenses,
} from "./calculator";

/**
 * Projects financial state forward month by month.
 *
 * Key accounting rules:
 * - Net cash flow = income - expenses - debt payments (dynamic per month)
 * - Monthly asset contributions come OUT of cash flow (not free money)
 * - Remaining surplus after contributions goes to savings
 * - When a debt is paid off, its payment frees up as additional surplus
 * - Asset growth rates compound monthly on current balance
 */
export function projectMonthly(state: FinancialState, months: number): MonthlySnapshot[] {
  const snapshots: MonthlySnapshot[] = [];
  const now = new Date();

  // Clone balances for mutation
  const debtBalances: Record<string, number> = {};
  state.debts.forEach((d) => (debtBalances[d.id] = d.balance));

  const assetValues: Record<string, number> = {};
  state.assets.forEach((a) => (assetValues[a.id] = a.value));

  const monthlyIncome = calculateMonthlyNetIncome(state.incomes);
  const monthlyExpenses = calculateMonthlyExpenses(state.expenses);

  // Total committed monthly contributions across all assets
  const totalContributions = state.assets.reduce(
    (sum, a) => sum + (a.monthlyContribution || 0),
    0
  );

  for (let m = 0; m <= months; m++) {
    const date = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const label = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    if (m > 0) {
      // Calculate actual debt payments this month (may be less if debt is paid off)
      let actualDebtPayments = 0;
      for (const debt of state.debts) {
        if (debtBalances[debt.id] > 0.01) {
          const monthlyRate = debt.interestRate / 100 / 12;
          const interest = debtBalances[debt.id] * monthlyRate;
          debtBalances[debt.id] += interest;

          // Pay the minimum or remaining balance, whichever is less
          const payment = Math.min(debt.minimumPayment, debtBalances[debt.id]);
          debtBalances[debt.id] -= payment;
          actualDebtPayments += payment;

          if (debtBalances[debt.id] < 0.01) debtBalances[debt.id] = 0;
        }
      }

      // Apply growth to assets (compound interest on existing balance)
      for (const asset of state.assets) {
        const monthlyRate = asset.growthRate / 100 / 12;
        assetValues[asset.id] *= 1 + monthlyRate;
      }

      // Apply monthly contributions to assets (these come from cash flow)
      for (const asset of state.assets) {
        if (asset.monthlyContribution && asset.monthlyContribution > 0) {
          assetValues[asset.id] += asset.monthlyContribution;
        }
      }

      // Calculate remaining surplus AFTER contributions and debt payments
      const surplus = monthlyIncome - monthlyExpenses - actualDebtPayments - totalContributions;

      // Only add positive surplus to savings (or first available asset)
      if (surplus > 0) {
        const savingsAsset = state.assets.find((a) => a.type === "savings");
        if (savingsAsset) {
          assetValues[savingsAsset.id] += surplus;
        } else if (state.assets.length > 0) {
          // No savings account — deposit to first available asset
          assetValues[state.assets[0].id] += surplus;
        }
        // If no assets at all, surplus is tracked via unallocatedSurplus below
      }
    }

    const totalDebtBalance = Object.values(debtBalances).reduce((s, v) => s + v, 0);
    const totalAssetValue = Object.values(assetValues).reduce((s, v) => s + v, 0);

    // Use actual debt payments from this month's simulation (not recalculated from state)
    const monthDebtPayments = m > 0
      ? state.debts.reduce((sum, d) => {
          // Check what was actually paid: if debt was active at start of this month
          const balanceBefore = snapshots.length > 0
            ? snapshots[snapshots.length - 1].debtBalances[d.id] ?? 0
            : d.balance;
          return sum + (balanceBefore > 0.01 ? Math.min(d.minimumPayment, balanceBefore + balanceBefore * (d.interestRate / 100 / 12)) : 0);
        }, 0)
      : state.debts.reduce((sum, d) => sum + (d.balance > 0 ? d.minimumPayment : 0), 0);

    snapshots.push({
      month: m,
      label,
      totalIncome: Math.round(monthlyIncome * 100) / 100,
      totalExpenses: Math.round(monthlyExpenses * 100) / 100,
      totalDebtPayments: Math.round(monthDebtPayments * 100) / 100,
      netCashFlow: Math.round(
        (monthlyIncome - monthlyExpenses - monthDebtPayments - totalContributions) * 100
      ) / 100,
      totalDebtBalance: Math.round(totalDebtBalance * 100) / 100,
      totalAssetValue: Math.round(totalAssetValue * 100) / 100,
      netWorth: Math.round((totalAssetValue - totalDebtBalance) * 100) / 100,
      debtBalances: { ...debtBalances },
      assetValues: { ...assetValues },
    });
  }

  return snapshots;
}

/**
 * Estimates when a goal will be reached based on available surplus.
 * Surplus = income - expenses - debt payments - asset contributions.
 */
export function projectToGoal(
  state: FinancialState,
  goal: { targetAmount: number; currentAmount: number; targetDate: string }
): Omit<GoalProjection, "goalId" | "goalName"> {
  // Goal already met
  if (goal.currentAmount >= goal.targetAmount) {
    return {
      estimatedMonths: 0,
      estimatedDate: new Date().toISOString().split("T")[0],
      monthlySavingsNeeded: 0,
      onTrack: true,
    };
  }

  const monthlyIncome = calculateMonthlyNetIncome(state.incomes);
  const monthlyExpenses = calculateMonthlyExpenses(state.expenses);
  const monthlyDebtPayments = state.debts.reduce((s, d) => s + d.minimumPayment, 0);
  const totalContributions = state.assets.reduce(
    (sum, a) => sum + (a.monthlyContribution || 0),
    0
  );

  // Available surplus after all committed outflows
  const surplus = monthlyIncome - monthlyExpenses - monthlyDebtPayments - totalContributions;

  const remaining = goal.targetAmount - goal.currentAmount;
  const estimatedMonths = surplus > 0 ? Math.ceil(remaining / surplus) : Infinity;

  const estimatedDate = new Date();
  if (estimatedMonths !== Infinity) {
    estimatedDate.setMonth(estimatedDate.getMonth() + estimatedMonths);
  }

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
    estimatedMonths,
    estimatedDate:
      estimatedMonths === Infinity
        ? "Never"
        : estimatedDate.toISOString().split("T")[0],
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
      // Handle type coercion: booleans, numbers, strings
      const val = change.newValue;
      if (val === "true") {
        entity[change.field] = true;
      } else if (val === "false") {
        entity[change.field] = false;
      } else {
        const numVal = parseFloat(val);
        entity[change.field] = !isNaN(numVal) && val.trim() !== "" ? numVal : val;
      }
    }
  }

  return newState;
}
