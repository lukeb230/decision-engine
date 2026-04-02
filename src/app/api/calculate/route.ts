import { NextResponse } from "next/server";
import { projectMonthly } from "@/lib/engine/projections";
import { calculateMonthlyCashFlow, calculateNetWorth, calculateDebtPayoff, calculateEmergencyFundMonths } from "@/lib/engine/calculator";
import { compareScenarios } from "@/lib/engine/scenarios";
import type { FinancialState, ScenarioChangeInput } from "@/lib/engine/types";

export async function POST(req: Request) {
  const body = await req.json();
  const { state, scenarioChanges, months = 60 } = body as {
    state: FinancialState;
    scenarioChanges?: ScenarioChangeInput[];
    months?: number;
  };

  const cashFlow = calculateMonthlyCashFlow(state.incomes, state.expenses, state.debts);
  const netWorth = calculateNetWorth(state.assets, state.debts);
  const projections = projectMonthly(state, months);
  const debtPayoffs = state.debts.map((d) => calculateDebtPayoff(d));
  const emergencyMonths = calculateEmergencyFundMonths(state.assets, state.expenses);

  let comparison = null;
  if (scenarioChanges && scenarioChanges.length > 0) {
    comparison = compareScenarios(state, scenarioChanges, months);
  }

  return NextResponse.json({
    cashFlow,
    netWorth,
    projections,
    debtPayoffs,
    emergencyMonths,
    comparison,
  });
}
