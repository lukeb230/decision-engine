"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Pencil,
  Trash2,
  Target,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
  CreditCard,
  Landmark,
  PiggyBank,
} from "lucide-react";
import { formatCurrency, formatMonths } from "@/lib/utils";
import type { GoalProjection, DebtPayoffResult, DebtInput } from "@/lib/engine/types";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: number;
  type: string;
}

interface Props {
  items: Goal[];
  projections: GoalProjection[];
  cashFlow: number;
  debtPayoffs: DebtPayoffResult[];
  debts: DebtInput[];
}

const goalTypes = [
  { value: "emergency_fund", label: "Emergency Fund", icon: Shield },
  { value: "net_worth", label: "Net Worth Target", icon: TrendingUp },
  { value: "retirement", label: "Retirement", icon: Landmark },
  { value: "purchase", label: "Savings for Purchase", icon: PiggyBank },
  { value: "debt_free", label: "Pay Off Debt", icon: CreditCard },
  { value: "custom", label: "Custom Goal", icon: Target },
];

function typeLabel(type: string): string {
  return goalTypes.find((t) => t.value === type)?.label ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function typeIcon(type: string) {
  return goalTypes.find((t) => t.value === type)?.icon ?? Target;
}

export function GoalsClient({ items, projections, cashFlow, debtPayoffs, debts }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState({
    name: "", targetAmount: "", currentAmount: "0", targetDate: "", priority: "1", type: "custom",
  });

  const onTrackCount = projections.filter((p) => p.onTrack).length;
  const behindCount = projections.filter((p) => !p.onTrack).length;

  function openNew() {
    setEditing(null);
    setForm({ name: "", targetAmount: "", currentAmount: "0", targetDate: "", priority: "1", type: "custom" });
    setOpen(true);
  }

  function openEdit(item: Goal) {
    setEditing(item);
    setForm({
      name: item.name,
      targetAmount: String(item.targetAmount),
      currentAmount: String(item.currentAmount),
      targetDate: new Date(item.targetDate).toISOString().split("T")[0],
      priority: String(item.priority),
      type: item.type,
    });
    setOpen(true);
  }

  async function handleSave() {
    const data = {
      name: form.name,
      targetAmount: parseFloat(form.targetAmount),
      currentAmount: parseFloat(form.currentAmount),
      targetDate: new Date(form.targetDate).toISOString(),
      priority: parseInt(form.priority),
      type: form.type,
    };
    if (editing) {
      await fetch("/api/goals", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, ...data }) });
    } else {
      await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    }
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6 pt-2 md:pt-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {items.length} goal{items.length !== 1 ? "s" : ""} tracked
            {onTrackCount > 0 && <span className="text-emerald-600"> \u00b7 {onTrackCount} on track</span>}
            {behindCount > 0 && <span className="text-amber-500"> \u00b7 {behindCount} behind</span>}
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Add Goal
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Add"} Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v: string | null) => { if (v) setForm({ ...form, type: v }); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {goalTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Goal Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={form.type === "debt_free" ? "e.g. Pay off Audi loan" : "e.g. 25K Emergency Fund"} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{form.type === "debt_free" ? "Debt Balance ($)" : "Target Amount ($)"}</Label>
                  <Input type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} placeholder={form.type === "debt_free" ? "15000" : "25000"} />
                </div>
                <div>
                  <Label>{form.type === "debt_free" ? "Amount Paid ($)" : "Current Progress ($)"}</Label>
                  <Input type="number" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div>
                <Label>Target Date</Label>
                <Input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
              </div>
              <div>
                <Label>Priority (1 = highest)</Label>
                <Input type="number" min="1" max="10" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={!form.name || !form.targetAmount || !form.targetDate}>
                {editing ? "Update" : "Add"} Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{onTrackCount}</p>
                <p className="text-xs text-muted-foreground">On Track</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{behindCount}</p>
                <p className="text-xs text-muted-foreground">Needs Attention</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(cashFlow)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <p className="text-xs text-muted-foreground">Available for Goals</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goal Cards */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="text-center text-muted-foreground py-16">
            <Target className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="font-medium mb-1">No goals yet</p>
            <p className="text-sm mb-4">Set financial targets to track your progress toward life milestones.</p>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" /> Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, idx) => {
            const proj = projections[idx];
            const pct = Math.min(100, (item.currentAmount / item.targetAmount) * 100);
            const remaining = item.targetAmount - item.currentAmount;
            const daysLeft = Math.max(0, Math.ceil((new Date(item.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            const Icon = typeIcon(item.type);
            const isDebtGoal = item.type === "debt_free";

            return (
              <Card key={item.id} className={`relative overflow-hidden ${proj?.onTrack ? "" : "border-amber-200 dark:border-amber-900"}`}>
                {/* Status indicator strip */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${proj?.onTrack ? "bg-emerald-500" : "bg-amber-500"}`} />

                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-lg p-1.5 ${proj?.onTrack ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                        <Icon className={`h-4 w-4 ${proj?.onTrack ? "text-emerald-600" : "text-amber-600"}`} />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{item.name}</CardTitle>
                        <Badge variant="outline" className="text-[10px] mt-0.5">{typeLabel(item.type)}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium">{formatCurrency(item.currentAmount)}</span>
                      <span className="text-muted-foreground">{formatCurrency(item.targetAmount)}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}% complete</span>
                      <span className="text-[10px] text-muted-foreground">{formatCurrency(remaining)} left</span>
                    </div>
                  </div>

                  {/* Projection details */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Target
                      </div>
                      <span className="text-xs font-medium">{new Date(item.targetDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                    </div>

                    {proj && (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Est. Completion
                          </div>
                          <span className="text-xs font-medium">{proj.estimatedDate === "Never" ? "Not achievable" : proj.estimatedDate}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            Monthly Needed
                          </div>
                          <span className="text-xs font-medium">{formatCurrency(proj.monthlySavingsNeeded)}/mo</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Target className="h-3 w-3" />
                            Status
                          </div>
                          <Badge variant={proj.onTrack ? "default" : "destructive"} className="text-[10px]">
                            {proj.onTrack ? "On Track" : `${daysLeft > 0 ? "Behind Schedule" : "Past Due"}`}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Time remaining */}
                  <div className="text-center">
                    <p className="text-lg font-bold">{daysLeft > 0 ? daysLeft : 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Days Remaining</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
