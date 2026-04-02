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
import { Plus, Pencil, Trash2, Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: number;
  type: string;
}

const goalTypes = ["emergency_fund", "retirement", "purchase", "debt_free", "custom"];

function typeLabel(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function GoalsClient({ items }: { items: Goal[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "0",
    targetDate: "",
    priority: "1",
    type: "custom",
  });

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
      await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...data }),
      });
    } else {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {items.length} goal{items.length !== 1 ? "s" : ""} tracked
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
                <Label>Goal Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Emergency Fund" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Target Amount ($)</Label>
                  <Input type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} placeholder="15000" />
                </div>
                <div>
                  <Label>Current Amount ($)</Label>
                  <Input type="number" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} placeholder="5000" />
                </div>
              </div>
              <div>
                <Label>Target Date</Label>
                <Input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority (1 = highest)</Label>
                  <Input type="number" min="1" max="10" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v: string | null) => { if (v) setForm({ ...form, type: v }); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {goalTypes.map((t) => (
                        <SelectItem key={t} value={t}>{typeLabel(t)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={!form.name || !form.targetAmount || !form.targetDate}>
                {editing ? "Update" : "Add"} Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center text-muted-foreground py-12">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No goals set. Click "Add Goal" to start tracking.</p>
            </CardContent>
          </Card>
        ) : (
          items.map((item) => {
            const pct = Math.min(100, (item.currentAmount / item.targetAmount) * 100);
            const remaining = item.targetAmount - item.currentAmount;
            const daysLeft = Math.max(0, Math.ceil((new Date(item.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            return (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {typeLabel(item.type)}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{formatCurrency(item.currentAmount)}</span>
                      <span className="text-muted-foreground">{formatCurrency(item.targetAmount)}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{pct.toFixed(0)}% complete</p>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(remaining)} remaining</span>
                    <span>{daysLeft} days left</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
