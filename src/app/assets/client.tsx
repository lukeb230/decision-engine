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
import { formatCurrency, formatPercent } from "@/lib/utils";
import { calculateInvestmentGrowth } from "@/lib/engine/calculator";

interface Asset {
  id: string;
  name: string;
  value: number;
  type: string;
  growthRate: number;
}

const assetTypes = ["savings", "investment", "property", "vehicle", "other"];

export function AssetsClient({ items }: { items: Asset[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [form, setForm] = useState({ name: "", value: "", type: "savings", growthRate: "0" });

  const totalValue = items.reduce((sum, a) => sum + a.value, 0);

  function openNew() {
    setEditing(null);
    setForm({ name: "", value: "", type: "savings", growthRate: "0" });
    setOpen(true);
  }

  function openEdit(item: Asset) {
    setEditing(item);
    setForm({
      name: item.name,
      value: String(item.value),
      type: item.type,
      growthRate: String(item.growthRate),
    });
    setOpen(true);
  }

  async function handleSave() {
    const data = {
      name: form.name,
      value: parseFloat(form.value),
      type: form.type,
      growthRate: parseFloat(form.growthRate),
    };
    if (editing) {
      await fetch("/api/assets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...data }),
      });
    } else {
      await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/assets?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6 pt-2 md:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Total value: {formatCurrency(totalValue)}
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Add Asset
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Add"} Asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Savings Account" />
              </div>
              <div>
                <Label>Current Value ($)</Label>
                <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="12000" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v: string | null) => { if (v) setForm({ ...form, type: v }); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {assetTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Annual Growth Rate (%)</Label>
                <Input type="number" step="0.1" value={form.growthRate} onChange={(e) => setForm({ ...form, growthRate: e.target.value })} placeholder="7" />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={!form.name || !form.value}>
                {editing ? "Update" : "Add"} Asset
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
                <TableHead>Value</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Growth Rate</TableHead>
                <TableHead>5yr Projection</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No assets tracked. Click "Add Asset" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const projected = calculateInvestmentGrowth(item.value, 0, item.growthRate, 5);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(item.value)}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{item.type}</Badge></TableCell>
                      <TableCell>{formatPercent(item.growthRate)}</TableCell>
                      <TableCell className="text-blue-600">{formatCurrency(projected)}</TableCell>
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
