import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { text, bankHint } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });
  }

  const systemPrompt = `You are a bank statement parser. Extract ALL transactions from the following bank statement text.

${bankHint ? `This appears to be a ${bankHint} statement.` : ""}

Return ONLY valid JSON in this exact format:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Merchant or transaction description",
      "amount": 123.45,
      "isIncome": false
    }
  ]
}

RULES:
- "amount" must always be a positive number
- "isIncome" is true for deposits, payments received, credits. False for purchases, withdrawals, charges, fees.
- "date" must be in YYYY-MM-DD format. If only MM/DD is shown, infer the year from context.
- Skip "Beginning Balance", "Ending Balance", totals, subtotals, and header rows
- Skip foreign currency detail lines (e.g. "FOREIGN CURRENCY 27.00 EUR")
- Include ALL individual transactions — do not summarize or group them
- Clean up descriptions — remove reference numbers, extra whitespace, account masks (****)
- Return an empty array if no transactions can be extracted`;

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
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: text.substring(0, 15000) }], // Cap text length
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "AI service error" }, { status: 500 });
    }

    const data = await response.json();
    const responseText = data.content?.[0]?.text || "";

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    } catch {}

    return NextResponse.json({ transactions: [], error: "Could not parse AI response" });
  } catch {
    return NextResponse.json({ transactions: [], error: "AI request failed" });
  }
}
