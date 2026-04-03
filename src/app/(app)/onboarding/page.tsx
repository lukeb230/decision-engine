"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  DollarSign,
  CreditCard,
  Landmark,
  Target,
  Check,
  Sparkles,
  Receipt,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IncomeEntry {
  name: string;
  amount: number;
  frequency: string;
  taxRate: number;
}

interface ExpenseEntry {
  name: string;
  amount: number;
  category: string;
  frequency: string;
  isFixed: boolean;
}

interface DebtEntry {
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  type: string;
}

interface AssetEntry {
  name: string;
  value: number;
  type: string;
  growthRate: number;
  monthlyContribution: number;
}

interface GoalEntry {
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  type: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = [
  { label: "Welcome", icon: Sparkles },
  { label: "Income", icon: DollarSign },
  { label: "Expenses", icon: Receipt },
  { label: "Debts", icon: CreditCard },
  { label: "Assets", icon: Landmark },
  { label: "Goals", icon: Target },
  { label: "Complete", icon: Check },
];

const EXPENSE_SUGGESTIONS = [
  { name: "Rent/Mortgage", category: "housing", amount: 1500, isFixed: true },
  { name: "Utilities", category: "utilities", amount: 200, isFixed: true },
  { name: "Groceries", category: "food", amount: 400, isFixed: false },
  { name: "Insurance", category: "insurance", amount: 300, isFixed: true },
  { name: "Subscriptions", category: "subscriptions", amount: 50, isFixed: true },
  { name: "Dining Out", category: "food", amount: 150, isFixed: false },
  { name: "Gas/Transport", category: "transport", amount: 200, isFixed: false },
];

const DEBT_TYPES = ["mortgage", "student", "credit", "auto", "personal"];
const ASSET_TYPES = ["savings", "investment", "property", "vehicle", "other"];
const GOAL_TYPES = [
  { value: "emergency_fund", label: "Emergency Fund" },
  { value: "net_worth", label: "Net Worth Target" },
  { value: "retirement", label: "Retirement" },
  { value: "purchase", label: "Savings for Purchase" },
  { value: "debt_free", label: "Pay Off Debt" },
  { value: "custom", label: "Custom Goal" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Data state
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [debts, setDebts] = useState<DebtEntry[]>([]);
  const [assets, setAssets] = useState<AssetEntry[]>([]);
  const [goals, setGoals] = useState<GoalEntry[]>([]);

  // Form state per step
  const [incomeForm, setIncomeForm] = useState({
    name: "",
    amount: "",
    frequency: "monthly",
    taxRate: "22",
  });
  const [expenseForm, setExpenseForm] = useState({
    name: "",
    amount: "",
    category: "other",
    isFixed: true,
  });
  const [debtForm, setDebtForm] = useState({
    name: "",
    balance: "",
    interestRate: "",
    minimumPayment: "",
    type: "personal",
  });
  const [assetForm, setAssetForm] = useState({
    name: "",
    value: "",
    type: "savings",
    growthRate: "0",
    monthlyContribution: "0",
  });
  const [goalForm, setGoalForm] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "0",
    targetDate: "",
    type: "custom",
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function toMonthly(amount: number, frequency: string): number {
    switch (frequency) {
      case "annual":
        return amount / 12;
      case "biweekly":
        return (amount * 26) / 12;
      case "weekly":
        return (amount * 52) / 12;
      default:
        return amount;
    }
  }

  function capitalize(s: string): string {
    return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // ---------------------------------------------------------------------------
  // Add handlers
  // ---------------------------------------------------------------------------

  function addIncome() {
    if (!incomeForm.name || !incomeForm.amount) return;
    setIncomes((prev) => [
      ...prev,
      {
        name: incomeForm.name,
        amount: parseFloat(incomeForm.amount),
        frequency: incomeForm.frequency,
        taxRate: parseFloat(incomeForm.taxRate),
      },
    ]);
    setIncomeForm({ name: "", amount: "", frequency: "monthly", taxRate: "22" });
  }

  function addExpense(suggestion?: (typeof EXPENSE_SUGGESTIONS)[number]) {
    if (suggestion) {
      setExpenses((prev) => [
        ...prev,
        {
          name: suggestion.name,
          amount: suggestion.amount,
          category: suggestion.category,
          frequency: "monthly",
          isFixed: suggestion.isFixed,
        },
      ]);
      return;
    }
    if (!expenseForm.name || !expenseForm.amount) return;
    setExpenses((prev) => [
      ...prev,
      {
        name: expenseForm.name,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        frequency: "monthly",
        isFixed: expenseForm.isFixed,
      },
    ]);
    setExpenseForm({ name: "", amount: "", category: "other", isFixed: true });
  }

  function addDebt() {
    if (!debtForm.name || !debtForm.balance) return;
    setDebts((prev) => [
      ...prev,
      {
        name: debtForm.name,
        balance: parseFloat(debtForm.balance),
        interestRate: parseFloat(debtForm.interestRate) || 0,
        minimumPayment: parseFloat(debtForm.minimumPayment) || 0,
        type: debtForm.type,
      },
    ]);
    setDebtForm({
      name: "",
      balance: "",
      interestRate: "",
      minimumPayment: "",
      type: "personal",
    });
  }

  function addAsset() {
    if (!assetForm.name || !assetForm.value) return;
    setAssets((prev) => [
      ...prev,
      {
        name: assetForm.name,
        value: parseFloat(assetForm.value),
        type: assetForm.type,
        growthRate: parseFloat(assetForm.growthRate) || 0,
        monthlyContribution: parseFloat(assetForm.monthlyContribution) || 0,
      },
    ]);
    setAssetForm({
      name: "",
      value: "",
      type: "savings",
      growthRate: "0",
      monthlyContribution: "0",
    });
  }

  function addGoal() {
    if (!goalForm.name || !goalForm.targetAmount) return;
    setGoals((prev) => [
      ...prev,
      {
        name: goalForm.name,
        targetAmount: parseFloat(goalForm.targetAmount),
        currentAmount: parseFloat(goalForm.currentAmount) || 0,
        targetDate: goalForm.targetDate,
        type: goalForm.type,
      },
    ]);
    setGoalForm({
      name: "",
      targetAmount: "",
      currentAmount: "0",
      targetDate: "",
      type: "custom",
    });
  }

  // ---------------------------------------------------------------------------
  // Save all and redirect
  // ---------------------------------------------------------------------------

  async function handleFinish() {
    setSaving(true);
    try {
      for (const item of incomes) {
        await fetch("/api/income", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }
      for (const item of expenses) {
        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }
      for (const item of debts) {
        await fetch("/api/debts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }
      for (const item of assets) {
        await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }
      for (const item of goals) {
        await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }
      router.push("/");
    } catch {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Progress
  // ---------------------------------------------------------------------------

  const progressPercent = Math.round((step / (STEPS.length - 1)) * 100);

  // ---------------------------------------------------------------------------
  // Step renderers
  // ---------------------------------------------------------------------------

  function renderWelcome() {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-2">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">
          Let&apos;s set up your financial profile
        </h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          We&apos;ll walk you through adding your income, expenses, debts,
          assets, and goals. You can always edit these later.
        </p>
        <p className="text-sm text-muted-foreground">
          Each step is optional &mdash; skip anything you&apos;re not ready to
          fill in yet.
        </p>
      </div>
    );
  }

  function renderIncome() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Income Sources
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add your salary, freelance income, side hustles, or any regular
            income.
          </p>
        </div>

        {/* Mini form */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inc-name">Source Name</Label>
                <Input
                  id="inc-name"
                  placeholder="e.g. Full-time Salary"
                  value={incomeForm.name}
                  onChange={(e) =>
                    setIncomeForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inc-amount">Amount</Label>
                <Input
                  id="inc-amount"
                  type="number"
                  placeholder="5000"
                  value={incomeForm.amount}
                  onChange={(e) =>
                    setIncomeForm((f) => ({ ...f, amount: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={incomeForm.frequency}
                  onValueChange={(v: string | null) => {
                    if (v) setIncomeForm((f) => ({ ...f, frequency: v }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inc-tax">Tax Rate (%)</Label>
                <Input
                  id="inc-tax"
                  type="number"
                  placeholder="22"
                  value={incomeForm.taxRate}
                  onChange={(e) =>
                    setIncomeForm((f) => ({ ...f, taxRate: e.target.value }))
                  }
                />
              </div>
            </div>
            <Button onClick={addIncome} size="sm" className="gap-1">
              <Plus className="w-4 h-4" /> Add Income
            </Button>
          </CardContent>
        </Card>

        {/* List */}
        {incomes.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Added Income ({incomes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {incomes.map((inc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{inc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(inc.amount)} / {inc.frequency} &middot;{" "}
                      {inc.taxRate}% tax
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setIncomes((prev) => prev.filter((_, j) => j !== i))
                    }
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <div className="pt-2 text-sm font-medium text-right">
                Total monthly (pre-tax):{" "}
                {formatCurrency(
                  incomes.reduce(
                    (sum, inc) => sum + toMonthly(inc.amount, inc.frequency),
                    0
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderExpenses() {
    const usedNames = new Set(expenses.map((e) => e.name));

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-orange-500" />
            Monthly Expenses
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Click a suggestion to quick-add, or fill in your own.
          </p>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-2">
          {EXPENSE_SUGGESTIONS.filter((s) => !usedNames.has(s.name)).map(
            (s) => (
              <Button
                key={s.name}
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => addExpense(s)}
              >
                <Plus className="w-3 h-3" /> {s.name}{" "}
                <span className="text-muted-foreground ml-1">
                  {formatCurrency(s.amount)}
                </span>
              </Button>
            )
          )}
        </div>

        {/* Mini form */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exp-name">Expense Name</Label>
                <Input
                  id="exp-name"
                  placeholder="e.g. Phone Bill"
                  value={expenseForm.name}
                  onChange={(e) =>
                    setExpenseForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-amount">Monthly Amount</Label>
                <Input
                  id="exp-amount"
                  type="number"
                  placeholder="100"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm((f) => ({ ...f, amount: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={expenseForm.category}
                  onValueChange={(v: string | null) => {
                    if (v) setExpenseForm((f) => ({ ...f, category: v }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="housing">Housing</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="subscriptions">Subscriptions</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={expenseForm.isFixed ? "default" : "outline"}
                  onClick={() =>
                    setExpenseForm((f) => ({ ...f, isFixed: true }))
                  }
                >
                  Fixed
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={!expenseForm.isFixed ? "default" : "outline"}
                  onClick={() =>
                    setExpenseForm((f) => ({ ...f, isFixed: false }))
                  }
                >
                  Variable
                </Button>
              </div>
            </div>
            <Button onClick={() => addExpense()} size="sm" className="gap-1">
              <Plus className="w-4 h-4" /> Add Expense
            </Button>
          </CardContent>
        </Card>

        {/* List */}
        {expenses.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Added Expenses ({expenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {expenses.map((exp, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{exp.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(exp.amount)} / mo
                      </p>
                    </div>
                    <Badge variant="secondary">{capitalize(exp.category)}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setExpenses((prev) => prev.filter((_, j) => j !== i))
                    }
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <div className="pt-2 text-sm font-medium text-right">
                Total monthly:{" "}
                {formatCurrency(
                  expenses.reduce((sum, exp) => sum + exp.amount, 0)
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderDebts() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-red-500" />
            Debts
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add any outstanding debts: mortgages, student loans, credit cards,
            auto loans, or personal loans.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="debt-name">Debt Name</Label>
                <Input
                  id="debt-name"
                  placeholder="e.g. Student Loan"
                  value={debtForm.name}
                  onChange={(e) =>
                    setDebtForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="debt-balance">Balance</Label>
                <Input
                  id="debt-balance"
                  type="number"
                  placeholder="25000"
                  value={debtForm.balance}
                  onChange={(e) =>
                    setDebtForm((f) => ({ ...f, balance: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="debt-rate">Interest Rate (%)</Label>
                <Input
                  id="debt-rate"
                  type="number"
                  placeholder="5.5"
                  value={debtForm.interestRate}
                  onChange={(e) =>
                    setDebtForm((f) => ({
                      ...f,
                      interestRate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="debt-payment">Monthly Payment</Label>
                <Input
                  id="debt-payment"
                  type="number"
                  placeholder="300"
                  value={debtForm.minimumPayment}
                  onChange={(e) =>
                    setDebtForm((f) => ({
                      ...f,
                      minimumPayment: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={debtForm.type}
                  onValueChange={(v: string | null) => {
                    if (v) setDebtForm((f) => ({ ...f, type: v }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEBT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {capitalize(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={addDebt} size="sm" className="gap-1">
              <Plus className="w-4 h-4" /> Add Debt
            </Button>
          </CardContent>
        </Card>

        {debts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Added Debts ({debts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {debts.map((debt, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{debt.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(debt.balance)} at {debt.interestRate}%
                      &middot; {formatCurrency(debt.minimumPayment)}/mo
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{capitalize(debt.type)}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setDebts((prev) => prev.filter((_, j) => j !== i))
                      }
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="pt-2 text-sm font-medium text-right">
                Total debt:{" "}
                {formatCurrency(
                  debts.reduce((sum, d) => sum + d.balance, 0)
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderAssets() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-500" />
            Assets
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add your savings accounts, investments, property, vehicles, or other
            assets.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asset-name">Asset Name</Label>
                <Input
                  id="asset-name"
                  placeholder="e.g. 401(k)"
                  value={assetForm.name}
                  onChange={(e) =>
                    setAssetForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-value">Current Value</Label>
                <Input
                  id="asset-value"
                  type="number"
                  placeholder="50000"
                  value={assetForm.value}
                  onChange={(e) =>
                    setAssetForm((f) => ({ ...f, value: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={assetForm.type}
                  onValueChange={(v: string | null) => {
                    if (v) setAssetForm((f) => ({ ...f, type: v }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {capitalize(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-growth">Annual Growth Rate (%)</Label>
                <Input
                  id="asset-growth"
                  type="number"
                  placeholder="7"
                  value={assetForm.growthRate}
                  onChange={(e) =>
                    setAssetForm((f) => ({ ...f, growthRate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-contrib">Monthly Contribution</Label>
                <Input
                  id="asset-contrib"
                  type="number"
                  placeholder="500"
                  value={assetForm.monthlyContribution}
                  onChange={(e) =>
                    setAssetForm((f) => ({
                      ...f,
                      monthlyContribution: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <Button onClick={addAsset} size="sm" className="gap-1">
              <Plus className="w-4 h-4" /> Add Asset
            </Button>
          </CardContent>
        </Card>

        {assets.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Added Assets ({assets.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {assets.map((asset, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{asset.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(asset.value)} &middot; {asset.growthRate}%
                      growth
                      {asset.monthlyContribution > 0 &&
                        ` · ${formatCurrency(asset.monthlyContribution)}/mo`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{capitalize(asset.type)}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setAssets((prev) => prev.filter((_, j) => j !== i))
                      }
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="pt-2 text-sm font-medium text-right">
                Total assets:{" "}
                {formatCurrency(
                  assets.reduce((sum, a) => sum + a.value, 0)
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderGoals() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            Financial Goals
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            What are you working toward? Set targets and we&apos;ll help you
            track progress.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                  id="goal-name"
                  placeholder="e.g. Emergency Fund"
                  value={goalForm.name}
                  onChange={(e) =>
                    setGoalForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-target">Target Amount</Label>
                <Input
                  id="goal-target"
                  type="number"
                  placeholder="10000"
                  value={goalForm.targetAmount}
                  onChange={(e) =>
                    setGoalForm((f) => ({
                      ...f,
                      targetAmount: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-current">Current Amount</Label>
                <Input
                  id="goal-current"
                  type="number"
                  placeholder="2000"
                  value={goalForm.currentAmount}
                  onChange={(e) =>
                    setGoalForm((f) => ({
                      ...f,
                      currentAmount: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-date">Target Date</Label>
                <Input
                  id="goal-date"
                  type="date"
                  value={goalForm.targetDate}
                  onChange={(e) =>
                    setGoalForm((f) => ({
                      ...f,
                      targetDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Goal Type</Label>
                <Select
                  value={goalForm.type}
                  onValueChange={(v: string | null) => {
                    if (v) setGoalForm((f) => ({ ...f, type: v }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={addGoal} size="sm" className="gap-1">
              <Plus className="w-4 h-4" /> Add Goal
            </Button>
          </CardContent>
        </Card>

        {goals.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Added Goals ({goals.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {goals.map((goal, i) => {
                const pct =
                  goal.targetAmount > 0
                    ? Math.round(
                        (goal.currentAmount / goal.targetAmount) * 100
                      )
                    : 0;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{goal.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(goal.currentAmount)} /{" "}
                        {formatCurrency(goal.targetAmount)}
                        {goal.targetDate && ` · by ${goal.targetDate}`}
                      </p>
                      <div className="mt-1">
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Badge variant="secondary">
                        {GOAL_TYPES.find((t) => t.value === goal.type)?.label ??
                          capitalize(goal.type)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setGoals((prev) => prev.filter((_, j) => j !== i))
                        }
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderComplete() {
    const totalMonthlyIncome = incomes.reduce(
      (s, i) =>
        s + toMonthly(i.amount, i.frequency) * (1 - i.taxRate / 100),
      0
    );
    const totalMonthlyExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalMonthlyDebtPayments = debts.reduce((s, d) => s + d.minimumPayment, 0);
    const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
    const totalAssets = assets.reduce((s, a) => s + a.value, 0);

    const sections = [
      {
        label: "Income Sources",
        count: incomes.length,
        detail: `${formatCurrency(totalMonthlyIncome)}/mo`,
        icon: DollarSign,
        color: "text-green-500",
      },
      {
        label: "Expenses",
        count: expenses.length,
        detail: `${formatCurrency(totalMonthlyExpenses)}/mo`,
        icon: Receipt,
        color: "text-orange-500",
      },
      {
        label: "Debts",
        count: debts.length,
        detail: formatCurrency(totalDebt),
        icon: CreditCard,
        color: "text-red-500",
      },
      {
        label: "Assets",
        count: assets.length,
        detail: formatCurrency(totalAssets),
        icon: Landmark,
        color: "text-blue-500",
      },
      {
        label: "Goals",
        count: goals.length,
        detail: `${goals.length} target${goals.length !== 1 ? "s" : ""}`,
        icon: Target,
        color: "text-purple-500",
      },
    ];

    return (
      <div className="space-y-6">
        <div className="text-center space-y-3 py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold">You&apos;re all set!</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Here&apos;s a summary of your financial profile. Click
            &ldquo;Launch Dashboard&rdquo; to save everything and get started.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardContent className="pt-6 flex items-center gap-4">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full bg-muted ${s.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-semibold">
                      {s.count} added
                    </p>
                    <p className="text-sm text-muted-foreground">{s.detail}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {totalMonthlyIncome > 0 && totalMonthlyExpenses > 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Estimated Monthly Cash Flow
              </p>
              <p
                className={`text-2xl font-bold ${
                  totalMonthlyIncome - totalMonthlyExpenses - totalMonthlyDebtPayments >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(totalMonthlyIncome - totalMonthlyExpenses - totalMonthlyDebtPayments)}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            className="gap-2 px-8"
            onClick={handleFinish}
            disabled={saving}
          >
            {saving ? (
              "Saving..."
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Launch Dashboard
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  const stepContent = [
    renderWelcome,
    renderIncome,
    renderExpenses,
    renderDebts,
    renderAssets,
    renderGoals,
    renderComplete,
  ];

  const isDataStep = step >= 1 && step <= 5;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Progress header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <span>{STEPS[step].label}</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <div className="flex justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isComplete = i < step;
            return (
              <div
                key={s.label}
                className={`flex flex-col items-center gap-1 ${
                  isActive
                    ? "text-primary"
                    : isComplete
                      ? "text-primary/60"
                      : "text-muted-foreground/40"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isComplete
                        ? "bg-primary/20 text-primary"
                        : "bg-muted"
                  }`}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-[10px] hidden sm:block">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">{stepContent[step]()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <div className="flex gap-2">
          {isDataStep && (
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s + 1)}
            >
              Skip
            </Button>
          )}
          {step < STEPS.length - 1 && (
            <Button
              onClick={() => setStep((s) => s + 1)}
              className="gap-1"
            >
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
