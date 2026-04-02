"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectionChart } from "@/components/charts/projection-chart";
import { MilestoneTimeline } from "@/components/charts/milestone-timeline";
import { formatCurrency, formatMonths } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Landmark,
  Shield,
  Target,
} from "lucide-react";
import type { MonthlySnapshot, DebtPayoffResult, GoalProjection, GoalInput } from "@/lib/engine/types";

interface Props {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyDebtPayments: number;
  cashFlow: number;
  netWorth: number;
  totalAssets: number;
  totalDebts: number;
  emergencyMonths: number;
  projections: MonthlySnapshot[];
  debtPayoffs: DebtPayoffResult[];
  goalProjections: GoalProjection[];
  goals: GoalInput[];
}

export function DashboardClient({
  monthlyIncome,
  monthlyExpenses,
  monthlyDebtPayments,
  cashFlow,
  netWorth,
  totalAssets,
  totalDebts,
  emergencyMonths,
  projections,
  debtPayoffs,
  goalProjections,
  goals,
}: Props) {
  const goalData = goalProjections.map((gp, i) => ({
    name: gp.goalName,
    currentAmount: goals[i]?.currentAmount ?? 0,
    targetAmount: goals[i]?.targetAmount ?? 0,
    onTrack: gp.onTrack,
  }));

  return (
    <div className="space-y-6 pt-2 md:pt-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your financial snapshot and projections
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${netWorth >= 0 ? "text-green-600" : "text-red-500"}`}>
              {formatCurrency(netWorth)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(totalAssets)} assets - {formatCurrency(totalDebts)} debts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${cashFlow >= 0 ? "text-green-600" : "text-red-500"}`}>
              {formatCurrency(cashFlow)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(monthlyIncome)} in - {formatCurrency(monthlyExpenses + monthlyDebtPayments)} out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">
              {formatCurrency(totalDebts)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(monthlyDebtPayments)}/mo payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Emergency Fund</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${emergencyMonths >= 3 ? "text-green-600" : "text-amber-500"}`}>
              {emergencyMonths === Infinity ? "N/A" : `${emergencyMonths} months`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {emergencyMonths >= 6 ? "Healthy" : emergencyMonths >= 3 ? "Building" : "Needs attention"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Net Worth Projection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            3-Year Net Worth Projection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projections.length > 0 ? (
            <ProjectionChart data={projections} />
          ) : (
            <p className="text-muted-foreground text-center py-12">
              Add income, expenses, debts, and assets to see projections
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Debt Payoff */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Debt Payoff Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {debtPayoffs.length > 0 ? (
              <div className="space-y-4">
                {debtPayoffs.map((dp) => (
                  <div key={dp.debtId} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{dp.debtName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(dp.totalInterestPaid)} total interest
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={dp.monthsToPayoff <= 24 ? "default" : "secondary"}>
                        {formatMonths(dp.monthsToPayoff)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{dp.payoffDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No debts tracked</p>
            )}
          </CardContent>
        </Card>

        {/* Goal Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalData.length > 0 ? (
              <MilestoneTimeline goals={goalData} />
            ) : (
              <p className="text-muted-foreground text-center py-8">No goals set</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goal Details */}
      {goalProjections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Goal Projections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {goalProjections.map((gp) => (
                <div key={gp.goalId} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{gp.goalName}</p>
                    <Badge variant={gp.onTrack ? "default" : "destructive"}>
                      {gp.onTrack ? "On Track" : "Behind"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Est. completion: {gp.estimatedDate}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Need {formatCurrency(gp.monthlySavingsNeeded)}/mo to reach target
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
