"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ComparisonChart } from "@/components/charts/comparison-chart";
import {
  Plus,
  Trash2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Target,
  CreditCard,
  Save,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { formatCurrency, formatMonths } from "@/lib/utils";
import { compareScenarios } from "@/lib/engine/scenarios";
import type { FinancialState, ScenarioChangeInput, ScenarioComparison } from "@/lib/engine/types";

interface ScenarioChange {
  id: string;
  entityType: string;
  entityId: string;
  field: string;
  oldValue: string;
  newValue: string;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  isBaseline: boolean;
  changes: ScenarioChange[];
}

interface Props {
  scenario: Scenario;
  financialState: FinancialState;
}

type EntityType = "income" | "expense" | "debt" | "asset";

const entityFields: Record<EntityType, string[]> = {
  income: ["amount", "taxRate"],
  expense: ["amount"],
  debt: ["balance", "interestRate", "minimumPayment"],
  asset: ["value", "growthRate"],
};

const fieldLabels: Record<string, string> = {
  amount: "Amount",
  taxRate: "Tax Rate (%)",
  balance: "Balance",
  interestRate: "Interest Rate (%)",
  minimumPayment: "Monthly Payment",
  value: "Value",
  growthRate: "Growth Rate (%)",
};

function DiffBadge({ value, suffix = "" }: { value: number; suffix?: string }) {
  if (Math.abs(value) < 0.5) return <Badge variant="secondary" className="text-xs"><Minus className="h-3 w-3 mr-1" />No change</Badge>;
  const positive = value > 0;
  return (
    <Badge variant={positive ? "default" : "destructive"} className="text-xs">
      {positive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
      {positive ? "+" : ""}{typeof value === "number" && Math.abs(value) >= 1 ? Math.round(value).toLocaleString() : value}{suffix}
    </Badge>
  );
}

function ImpactCard({
  title,
  icon: Icon,
  baseline,
  scenario,
  difference,
  format = "currency",
}: {
  title: string;
  icon: React.ElementType;
  baseline: number;
  scenario: number;
  difference: number;
  format?: "currency" | "months" | "percent";
}) {
  const fmt = (v: number) => {
    if (format === "months") return formatMonths(v);
    if (format === "percent") return `${v.toFixed(1)}%`;
    return formatCurrency(v);
  };
  const positive = difference > 0;
  const isNeutral = Math.abs(difference) < 0.5;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className={`text-xl font-bold ${isNeutral ? "" : positive ? "text-emerald-600" : "text-red-500"}`}>
          {isNeutral ? fmt(scenario) : `${positive ? "+" : ""}${format === "currency" ? formatCurrency(difference) : format === "months" ? `${difference > 0 ? "-" : "+"}${formatMonths(Math.abs(difference))}` : `${difference > 0 ? "+" : ""}${difference.toFixed(1)}%`}`}
          {format === "currency" && !isNeutral && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {fmt(baseline)} → {fmt(scenario)}
        </p>
      </CardContent>
    </Card>
  );
}

export function ScenarioDetailClient({ scenario, financialState }: Props) {
  const router = useRouter();
  const [changes, setChanges] = useState<ScenarioChangeInput[]>(
    scenario.changes.map((c) => ({
      entityType: c.entityType,
      entityId: c.entityId,
      field: c.field,
      oldValue: c.oldValue,
      newValue: c.newValue,
    }))
  );
  const [newChange, setNewChange] = useState({
    entityType: "income" as EntityType,
    entityId: "",
    field: "",
    newValue: "",
  });
  const [saved, setSaved] = useState(true);

  const allEntities = useMemo(() => ({
    income: financialState.incomes.map((i) => ({ id: i.id, name: i.name })),
    expense: financialState.expenses.map((e) => ({ id: e.id, name: e.name })),
    debt: financialState.debts.map((d) => ({ id: d.id, name: d.name })),
    asset: financialState.assets.map((a) => ({ id: a.id, name: a.name })),
  }), [financialState]);

  const comparison: ScenarioComparison | null = useMemo(() => {
    if (changes.length === 0) return null;
    return compareScenarios(financialState, changes, 60);
  }, [financialState, changes]);

  function getOldValue(entityType: string, entityId: string, field: string): string {
    const collection = financialState[(entityType + "s") as keyof FinancialState] as unknown as Array<Record<string, unknown>>;
    const entity = collection?.find((e) => e.id === entityId);
    return entity ? String(entity[field] ?? "") : "";
  }

  function addChange() {
    const oldValue = getOldValue(newChange.entityType, newChange.entityId, newChange.field);
    setChanges([...changes, {
      entityType: newChange.entityType,
      entityId: newChange.entityId,
      field: newChange.field,
      oldValue,
      newValue: newChange.newValue,
    }]);
    setNewChange({ entityType: "income", entityId: "", field: "", newValue: "" });
    setSaved(false);
  }

  function removeChange(index: number) {
    setChanges(changes.filter((_, i) => i !== index));
    setSaved(false);
  }

  async function handleSave() {
    await fetch("/api/scenarios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: scenario.id,
        changes: changes.map((c) => ({
          entityType: c.entityType,
          entityId: c.entityId,
          field: c.field,
          oldValue: c.oldValue,
          newValue: c.newValue,
        })),
      }),
    });
    setSaved(true);
    router.refresh();
  }

  function entityName(entityType: string, entityId: string): string {
    const list = allEntities[entityType as EntityType];
    return list?.find((e) => e.id === entityId)?.name ?? entityId;
  }

  return (
    <div className="space-y-6 pt-2 md:pt-0">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/scenarios">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{scenario.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {scenario.description || "Configure changes and see the impact vs your baseline"}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saved}>
          <Save className="h-4 w-4 mr-2" />
          {saved ? "Saved" : "Save Changes"}
        </Button>
      </div>

      {/* Summary Banner */}
      {comparison && (
        <Card className={`border-l-4 ${comparison.cashFlowDifference >= 0 ? "border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10" : "border-l-red-500 bg-red-50/30 dark:bg-red-950/10"}`}>
          <CardContent className="py-3 px-4">
            <div className="flex items-start gap-2">
              <Zap className={`h-4 w-4 mt-0.5 flex-shrink-0 ${comparison.cashFlowDifference >= 0 ? "text-emerald-600" : "text-red-500"}`} />
              <p className="text-sm">{comparison.summaryText}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Impact Cards */}
      {comparison && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ImpactCard
            title="Cash Flow"
            icon={DollarSign}
            baseline={comparison.baselineCashFlow}
            scenario={comparison.scenarioCashFlow}
            difference={comparison.cashFlowDifference}
          />
          <ImpactCard
            title="Investable Surplus"
            icon={TrendingUp}
            baseline={comparison.baselineInvestableSurplus}
            scenario={comparison.scenarioInvestableSurplus}
            difference={comparison.investableSurplusDifference}
          />
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Worth Now</p>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className={`text-xl font-bold ${comparison.netWorthDifference >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {comparison.netWorthDifference >= 0 ? "+" : ""}{formatCurrency(comparison.netWorthDifference)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(comparison.baselineNetWorth)} → {formatCurrency(comparison.scenarioNetWorth)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">5yr Net Worth</p>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              {(() => {
                const tf = comparison.netWorthAtTimeframes.find((t) => t.months === 60);
                if (!tf) return null;
                return (
                  <>
                    <p className={`text-xl font-bold ${tf.difference >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {tf.difference >= 0 ? "+" : ""}{formatCurrency(tf.difference)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(tf.baseline)} → {formatCurrency(tf.scenario)}
                    </p>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Net Worth at Timeframes */}
      {comparison && comparison.netWorthAtTimeframes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Net Worth Impact Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {comparison.netWorthAtTimeframes.map((tf) => (
                <div key={tf.label} className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">{tf.label}</p>
                  <p className={`text-lg font-bold ${tf.difference >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {tf.difference >= 0 ? "+" : ""}{formatCurrency(tf.difference)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatCurrency(tf.baseline)} → {formatCurrency(tf.scenario)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Chart */}
      {comparison && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Net Worth: Baseline vs {scenario.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonChart
              baselineData={comparison.baselineProjections}
              scenarioData={comparison.scenarioProjections}
              scenarioName={scenario.name}
            />
          </CardContent>
        </Card>
      )}

      {/* Debt & Goal Comparisons */}
      {comparison && (comparison.debtComparisons.length > 0 || comparison.goalComparisons.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Debt Payoff Comparison */}
          {comparison.debtComparisons.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Debt Payoff Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {comparison.debtComparisons.map((dc) => (
                  <div key={dc.debtId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{dc.debtName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatMonths(dc.baselineMonths)} → {formatMonths(dc.scenarioMonths)}
                      </p>
                    </div>
                    <div className="text-right">
                      <DiffBadge value={dc.monthsSaved} suffix=" mo faster" />
                      {dc.interestSaved !== 0 && (
                        <p className={`text-xs mt-1 ${dc.interestSaved > 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {dc.interestSaved > 0 ? "Save" : "Cost"} {formatCurrency(Math.abs(dc.interestSaved))} interest
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Goal Completion Comparison */}
          {comparison.goalComparisons.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Goal Timeline Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {comparison.goalComparisons.map((gc) => (
                  <div key={gc.goalId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{gc.goalName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatMonths(gc.baselineMonths)} → {formatMonths(gc.scenarioMonths)}
                      </p>
                    </div>
                    <Badge variant={gc.accelerated ? "default" : gc.monthsChanged < 0 ? "destructive" : "secondary"} className="text-xs">
                      {gc.monthsChanged === 0
                        ? "No change"
                        : gc.accelerated
                        ? `${gc.monthsChanged} mo faster`
                        : `${Math.abs(gc.monthsChanged)} mo delayed`}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Changes Editor */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Scenario Changes ({changes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing changes */}
          {changes.length > 0 && (
            <div className="space-y-2">
              {changes.map((c, i) => (
                <div key={i} className="flex items-center justify-between border rounded-lg p-3 group">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      <Badge variant="secondary" className="mr-2 capitalize text-xs">{c.entityType}</Badge>
                      {entityName(c.entityType, c.entityId)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fieldLabels[c.field] || c.field}: <span className="line-through">{c.oldValue}</span> → <span className="font-medium text-foreground">{c.newValue}</span>
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeChange(i)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {changes.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">No changes yet. Add a change below to start modeling.</p>
            </div>
          )}

          <Separator />

          {/* Add new change */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Add a Change</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={newChange.entityType} onValueChange={(v: string | null) => { if (v) setNewChange({ ...newChange, entityType: v as EntityType, entityId: "", field: "" }); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="debt">Debt</SelectItem>
                    <SelectItem value="asset">Asset</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Item</Label>
                <Select value={newChange.entityId} onValueChange={(v: string | null) => { if (v) setNewChange({ ...newChange, entityId: v }); }}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {(allEntities[newChange.entityType] || []).map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Field</Label>
                <Select value={newChange.field} onValueChange={(v: string | null) => { if (v) setNewChange({ ...newChange, field: v }); }}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {(entityFields[newChange.entityType] || []).map((f) => (
                      <SelectItem key={f} value={f}>{fieldLabels[f] || f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">
                  New Value
                  {newChange.entityId && newChange.field && (
                    <span className="text-muted-foreground ml-1">
                      (was {getOldValue(newChange.entityType, newChange.entityId, newChange.field)})
                    </span>
                  )}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={newChange.newValue}
                    onChange={(e) => setNewChange({ ...newChange, newValue: e.target.value })}
                    placeholder="Value"
                  />
                  <Button
                    size="icon"
                    onClick={addChange}
                    disabled={!newChange.entityId || !newChange.field || !newChange.newValue}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
