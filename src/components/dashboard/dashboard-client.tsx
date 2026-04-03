"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProjectionChart } from "@/components/charts/projection-chart";
import { MilestoneTimeline } from "@/components/charts/milestone-timeline";
import { WaterfallChart } from "@/components/charts/waterfall-chart";
import { DTIGauge } from "@/components/charts/dti-gauge";
import { formatCurrency, formatMonths } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Shield,
  Target,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Zap,
  Sparkles,
  Eye,
  EyeOff,
  Settings,
  GripVertical,
  X,
} from "lucide-react";
import type {
  MonthlySnapshot,
  DebtPayoffResult,
  GoalProjection,
  GoalInput,
  MilestoneEstimate,
  SavingsProjectionPoint,
} from "@/lib/engine/types";

interface WaterfallItem {
  name: string;
  amount: number;
  type: "income" | "expense" | "debt" | "surplus";
}

interface Props {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyDebtPayments: number;
  cashFlow: number;
  freeSurplus: number;
  totalContributions: number;
  netWorth: number;
  totalAssets: number;
  totalDebts: number;
  emergencyMonths: number;
  savingsRate: number;
  dtiRatio: number;
  projections1yr: MonthlySnapshot[];
  projections5yr: MonthlySnapshot[];
  debtPayoffs: DebtPayoffResult[];
  goalProjections: GoalProjection[];
  goals: GoalInput[];
  milestones: MilestoneEstimate[];
  savingsProjection: SavingsProjectionPoint[];
  waterfallItems: WaterfallItem[];
}

function StatCard({
  title, value, subtitle, icon: Icon, trend,
}: {
  title: string; value: string; subtitle: string; icon: React.ElementType; trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className="rounded-lg bg-muted p-1.5"><Icon className="h-3.5 w-3.5 text-muted-foreground" /></div>
        </div>
        <p className={`text-xl font-bold tracking-tight ${trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : ""}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

type DashboardSection = "projection" | "waterfall" | "dti" | "debtPayoff" | "goals" | "milestones" | "aiInsights";

const sectionLabels: Record<DashboardSection, string> = {
  projection: "Net Worth Projection",
  waterfall: "Cash Flow Waterfall",
  dti: "Debt-to-Income Ratio",
  debtPayoff: "Debt Payoff",
  goals: "Goal Progress",
  milestones: "Milestones",
  aiInsights: "AI Insights",
};

const defaultSections: DashboardSection[] = ["projection", "waterfall", "dti", "debtPayoff", "goals", "milestones", "aiInsights"];

function loadDashboardConfig(): { sections: DashboardSection[]; hidden: DashboardSection[] } {
  if (typeof window === "undefined") return { sections: defaultSections, hidden: [] };
  try {
    const saved = localStorage.getItem("dashboard-config");
    if (saved) return JSON.parse(saved);
  } catch {}
  return { sections: defaultSections, hidden: [] };
}

function saveDashboardConfig(config: { sections: DashboardSection[]; hidden: DashboardSection[] }) {
  try { localStorage.setItem("dashboard-config", JSON.stringify(config)); } catch {}
}

export function DashboardClient({
  monthlyIncome, monthlyExpenses, monthlyDebtPayments, cashFlow, freeSurplus, totalContributions, netWorth, totalAssets, totalDebts,
  emergencyMonths, savingsRate, dtiRatio, projections1yr, projections5yr, debtPayoffs,
  goalProjections, goals, milestones, savingsProjection, waterfallItems,
}: Props) {
  const [projectionRange, setProjectionRange] = useState<"1yr" | "5yr">("5yr");
  const [customizing, setCustomizing] = useState(false);
  const [config, setConfig] = useState(loadDashboardConfig);

  useEffect(() => { setConfig(loadDashboardConfig()); }, []);

  const projections = projectionRange === "1yr" ? projections1yr : projections5yr;
  const projectedNetWorth5yr = projections5yr[projections5yr.length - 1]?.netWorth ?? netWorth;

  const goalData = goalProjections.map((gp, i) => ({
    name: gp.goalName, currentAmount: goals[i]?.currentAmount ?? 0, targetAmount: goals[i]?.targetAmount ?? 0, onTrack: gp.onTrack,
  }));

  function toggleSection(section: DashboardSection) {
    const newConfig = { ...config };
    if (newConfig.hidden.includes(section)) {
      newConfig.hidden = newConfig.hidden.filter((s) => s !== section);
      if (!newConfig.sections.includes(section)) newConfig.sections.push(section);
    } else {
      newConfig.hidden.push(section);
    }
    setConfig(newConfig);
    saveDashboardConfig(newConfig);
  }

  function moveSection(section: DashboardSection, direction: -1 | 1) {
    const newSections = [...config.sections];
    const idx = newSections.indexOf(section);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= newSections.length) return;
    [newSections[idx], newSections[newIdx]] = [newSections[newIdx], newSections[idx]];
    const newConfig = { ...config, sections: newSections };
    setConfig(newConfig);
    saveDashboardConfig(newConfig);
  }

  const visibleSections = config.sections.filter((s) => !config.hidden.includes(s));

  function renderSection(section: DashboardSection) {
    switch (section) {
      case "projection":
        return (
          <Card key={section}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Net Worth Projection</CardTitle>
                <div className="flex gap-1">
                  {(["1yr", "5yr"] as const).map((r) => (
                    <button key={r} onClick={() => setProjectionRange(r)} className={`px-3 py-1 text-xs rounded-md transition-colors ${projectionRange === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                      {r === "1yr" ? "1 Year" : "5 Year"}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Projected: {formatCurrency(projectedNetWorth5yr)} in 5 years</p>
            </CardHeader>
            <CardContent>
              {projections.length > 0 ? <ProjectionChart data={projections} /> : <p className="text-muted-foreground text-center py-12">Add financial data to see projections</p>}
            </CardContent>
          </Card>
        );

      case "waterfall":
        return (
          <Card key={section}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monthly Cash Flow Waterfall</CardTitle>
              <p className="text-xs text-muted-foreground">How your income flows through expenses and debt payments</p>
            </CardHeader>
            <CardContent>
              {waterfallItems.length > 1 ? <WaterfallChart items={waterfallItems} /> : <p className="text-muted-foreground text-center py-12">Add income and expenses to see your cash flow</p>}
            </CardContent>
          </Card>
        );

      case "dti":
        return (
          <Card key={section}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Debt-to-Income Ratio</CardTitle>
              <p className="text-xs text-muted-foreground">
                {dtiRatio <= 36 ? "Lenders consider under 36% healthy" : dtiRatio <= 43 ? "Most lenders want under 43% for mortgage approval" : "Above 43% may limit borrowing options"}
              </p>
            </CardHeader>
            <CardContent className="flex justify-center">
              <DTIGauge ratio={dtiRatio} />
            </CardContent>
          </Card>
        );

      case "debtPayoff":
        return (
          <Card key={section}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" />Debt Payoff</CardTitle>
            </CardHeader>
            <CardContent>
              {debtPayoffs.length > 0 ? (
                <div className="space-y-3">
                  {debtPayoffs.map((dp) => (
                    <div key={dp.debtId} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{dp.debtName}</p>
                        <Badge variant={dp.monthsToPayoff <= 24 ? "default" : "secondary"} className="text-xs">{formatMonths(dp.monthsToPayoff)}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(dp.totalInterestPaid)} interest</span>
                        <span>{dp.payoffDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground text-center py-6 text-sm">No debts tracked</p>}
            </CardContent>
          </Card>
        );

      case "goals":
        return (
          <Card key={section}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" />Goal Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {goalData.length > 0 ? <MilestoneTimeline goals={goalData} /> : <p className="text-muted-foreground text-center py-6 text-sm">No goals set</p>}
            </CardContent>
          </Card>
        );

      case "milestones":
        return (
          <Card key={section}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" />Milestones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {milestones.map((m, i) => {
                const pct = m.targetValue > 0 ? Math.min(100, (m.currentValue / m.targetValue) * 100) : 0;
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">{m.name}</p>
                      <Badge variant={m.achievable ? "default" : "destructive"} className="text-[10px]">{m.achievable ? formatMonths(m.estimatedMonths) : "N/A"}</Badge>
                    </div>
                    {m.name !== "Debt Free" && <Progress value={pct} className="h-1.5" />}
                    <p className="text-[10px] text-muted-foreground">{m.achievable ? `Est. ${m.estimatedDate}` : "Not achievable at current rate"}</p>
                  </div>
                );
              })}
              {milestones.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Add data to see milestone estimates</p>}
            </CardContent>
          </Card>
        );

      case "aiInsights":
        return (
          <Card key={section} className="border-blue-200 bg-gradient-to-b from-blue-50/80 to-white dark:from-blue-950/20 dark:to-card dark:border-blue-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-blue-600" />AI Insights<Badge variant="secondary" className="text-[10px] ml-auto">Preview</Badge></CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cashFlow > 500 && <div className="flex gap-2 text-xs"><Zap className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" /><p>Strong {formatCurrency(cashFlow)}/mo surplus. Consider directing extra toward your highest-rate debt.</p></div>}
              {savingsRate < 20 && <div className="flex gap-2 text-xs"><Zap className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" /><p>Savings rate is {savingsRate}%. Aim for 20%+ to accelerate wealth building.</p></div>}
              {emergencyMonths < 6 && emergencyMonths !== Infinity && <div className="flex gap-2 text-xs"><Zap className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" /><p>Emergency fund covers {emergencyMonths} months. Build to 6 months before aggressive investing.</p></div>}
              {dtiRatio > 43 && <div className="flex gap-2 text-xs"><Zap className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" /><p>DTI ratio is {dtiRatio}% — above the 43% threshold. Reducing debt payments will improve borrowing capacity.</p></div>}
              <div className="pt-2 border-t"><p className="text-[10px] text-muted-foreground">Visit the AI Advisor for deeper analysis and to make changes via chat.</p></div>
            </CardContent>
          </Card>
        );
    }
  }

  return (
    <div className="space-y-6 pt-2 md:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your financial command center</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCustomizing(!customizing)}>
          <Settings className="h-3.5 w-3.5 mr-1.5" />
          {customizing ? "Done" : "Customize"}
        </Button>
      </div>

      {/* Customization Panel */}
      {customizing && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">Dashboard Sections</p>
            <div className="space-y-1.5">
              {defaultSections.map((section, idx) => {
                const isHidden = config.hidden.includes(section);
                return (
                  <div key={section} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isHidden ? "opacity-50 bg-muted/30" : "bg-muted/50"}`}>
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm flex-1">{sectionLabels[section]}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(section, -1)} disabled={idx === 0}>
                        <span className="text-xs">&#9650;</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(section, 1)} disabled={idx === config.sections.length - 1}>
                        <span className="text-xs">&#9660;</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleSection(section)}>
                        {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr_300px] items-start">
        {/* LEFT COLUMN: Stats */}
        <div className="space-y-3">
          <StatCard title="Net Worth" value={formatCurrency(netWorth)} subtitle={`${formatCurrency(totalAssets)} assets`} icon={TrendingUp} trend={netWorth >= 0 ? "up" : "down"} />
          <StatCard title="Monthly Income" value={formatCurrency(monthlyIncome)} subtitle="After taxes" icon={DollarSign} trend="up" />
          <StatCard title="Monthly Outflow" value={formatCurrency(monthlyExpenses + monthlyDebtPayments + totalContributions)} subtitle={`${formatCurrency(monthlyExpenses)} bills + ${formatCurrency(monthlyDebtPayments)} debt${totalContributions > 0 ? ` + ${formatCurrency(totalContributions)} invest` : ""}`} icon={ArrowDownRight} trend="down" />
          <StatCard title="Free Surplus" value={formatCurrency(freeSurplus)} subtitle={freeSurplus > 0 ? "After all commitments" : "Over-committed"} icon={ArrowUpRight} trend={freeSurplus >= 0 ? "up" : "down"} />
          <StatCard title="Savings Rate" value={`${savingsRate}%`} subtitle={savingsRate >= 20 ? "Excellent" : savingsRate >= 10 ? "Good" : "Needs work"} icon={PiggyBank} trend={savingsRate >= 20 ? "up" : savingsRate >= 10 ? "neutral" : "down"} />
          <StatCard title="Total Debt" value={formatCurrency(totalDebts)} subtitle={`${formatCurrency(monthlyDebtPayments)}/mo payments`} icon={CreditCard} trend="down" />
          <StatCard title="Emergency Fund" value={emergencyMonths === Infinity ? "N/A" : `${emergencyMonths} mo`} subtitle={emergencyMonths >= 6 ? "Fully funded" : emergencyMonths >= 3 ? "Building" : "Below 3mo target"} icon={Shield} trend={emergencyMonths >= 6 ? "up" : emergencyMonths >= 3 ? "neutral" : "down"} />
        </div>

        {/* CENTER COLUMN: Sections */}
        <div className="space-y-6">
          {visibleSections
            .filter((s) => !["milestones", "aiInsights", "dti"].includes(s))
            .map((section) => renderSection(section))}

          {/* Debt + Goals side by side when both visible */}
          {visibleSections.includes("debtPayoff") && visibleSections.includes("goals") ? null : null}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          {visibleSections.includes("dti") && renderSection("dti")}
          {visibleSections.includes("milestones") && renderSection("milestones")}
          {visibleSections.includes("aiInsights") && renderSection("aiInsights")}

          {/* Goal Tracker */}
          {goalProjections.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" />Goal Tracker</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {goalProjections.map((gp) => (
                  <div key={gp.goalId} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">{gp.goalName}</p>
                      <Badge variant={gp.onTrack ? "default" : "destructive"} className="text-[10px]">{gp.onTrack ? "On Track" : "Behind"}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Need {formatCurrency(gp.monthlySavingsNeeded)}/mo{gp.estimatedDate !== "Never" && ` \u2022 Est. ${gp.estimatedDate}`}</p>
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
