import { FinancialState, ScenarioChangeInput, ScenarioComparison } from "./types";
import { calculateMonthlyCashFlow, calculateNetWorth } from "./calculator";
import { projectMonthly, applyScenarioChanges } from "./projections";

export function compareScenarios(
  baselineState: FinancialState,
  changes: ScenarioChangeInput[],
  months: number = 60
): ScenarioComparison {
  const scenarioState = applyScenarioChanges(baselineState, changes);

  const baselineCashFlow = calculateMonthlyCashFlow(
    baselineState.incomes,
    baselineState.expenses,
    baselineState.debts
  );
  const scenarioCashFlow = calculateMonthlyCashFlow(
    scenarioState.incomes,
    scenarioState.expenses,
    scenarioState.debts
  );

  const baselineNetWorth = calculateNetWorth(baselineState.assets, baselineState.debts);
  const scenarioNetWorth = calculateNetWorth(scenarioState.assets, scenarioState.debts);

  const baselineProjections = projectMonthly(baselineState, months);
  const scenarioProjections = projectMonthly(scenarioState, months);

  return {
    baselineCashFlow: Math.round(baselineCashFlow * 100) / 100,
    scenarioCashFlow: Math.round(scenarioCashFlow * 100) / 100,
    cashFlowDifference: Math.round((scenarioCashFlow - baselineCashFlow) * 100) / 100,
    baselineNetWorth: Math.round(baselineNetWorth * 100) / 100,
    scenarioNetWorth: Math.round(scenarioNetWorth * 100) / 100,
    netWorthDifference: Math.round((scenarioNetWorth - baselineNetWorth) * 100) / 100,
    baselineProjections,
    scenarioProjections,
  };
}
