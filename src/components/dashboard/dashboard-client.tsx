"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  Bot,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Zap,
  Sparkles,
} from "lucide-react";
import type {
  MonthlySnapshot,
  DebtPayoffResult,
  GoalProjection,
  GoalInput,
  MilestoneEstimate,
  SavingsProjectionPoint,
} from "@/lib/engine/types";

interface Props {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyDebtPayments: number;
  cashFlow: number;
  netWorth: number;
  totalAssets: number;
  totalDebts: number;
  emergencyMonths: number;
  savingsRate: number;
  projections1yr: MonthlySnapshot[];
  projections5yr: MonthlySnapshot[];
  debtPayoffs: DebtPayoffResult[];
  goalProjections: GoalProjection[];
  goals: GoalInput[];
  milestones: MilestoneEstimate[];
  savingsProjection: SavingsProjectionPoint[];
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <div className="rounded-lg bg-muted p-1.5">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
        <p
          className={`text-xl font-bold tracking-tight ${
            trend === "up"
              ? "text-emerald-600"
              : trend === "down"
              ? "text-red-500"
              : ""
          }`}
        >
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </CardContent>
    </Card>
  );
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
  savingsRate,
  projections1yr,
  projections5yr,
  debtPayoffs,
  goalProjections,
  goals,
  milestones,
}: Props) {
  const [projectionRange, setProjectionRange] = useState<"1yr" | "5yr">("5yr");
  const projections = projectionRange === "1yr" ? projections1yr : projections5yr;

  const goalData = goalProjections.map((gp, i) => ({
    name: gp.goalName,
    currentAmount: goals[i]?.currentAmount ?? 0,
    targetAmount: goals[i]?.targetAmount ?? 0,
    onTrack: gp.onTrack,
  }));

  // Project final net worth for display
  const projectedNetWorth5yr = projections5yr[projections5yr.length - 1]?.netWorth ?? netWorth;

  return (
    <div className="space-y-6 pt-2 md:pt-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your financial command center
        </p>
      </div>

      {/* 3-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr_300px]">
        {/* LEFT COLUMN: Financial Summary */}
        <div className="space-y-3">
          <StatCard
            title="Net Worth"
            value={formatCurrency(netWorth)}
            subtitle={`${formatCurrency(totalAssets)} assets`}
            icon={TrendingUp}
            trend={netWorth >= 0 ? "up" : "down"}
          />
          <StatCard
            title="Monthly Income"
            value={formatCurrency(monthlyIncome)}
            subtitle="After taxes"
            icon={DollarSign}
            trend="up"
          />
          <StatCard
            title="Monthly Expenses"
            value={formatCurrency(monthlyExpenses + monthlyDebtPayments)}
            subtitle={`${formatCurrency(monthlyExpenses)} bills + ${formatCurrency(monthlyDebtPayments)} debt`}
            icon={ArrowDownRight}
            trend="down"
          />
          <StatCard
            title="Free Cash Flow"
            value={formatCurrency(cashFlow)}
            subtitle={cashFlow > 0 ? "Available to save/invest" : "Spending exceeds income"}
            icon={ArrowUpRight}
            trend={cashFlow >= 0 ? "up" : "down"}
          />
          <StatCard
            title="Savings Rate"
            value={`${savingsRate}%`}
            subtitle={savingsRate >= 20 ? "Excellent" : savingsRate >= 10 ? "Good" : "Needs work"}
            icon={PiggyBank}
            trend={savingsRate >= 20 ? "up" : savingsRate >= 10 ? "neutral" : "down"}
          />
          <StatCard
            title="Total Debt"
            value={formatCurrency(totalDebts)}
            subtitle={`${formatCurrency(monthlyDebtPayments)}/mo payments`}
            icon={CreditCard}
            trend="down"
          />
          <StatCard
            title="Emergency Fund"
            value={emergencyMonths === Infinity ? "N/A" : `${emergencyMonths} mo`}
            subtitle={
              emergencyMonths >= 6
                ? "Fully funded"
                : emergencyMonths >= 3
                ? "Building — target 6mo"
                : "Below 3mo target"
            }
            icon={Shield}
            trend={emergencyMonths >= 6 ? "up" : emergencyMonths >= 3 ? "neutral" : "down"}
          />
        </div>

        {/* CENTER COLUMN: Charts & Projections */}
        <div className="space-y-6">
          {/* Net Worth Projection */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Net Worth Projection</CardTitle>
                <div className="flex gap-1">
                  <button
                    onClick={() => setProjectionRange("1yr")}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      projectionRange === "1yr"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    1 Year
                  </button>
                  <button
                    onClick={() => setProjectionRange("5yr")}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      projectionRange === "5yr"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    5 Year
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Projected: {formatCurrency(projectedNetWorth5yr)} in 5 years
              </p>
            </CardHeader>
            <CardContent>
              {projections.length > 0 ? (
                <ProjectionChart data={projections} />
              ) : (
                <p className="text-muted-foreground text-center py-12">
                  Add financial data to see projections
                </p>
              )}
            </CardContent>
          </Card>

          {/* Debt Payoff + Goals side by side */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Debt Payoff
                </CardTitle>
              </CardHeader>
              <CardContent>
                {debtPayoffs.length > 0 ? (
                  <div className="space-y-3">
                    {debtPayoffs.map((dp) => (
                      <div key={dp.debtId} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{dp.debtName}</p>
                          <Badge
                            variant={dp.monthsToPayoff <= 24 ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {formatMonths(dp.monthsToPayoff)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatCurrency(dp.totalInterestPaid)} interest</span>
                          <span>{dp.payoffDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-6 text-sm">
                    No debts tracked
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Goal Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {goalData.length > 0 ? (
                  <MilestoneTimeline goals={goalData} />
                ) : (
                  <p className="text-muted-foreground text-center py-6 text-sm">
                    No goals set
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Panel + Milestones */}
        <div className="space-y-4">
          {/* AI Summary Panel */}
          <Card className="border-blue-200 bg-gradient-to-b from-blue-50/80 to-white dark:from-blue-950/20 dark:to-card dark:border-blue-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                AI Insights
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  Preview
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cashFlow > 500 && (
                <div className="flex gap-2 text-xs">
                  <Zap className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p>
                    Strong {formatCurrency(cashFlow)}/mo surplus. Consider
                    directing extra toward your highest-rate debt to save on
                    interest.
                  </p>
                </div>
              )}
              {savingsRate < 20 && (
                <div className="flex gap-2 text-xs">
                  <Zap className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p>
                    Savings rate is {savingsRate}%. Aim for 20%+ to accelerate
                    wealth building.
                  </p>
                </div>
              )}
              {emergencyMonths < 6 && emergencyMonths !== Infinity && (
                <div className="flex gap-2 text-xs">
                  <Zap className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p>
                    Emergency fund covers {emergencyMonths} months. Build to 6
                    months ({formatCurrency((monthlyExpenses + monthlyDebtPayments) * 6)})
                    before aggressive investing.
                  </p>
                </div>
              )}
              {totalDebts > 0 && debtPayoffs.some((d) => d.monthsToPayoff > 60) && (
                <div className="flex gap-2 text-xs">
                  <Zap className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p>
                    Some debts will take 5+ years at minimum payments. Use the
                    Scenario Builder to model accelerated payoff.
                  </p>
                </div>
              )}
              <div className="pt-2 border-t">
                <p className="text-[10px] text-muted-foreground">
                  Full AI advisor coming soon. Visit the AI Advisor page for more
                  insights.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Milestones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {milestones.map((m, i) => {
                const pct = m.targetValue > 0
                  ? Math.min(100, (m.currentValue / m.targetValue) * 100)
                  : m.name === "Debt Free"
                  ? 0
                  : 0;
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">{m.name}</p>
                      <Badge
                        variant={m.achievable ? "default" : "destructive"}
                        className="text-[10px]"
                      >
                        {m.achievable ? formatMonths(m.estimatedMonths) : "N/A"}
                      </Badge>
                    </div>
                    {m.name !== "Debt Free" && (
                      <Progress value={pct} className="h-1.5" />
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      {m.achievable
                        ? `Est. ${m.estimatedDate}`
                        : "Not achievable at current rate"}
                    </p>
                  </div>
                );
              })}
              {milestones.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Add data to see milestone estimates
                </p>
              )}
            </CardContent>
          </Card>

          {/* Goal Projections */}
          {goalProjections.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Goal Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {goalProjections.map((gp) => (
                  <div key={gp.goalId} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">{gp.goalName}</p>
                      <Badge
                        variant={gp.onTrack ? "default" : "destructive"}
                        className="text-[10px]"
                      >
                        {gp.onTrack ? "On Track" : "Behind"}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Need {formatCurrency(gp.monthlySavingsNeeded)}/mo
                      {gp.estimatedDate !== "Never" && ` \u2022 Est. ${gp.estimatedDate}`}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
