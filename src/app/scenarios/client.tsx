"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GitBranch, ArrowRight, Star } from "lucide-react";

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
  createdAt: string;
}

export function ScenariosClient({ scenarios }: { scenarios: Scenario[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  async function handleCreate() {
    await fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, description: form.description, isBaseline: false }),
    });
    setOpen(false);
    setForm({ name: "", description: "" });
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/scenarios?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  const baseline = scenarios.find((s) => s.isBaseline);
  const others = scenarios.filter((s) => !s.isBaseline);

  return (
    <div className="space-y-6 pt-2 md:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scenarios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Model what-if changes and compare against your baseline
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Scenario
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Scenario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Salary Raise to $95K"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What changes does this scenario model?"
                />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!form.name}>
                Create Scenario
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Baseline */}
      {baseline && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">{baseline.name}</CardTitle>
                <Badge>Baseline</Badge>
              </div>
              <Link href={`/scenarios/${baseline.id}`}>
                <Button variant="outline" size="sm">
                  View <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {baseline.description || "Your current financial state — all scenarios are compared against this."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Other scenarios */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {others.length === 0 && !baseline ? (
          <Card className="col-span-full">
            <CardContent className="text-center text-muted-foreground py-12">
              <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No scenarios yet. Create one to start modeling what-if changes.</p>
            </CardContent>
          </Card>
        ) : others.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center text-muted-foreground py-8">
              <p>No alternative scenarios. Click "New Scenario" to create one.</p>
            </CardContent>
          </Card>
        ) : (
          others.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{s.name}</CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {s.description || "No description"}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{s.changes.length} change{s.changes.length !== 1 ? "s" : ""}</Badge>
                  <Link href={`/scenarios/${s.id}`}>
                    <Button variant="outline" size="sm">
                      Edit & Compare <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
