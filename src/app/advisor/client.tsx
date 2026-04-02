"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Lightbulb, Zap, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  insights: string[];
  netWorth: number;
  cashFlow: number;
}

export function AdvisorClient({ insights, netWorth, cashFlow }: Props) {
  return (
    <div className="space-y-6 pt-2 md:pt-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Advisor</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Personalized financial insights and recommendations
        </p>
      </div>

      {/* Status Banner */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3">
            <Bot className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium">AI-Powered Analysis</p>
            <p className="text-sm text-muted-foreground">
              Rule-based insights now. Future integration with AI for deeper analysis.
            </p>
          </div>
          <Badge variant="secondary">Preview</Badge>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Net Worth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${netWorth >= 0 ? "text-green-600" : "text-red-500"}`}>
              {formatCurrency(netWorth)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${cashFlow >= 0 ? "text-green-600" : "text-red-500"}`}>
              {formatCurrency(cashFlow)}/mo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.map((insight, i) => (
            <div
              key={i}
              className="flex items-start gap-3 border rounded-lg p-4"
            >
              <Zap className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{insight}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Future Integration */}
      <Card className="border-dashed">
        <CardContent className="text-center py-12">
          <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon: AI-Powered Advisor</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Future integration will provide deep scenario analysis, optimization suggestions,
            and natural language Q&A about your finances.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Powered by</span>
            <Badge variant="outline">OpenClaw AI</Badge>
            <ArrowRight className="h-3 w-3" />
            <span>Integration Ready</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
