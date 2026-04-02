"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatPercent, formatMonths } from "@/lib/utils";
import { calculateDebtPayoff } from "@/lib/engine/calculator";

interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  type: string;
}

const debtTypes = ["mortgage", "student", "credit", "auto", "personal"];

export function DebtsClient({ items }: { items: Debt[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [form, setForm] = useState({
    name: "", balance: "", interestRate: "", minimumPayment: "", type: "personal",
  });

  const totalBalance = items.reduce((sum, d) => sum + d.balance, 0);
  const totalPayments = items.reduce((sum, d) => sum + d.minimumPayment, 0);

  function openNew() {
    setEditing(null);
    setForm({ name: "", balance: "", interestRate: "", minimumPayment: "", type: "personal" });
    setOpen(true);
  }

  function openEdit(item: Debt) {
    setEditing(item);
    setForm({
      name: item.name,
      balance: String(item.balance),
      interestRate: String(item.interestRate),
      minimumPayment: String(item.minimumPayment),
      type: item.type,
    });
    setOpen(true);
  }

  async function handleSave() {
    const data = {
      name: form.name,
      balance: parseFloat(form.balance),
      interestRate: parseFloat(form.interestRate),
      minimumPayment: parseFloat(form.minimumPayment),
      type: form.type,
    };
    if (editing) {
      await fetch("/api/debts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...data }),
      });
    } else {
      await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/debts?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6 pt-2 md:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Debts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Total: {formatCurrency(totalBalance)} balance, {formatCurrency(totalPayments)}/mo payments
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Add Debt
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Add"} Debt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Student Loan" />
              </div>
              <div>
                <Label>Balance ($)</Label>
                <Input type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} placeholder="22000" />
              </div>
              <div>
                <Label>Interest Rate (%)</Label>
                <Input type="number" step="0.1" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} placeholder="5.5" />
              </div>
              <div>
                <Label>Minimum Payment ($/mo)</Label>
                <Input type="number" value={form.minimumPayment} onChange={(e) => setForm({ ...form, minimumPayment: e.target.value })} placeholder="350" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v: string | null) => { if (v) setForm({ ...form, type: v }); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {debtTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={!form.name || !form.balance || !form.interestRate || !form.minimumPayment}>
                {editing ? "Update" : "Add"} Debt
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Min Payment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Payoff</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No debts tracked. Click "Add Debt" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const payoff = calculateDebtPayoff(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-red-500">{formatCurrency(item.balance)}</TableCell>
                      <TableCell>{formatPercent(item.interestRate)}</TableCell>
                      <TableCell>{formatCurrency(item.minimumPayment)}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{item.type}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={payoff.monthsToPayoff <= 24 ? "default" : "secondary"}>
                          {formatMonths(payoff.monthsToPayoff)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
