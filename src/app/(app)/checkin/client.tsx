"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileText,
  Check,
  ChevronRight,
  Trash2,
  Loader2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { parseCSV } from "@/lib/checkin/csv-parser";
import { parsePDF } from "@/lib/checkin/pdf-parser";
import { autoCategory } from "@/lib/checkin/category-mapper";
import type {
  NormalizedTransaction,
  ParseResult,
  WizardStep,
  CheckinGrade,
} from "@/lib/checkin/types";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface Props {
  budget: Record<string, number>;
  pastCheckins: {
    id: string;
    month: number;
    year: number;
    totalIncome: number;
    totalExpenses: number;
    overallGrade: string;
    expensesByCategory: string;
    gradeDetails: string;
    createdAt: string;
  }[];
}

const CATEGORIES = [
  "housing",
  "transport",
  "food",
  "utilities",
  "subscriptions",
  "entertainment",
  "insurance",
  "shopping",
  "health",
  "personal",
  "education",
  "pets",
  "transfers",
  "other",
];

const STEP_LABELS: { key: WizardStep; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "review", label: "Review" },
  { key: "grade", label: "Grade" },
  { key: "suggestions", label: "Suggestions" },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function gradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "text-emerald-600";
    case "B":
      return "text-blue-600";
    case "C":
      return "text-amber-600";
    case "D":
      return "text-orange-600";
    case "F":
      return "text-red-600";
    default:
      return "text-muted-foreground";
  }
}

function gradeBg(grade: string): string {
  switch (grade) {
    case "A":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "B":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "C":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "D":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "F":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-muted";
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CheckinWizard({ budget, pastCheckins }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state
  const [step, setStep] = useState<WizardStep>("upload");
  const [files, setFiles] = useState<{ name: string; result: ParseResult }[]>(
    []
  );
  const [transactions, setTransactions] = useState<NormalizedTransaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [grades, setGrades] = useState<CheckinGrade | null>(null);
  const [suggestions, setSuggestions] = useState<{
    summary: string;
    categoryInsights: {
      category: string;
      grade: string;
      insight: string;
      suggestion: string;
    }[];
    topActions: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // History expansion
  const [expandedCheckin, setExpandedCheckin] = useState<string | null>(null);

  // Drag state
  const [dragging, setDragging] = useState(false);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const activeTransactions = transactions.filter((t) => !t.excluded);
  const totalIncome = activeTransactions
    .filter((t) => t.isIncome)
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = activeTransactions
    .filter((t) => !t.isIncome)
    .reduce((s, t) => s + t.amount, 0);

  const expensesByCategory: Record<string, number> = {};
  activeTransactions
    .filter((t) => !t.isIncome)
    .forEach((t) => {
      expensesByCategory[t.category] =
        (expensesByCategory[t.category] || 0) + t.amount;
    });

  const stepIndex = STEP_LABELS.findIndex((s) => s.key === step);

  // ---------------------------------------------------------------------------
  // File handling
  // ---------------------------------------------------------------------------

  function autoDetectMonth(result: ParseResult) {
    if (result.transactions.length > 0) {
      const monthCounts: Record<string, number> = {};
      result.transactions.forEach((t) => {
        const d = new Date(t.date);
        const key = `${d.getMonth() + 1}-${d.getFullYear()}`;
        monthCounts[key] = (monthCounts[key] || 0) + 1;
      });
      const best = Object.entries(monthCounts).sort(
        (a, b) => b[1] - a[1]
      )[0];
      if (best) {
        const [m, y] = best[0].split("-").map(Number);
        setSelectedMonth(m);
        setSelectedYear(y);
      }
    }
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    Array.from(fileList).forEach(async (file) => {
      const isPDF = file.name.toLowerCase().endsWith(".pdf");
      const isCSV = file.name.toLowerCase().endsWith(".csv");
      if (!isPDF && !isCSV) return;

      if (isCSV) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const result = parseCSV(text);
          setFiles((prev) => [...prev, { name: file.name, result }]);
          autoDetectMonth(result);
        };
        reader.readAsText(file);
      } else {
        // PDF parsing — send to server for text extraction + AI parsing
        setLoading(true);
        try {
          // Read file as base64
          const arrayBuffer = await file.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
          );

          // Send to server API for text extraction + AI parsing
          const aiRes = await fetch("/api/checkin/parse-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdfBase64: base64, bankHint: file.name }),
          });
          const aiData = await aiRes.json();

          if (aiData.transactions && aiData.transactions.length > 0) {
            const aiTransactions = aiData.transactions.map((t: { date: string; description: string; amount: number; isIncome: boolean }) => ({
              id: "tx_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7),
              date: t.date,
              description: t.description,
              amount: Math.abs(t.amount),
              isIncome: t.isIncome,
              category: autoCategory(t.description),
              source: "pdf",
              excluded: false,
            }));
            aiTransactions.sort((a: NormalizedTransaction, b: NormalizedTransaction) => a.date.localeCompare(b.date));
            const aiResult: ParseResult = {
              format: "usaa",
              formatLabel: "PDF (AI parsed)",
              transactions: aiTransactions,
              errors: [],
              dateRange: aiTransactions.length > 0
                ? { from: aiTransactions[0].date, to: aiTransactions[aiTransactions.length - 1].date }
                : null,
            };
            setFiles((prev) => [...prev, { name: file.name, result: aiResult }]);
            autoDetectMonth(aiResult);
          } else {
            setFiles((prev) => [...prev, {
              name: file.name,
              result: {
                format: "unknown",
                formatLabel: "PDF",
                transactions: [],
                errors: [aiData.error || "No transactions found in PDF"],
                dateRange: null,
              },
            }]);
          }
        } catch (err) {
          setFiles((prev) => [...prev, {
            name: file.name,
            result: {
              format: "unknown",
              formatLabel: "PDF Error",
              transactions: [],
              errors: [`Failed to parse PDF: ${err instanceof Error ? err.message : "Unknown error"}`],
              dateRange: null,
            },
          }]);
        }
        setLoading(false);
      }
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function continueToReview() {
    const merged = files.flatMap((f) => f.result.transactions);
    setTransactions(merged);
    setStep("review");

    // AI categorization — run in background after showing review
    try {
      const descriptions = merged.map((t) => t.description);
      const res = await fetch("/api/checkin/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptions }),
      });
      const data = await res.json();
      if (data.categories && Object.keys(data.categories).length > 0) {
        setTransactions((prev) =>
          prev.map((t) => {
            const aiCat = data.categories[t.description];
            // Only override if AI found a category and current is "other"
            if (aiCat && (t.category === "other" || !t.category)) {
              return { ...t, category: aiCat };
            }
            return t;
          })
        );
      }
    } catch {
      // AI categorization failed silently — keyword categories remain
    }
  }

  // ---------------------------------------------------------------------------
  // Review helpers
  // ---------------------------------------------------------------------------

  function updateTransaction(
    index: number,
    updates: Partial<NormalizedTransaction>
  ) {
    setTransactions((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...updates } : t))
    );
  }

  // ---------------------------------------------------------------------------
  // Grade step
  // ---------------------------------------------------------------------------

  async function confirmAndGrade() {
    setStep("grade");
    setLoading(true);
    try {
      const res = await fetch("/api/checkin/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expensesByCategory, budget }),
      });
      const data = await res.json();
      setGrades(data);
    } catch (err) {
      console.error("Grade error:", err);
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Suggestions step
  // ---------------------------------------------------------------------------

  async function getSuggestions() {
    setStep("suggestions");
    setLoading(true);
    try {
      const res = await fetch("/api/checkin/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          gradeDetails: grades,
          expensesByCategory,
          totalIncome,
          totalExpenses,
        }),
      });
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Suggestions error:", err);
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  async function saveCheckin() {
    setLoading(true);
    try {
      await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          totalIncome,
          totalExpenses,
          overallGrade: grades?.overallGrade ?? "",
          expensesByCategory: JSON.stringify(expensesByCategory),
          gradeDetails: JSON.stringify(grades),
        }),
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Delete checkin
  // ---------------------------------------------------------------------------

  async function deleteCheckin(id: string) {
    await fetch(`/api/checkin/${id}`, { method: "DELETE" });
    router.refresh();
  }

  // ---------------------------------------------------------------------------
  // Render: Step indicator
  // ---------------------------------------------------------------------------

  function renderStepIndicator() {
    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEP_LABELS.map((s, i) => {
          const isCompleted = i < stepIndex;
          const isCurrent = i === stepIndex;
          return (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`h-px w-8 ${
                    isCompleted ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium border ${
                    isCompleted
                      ? "bg-primary text-primary-foreground border-primary"
                      : isCurrent
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={`text-sm hidden sm:inline ${
                    isCurrent
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Upload step
  // ---------------------------------------------------------------------------

  function renderUpload() {
    const hasTransactions = files.some((f) => f.result.transactions.length > 0);

    return (
      <div className="space-y-6">
        {/* Drop zone */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium">
            Drop CSV or PDF statements here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Upload one file per account (bank, credit card, etc.)
          </p>
        </div>

        {/* Uploaded files */}
        {files.length > 0 && (
          <div className="space-y-3">
            {files.map((f, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{f.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {f.result.format && (
                            <Badge variant="secondary" className="text-xs">
                              {f.result.format}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {f.result.transactions.length} transactions
                          </span>
                          {f.result.transactions.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {fmtDate(f.result.transactions[0].date)} &ndash;{" "}
                              {fmtDate(
                                f.result.transactions[
                                  f.result.transactions.length - 1
                                ].date
                              )}
                            </span>
                          )}
                        </div>
                        {f.result.errors && f.result.errors.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                            <AlertTriangle className="h-3 w-3" />
                            {f.result.errors.length} warning(s)
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Month/year selection */}
        {files.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Check-in for:</span>
            <Select
              value={String(selectedMonth)}
              onValueChange={(v: string | null) => {
                if (v) setSelectedMonth(Number(v));
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(selectedYear)}
              onValueChange={(v: string | null) => {
                if (v) setSelectedYear(Number(v));
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  selectedYear - 1,
                  selectedYear,
                  selectedYear + 1,
                ].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Continue */}
        <div className="flex justify-end">
          <Button disabled={!hasTransactions} onClick={continueToReview}>
            Continue to Review
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Review step
  // ---------------------------------------------------------------------------

  function renderReview() {
    const net = totalIncome - totalExpenses;

    return (
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Income</p>
              <p className="text-xl font-semibold text-emerald-600">
                {formatCurrency(totalIncome)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">
                Total Expenses
              </p>
              <p className="text-xl font-semibold text-red-600">
                {formatCurrency(totalExpenses)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Net</p>
              <p
                className={`text-xl font-semibold ${
                  net >= 0 ? "text-blue-600" : "text-red-600"
                }`}
              >
                {formatCurrency(net)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[110px] text-right">
                      Amount
                    </TableHead>
                    <TableHead className="w-[160px]">Category</TableHead>
                    <TableHead className="w-[100px]">Source</TableHead>
                    <TableHead className="w-[70px] text-center">
                      Exclude
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t, i) => (
                    <TableRow
                      key={i}
                      className={t.excluded ? "opacity-50" : undefined}
                    >
                      <TableCell className="text-xs">
                        <span className={t.excluded ? "line-through" : ""}>
                          {fmtDate(t.date)}
                        </span>
                      </TableCell>
                      <TableCell
                        className="text-sm max-w-[240px] truncate"
                        title={t.description}
                      >
                        <span className={t.excluded ? "line-through" : ""}>
                          {t.description.length > 40
                            ? t.description.slice(0, 40) + "..."
                            : t.description}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        <span
                          className={
                            t.excluded
                              ? "line-through text-muted-foreground"
                              : t.isIncome
                              ? "text-emerald-600"
                              : "text-red-600"
                          }
                        >
                          {t.isIncome ? "+" : "-"}
                          {formatCurrency(t.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {!t.isIncome && (
                          <Select
                            value={t.category}
                            onValueChange={(v: string | null) => {
                              if (v) updateTransaction(i, { category: v });
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {capitalize(c)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {t.isIncome && (
                          <span className="text-xs text-muted-foreground">
                            Income
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {t.source || "CSV"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={t.excluded ?? false}
                          onChange={(e) =>
                            updateTransaction(i, {
                              excluded: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-border"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setStep("upload")}>
            Back
          </Button>
          <Button onClick={confirmAndGrade}>
            Confirm &amp; Grade
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Grade step
  // ---------------------------------------------------------------------------

  function renderGrade() {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Analyzing your spending...
          </p>
        </div>
      );
    }

    if (!grades) return null;

    const totalBudgeted = Object.values(budget).reduce((s, v) => s + v, 0);
    const totalActual = totalExpenses;
    const totalDiff = totalActual - totalBudgeted;

    return (
      <div className="space-y-6">
        {/* Overall grade */}
        <Card className="border-2">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Overall Grade</p>
            <div
              className={`inline-flex items-center justify-center h-20 w-20 rounded-full text-4xl font-bold border-2 ${gradeBg(
                grades.overallGrade
              )}`}
            >
              {grades.overallGrade}
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Budgeted: </span>
                <span className="font-medium">
                  {formatCurrency(totalBudgeted)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Actual: </span>
                <span className="font-medium">
                  {formatCurrency(totalActual)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Diff: </span>
                <span
                  className={`font-medium ${
                    totalDiff > 0 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {totalDiff > 0 ? "+" : ""}
                  {formatCurrency(totalDiff)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category grades */}
        <div className="grid gap-4 sm:grid-cols-2">
          {grades.categories?.map((cat) => {
            const budgeted = budget[cat.category] ?? 0;
            const actual = expensesByCategory[cat.category] ?? 0;
            const diff = actual - budgeted;
            const ratio = budgeted > 0 ? Math.min(actual / budgeted, 1.5) : 0;
            const pct = Math.round(ratio * 100);

            return (
              <Card key={cat.category}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {capitalize(cat.category)}
                    </span>
                    <span
                      className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold border ${gradeBg(
                        cat.grade
                      )}`}
                    >
                      {cat.grade}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Budget: {formatCurrency(budgeted)}</span>
                    <span>Actual: {formatCurrency(actual)}</span>
                    <span
                      className={
                        diff > 0 ? "text-red-600" : "text-emerald-600"
                      }
                    >
                      {diff > 0 ? "+" : ""}
                      {formatCurrency(diff)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        ratio > 1
                          ? "bg-red-500"
                          : ratio > 0.8
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  {pct > 100 && (
                    <p className="text-xs text-red-600 mt-1">{pct}% of budget</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setStep("review")}>
            Back
          </Button>
          <Button onClick={getSuggestions}>
            <Sparkles className="h-4 w-4 mr-1" />
            Get AI Suggestions
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Suggestions step
  // ---------------------------------------------------------------------------

  function renderSuggestions() {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Generating personalized suggestions...
          </p>
        </div>
      );
    }

    if (saved) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <CheckCircle className="h-12 w-12 text-emerald-600" />
          <p className="text-lg font-medium">Check-in Saved!</p>
          <p className="text-sm text-muted-foreground">
            Your {MONTH_NAMES[selectedMonth - 1]} {selectedYear} check-in has
            been recorded.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setStep("upload");
              setFiles([]);
              setTransactions([]);
              setGrades(null);
              setSuggestions(null);
              setSaved(false);
            }}
          >
            Start New Check-in
          </Button>
        </div>
      );
    }

    if (!suggestions) return null;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm leading-relaxed">{suggestions.summary}</p>
            </div>
          </CardContent>
        </Card>

        {/* Category insights */}
        <div className="grid gap-4 sm:grid-cols-2">
          {suggestions.categoryInsights.map((ci) => (
            <Card key={ci.category}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">
                    {capitalize(ci.category)}
                  </span>
                  <span
                    className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold border ${gradeBg(
                      ci.grade
                    )}`}
                  >
                    {ci.grade}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {ci.insight}
                </p>
                <p className="text-xs font-medium text-primary">
                  {ci.suggestion}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Top actions */}
        {suggestions.topActions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Top Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ol className="space-y-2">
                {suggestions.topActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{action}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setStep("grade")}>
            Back
          </Button>
          <Button onClick={saveCheckin} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save Check-in
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: History
  // ---------------------------------------------------------------------------

  function renderHistory() {
    if (pastCheckins.length === 0) return null;

    return (
      <Card className="mt-10">
        <CardHeader>
          <CardTitle className="text-base">Past Check-ins</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {pastCheckins.map((ci) => {
              const isExpanded = expandedCheckin === ci.id;
              let parsedExpenses: Record<string, number> = {};
              let parsedGrades: CheckinGrade | null = null;
              try {
                parsedExpenses = JSON.parse(ci.expensesByCategory);
              } catch {}
              try {
                parsedGrades = JSON.parse(ci.gradeDetails);
              } catch {}

              return (
                <div key={ci.id}>
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() =>
                      setExpandedCheckin(isExpanded ? null : ci.id)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {MONTH_NAMES[ci.month - 1]} {ci.year}
                      </span>
                      <span
                        className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold border ${gradeBg(
                          ci.overallGrade
                        )}`}
                      >
                        {ci.overallGrade}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(ci.totalExpenses)} spent
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {fmtDate(ci.createdAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCheckin(ci.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Income: </span>
                          <span className="font-medium text-emerald-600">
                            {formatCurrency(ci.totalIncome)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Expenses:{" "}
                          </span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(ci.totalExpenses)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Net: </span>
                          <span
                            className={`font-medium ${
                              ci.totalIncome - ci.totalExpenses >= 0
                                ? "text-blue-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(
                              ci.totalIncome - ci.totalExpenses
                            )}
                          </span>
                        </div>
                      </div>
                      {Object.keys(parsedExpenses).length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {Object.entries(parsedExpenses).map(([cat, amt]) => (
                            <div
                              key={cat}
                              className="flex items-center justify-between rounded-md border px-3 py-1.5 text-xs"
                            >
                              <span className="text-muted-foreground">
                                {capitalize(cat)}
                              </span>
                              <span className="font-medium">
                                {formatCurrency(amt)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {parsedGrades?.categories && (
                        <div className="flex flex-wrap gap-2">
                          {parsedGrades.categories.map((c) => (
                            <Badge
                              key={c.category}
                              variant="outline"
                              className={gradeBg(c.grade)}
                            >
                              {capitalize(c.category)}: {c.grade}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-4xl mx-auto">
      {renderStepIndicator()}

      {step === "upload" && renderUpload()}
      {step === "review" && renderReview()}
      {step === "grade" && renderGrade()}
      {step === "suggestions" && renderSuggestions()}

      {renderHistory()}
    </div>
  );
}
