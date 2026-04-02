import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveProfileIdFromRequest } from "@/lib/profile";
import {
  calculateMonthlyCashFlow,
  calculateMonthlyNetIncome,
  calculateMonthlyExpenses,
  calculateMonthlyDebtPayments,
  calculateNetWorth,
  calculateTotalAssets,
  calculateTotalDebts,
  calculateEmergencyFundMonths,
  calculateSavingsRate,
  calculateDebtPayoff,
} from "@/lib/engine/calculator";

export async function POST(req: Request) {
  const profileId = await getActiveProfileIdFromRequest(req);
  const { message, history } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      role: "assistant",
      content: null,
      structured: {
        summary: "AI advisor is not configured yet.",
        tradeoffs: ["Add an ANTHROPIC_API_KEY environment variable to enable the AI advisor."],
        nextStep: "Go to Vercel dashboard > Settings > Environment Variables and add your Anthropic API key.",
      },
    });
  }

  // Gather financial context
  const [incomes, expenses, debts, assets, goals] = await Promise.all([
    prisma.income.findMany({ where: { profileId } }),
    prisma.expense.findMany({ where: { profileId } }),
    prisma.debt.findMany({ where: { profileId } }),
    prisma.asset.findMany({ where: { profileId } }),
    prisma.goal.findMany({ where: { profileId } }),
  ]);

  const incomeInputs = incomes.map((i) => ({ id: i.id, name: i.name, amount: i.amount, frequency: i.frequency, taxRate: i.taxRate }));
  const expenseInputs = expenses.map((e) => ({ id: e.id, name: e.name, amount: e.amount, frequency: e.frequency, category: e.category, isFixed: e.isFixed }));
  const debtInputs = debts.map((d) => ({ id: d.id, name: d.name, balance: d.balance, interestRate: d.interestRate, minimumPayment: d.minimumPayment, type: d.type }));
  const assetInputs = assets.map((a) => ({ id: a.id, name: a.name, value: a.value, type: a.type, growthRate: a.growthRate }));

  const netIncome = calculateMonthlyNetIncome(incomeInputs);
  const totalExpenses = calculateMonthlyExpenses(expenseInputs);
  const debtPayments = calculateMonthlyDebtPayments(debtInputs);
  const cashFlow = calculateMonthlyCashFlow(incomeInputs, expenseInputs, debtInputs);
  const netWorth = calculateNetWorth(assetInputs, debtInputs);
  const totalAssets = calculateTotalAssets(assetInputs);
  const totalDebts = calculateTotalDebts(debtInputs);
  const emergencyMonths = calculateEmergencyFundMonths(assetInputs, expenseInputs);
  const savingsRate = calculateSavingsRate(incomeInputs, expenseInputs, debtInputs);
  const debtPayoffs = debtInputs.map((d) => calculateDebtPayoff(d));

  const financialContext = `
USER'S FINANCIAL SNAPSHOT:
- Monthly Net Income: $${netIncome.toFixed(0)}
- Monthly Expenses: $${totalExpenses.toFixed(0)}
- Monthly Debt Payments: $${debtPayments.toFixed(0)}
- Monthly Free Cash Flow: $${cashFlow.toFixed(0)}
- Savings Rate: ${savingsRate}%
- Net Worth: $${netWorth.toFixed(0)}
- Total Assets: $${totalAssets.toFixed(0)}
- Total Debts: $${totalDebts.toFixed(0)}
- Emergency Fund: ${emergencyMonths} months of expenses

INCOME SOURCES:
${incomes.map((i) => `- ${i.name}: $${i.amount} (${i.frequency}, ${i.taxRate}% tax)`).join("\n")}

EXPENSES:
${expenses.map((e) => `- ${e.name}: $${e.amount}/mo (${e.category}, ${e.isFixed ? "fixed" : "variable"})`).join("\n")}

DEBTS:
${debtInputs.map((d) => {
  const payoff = debtPayoffs.find((p) => p.debtId === d.id);
  return `- ${d.name}: $${d.balance} balance, ${d.interestRate}% APR, $${d.minimumPayment}/mo payment, payoff in ${payoff ? payoff.monthsToPayoff : "?"} months`;
}).join("\n")}

ASSETS:
${assets.map((a) => `- ${a.name}: $${a.value} (${a.type}, ${a.growthRate}% growth)`).join("\n")}

GOALS:
${goals.map((g) => `- ${g.name}: $${g.currentAmount}/$${g.targetAmount} (${g.type}, target: ${g.targetDate.toISOString().split("T")[0]})`).join("\n")}
`.trim();

  const systemPrompt = `You are a personal finance advisor inside a financial planning app called Decision Analysis. You have access to the user's complete financial data shown below.

${financialContext}

RESPONSE FORMAT:
You MUST respond with valid JSON in this exact structure:
{
  "summary": "A 1-2 sentence direct answer to their question",
  "tradeoffs": ["Key tradeoff or consideration 1", "Key tradeoff 2", "Key tradeoff 3"],
  "nextStep": "One specific actionable recommendation"
}

GUIDELINES:
- Be specific with dollar amounts and timeframes using the actual data above
- Be direct and concise — no filler or caveats
- Reference their actual numbers (debts, income, etc.) by name
- If they ask about affording something, calculate the real impact on their cash flow
- If they ask about debt vs investing, use their actual interest rates
- Keep tradeoffs to 2-4 bullet points max
- The nextStep should be a single concrete action they can take today`;

  const messages = [
    ...(history || []).map((h: { role: string; content: string }) => ({
      role: h.role,
      content: h.content,
    })),
    { role: "user", content: message },
  ];

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Anthropic API error:", error);
      return NextResponse.json({
        role: "assistant",
        content: null,
        structured: {
          summary: "Sorry, I encountered an error connecting to the AI service.",
          tradeoffs: [`API returned status ${response.status}`],
          nextStep: "Try again in a moment, or check that your API key is valid.",
        },
      });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Try to parse structured JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const structured = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          role: "assistant",
          content: text,
          structured: {
            summary: structured.summary || text,
            tradeoffs: structured.tradeoffs || [],
            nextStep: structured.nextStep || "",
          },
        });
      }
    } catch {
      // Fall through to plain text
    }

    return NextResponse.json({
      role: "assistant",
      content: text,
      structured: {
        summary: text,
        tradeoffs: [],
        nextStep: "",
      },
    });
  } catch (error) {
    console.error("Advisor error:", error);
    return NextResponse.json({
      role: "assistant",
      content: null,
      structured: {
        summary: "An unexpected error occurred.",
        tradeoffs: [],
        nextStep: "Please try again.",
      },
    });
  }
}
