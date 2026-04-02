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
import { Plus, Trash2, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { compareScenarios } from "@/lib/engine/scenarios";
import type { FinancialState, ScenarioChangeInput } from "@/lib/engine/types";

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

  const allEntities = useMemo(() => {
    const map: Record<string, { id: string; name: string; type: EntityType }[]> = {
      income: financialState.incomes.map((i) => ({ id: i.id, name: i.name, type: "income" as EntityType })),
      expense: financialState.expenses.map((e) => ({ id: e.id, name: e.name, type: "expense" as EntityType })),
      debt: financialState.debts.map((d) => ({ id: d.id, name: d.name, type: "debt" as EntityType })),
      asset: financialState.assets.map((a) => ({ id: a.id, name: a.name, type: "asset" as EntityType })),
    };
    return map;
  }, [financialState]);

  const comparison = useMemo(() => {
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
  }

  function removeChange(index: number) {
    setChanges(changes.filter((_, i) => i !== index));
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
    router.refresh();
  }

  function entityName(entityType: string, entityId: string): string {
    const list = allEntities[entityType];
    return list?.find((e) => e.id === entityId)?.name ?? entityId;
  }

  return (
    <div className="space-y-6 pt-2 md:pt-0">
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
        <Button onClick={handleSave}>Save Changes</Button>
      </div>

      {/* Impact Summary */}
      {comparison && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cash Flow Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${comparison.cashFlowDifference >= 0 ? "text-green-600" : "text-red-500"}`}>
                {comparison.cashFlowDifference >= 0 ? "+" : ""}{formatCurrency(comparison.cashFlowDifference)}/mo
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(comparison.baselineCashFlow)} → {formatCurrency(comparison.scenarioCashFlow)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net Worth (Now)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${comparison.netWorthDifference >= 0 ? "text-green-600" : "text-red-500"}`}>
                {comparison.netWorthDifference >= 0 ? "+" : ""}{formatCurrency(comparison.netWorthDifference)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">5yr Net Worth</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const baseLast = comparison.baselineProjections[comparison.baselineProjections.length - 1];
                const scenLast = comparison.scenarioProjections[comparison.scenarioProjections.length - 1];
                const diff = scenLast.netWorth - baseLast.netWorth;
                return (
                  <>
                    <p className={`text-2xl font-bold ${diff >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {diff >= 0 ? "+" : ""}{formatCurrency(diff)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(baseLast.netWorth)} → {formatCurrency(scenLast.netWorth)}
                    </p>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparison Chart */}
      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle>Net Worth: Baseline vs {scenario.name}</CardTitle>
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

      {/* Changes List */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Changes ({changes.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {changes.map((c, i) => (
            <div key={i} className="flex items-center justify-between border rounded-lg p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  <Badge variant="secondary" className="mr-2 capitalize">{c.entityType}</Badge>
                  {entityName(c.entityType, c.entityId)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.field}: {c.oldValue} → <span className="font-medium text-foreground">{c.newValue}</span>
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeChange(i)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}

          <Separator />

          {/* Add new change */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Add a Change</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Entity Type</Label>
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
                <Label className="text-xs">Entity</Label>
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
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">New Value</Label>
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
