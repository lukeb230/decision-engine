"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Send,
  User,
  Loader2,
  Zap,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StructuredResponse {
  summary: string;
  tradeoffs: string[];
  nextStep: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  structured?: StructuredResponse;
}

const quickPrompts = [
  { text: "Can I afford a $1,500/month apartment?", icon: "🏠" },
  { text: "How much does a $500/mo car payment delay my goals?", icon: "🚗" },
  { text: "Should I increase investing or pay off debt first?", icon: "📊" },
  { text: "What's the fastest way to reach $100K net worth?", icon: "🎯" },
  { text: "How much should I have in my emergency fund?", icon: "🛡️" },
  { text: "What if I get a $10K raise?", icon: "💰" },
];

interface Props {
  netWorth: number;
  cashFlow: number;
  savingsRate: number;
  hasApiKey: boolean;
}

export function AdvisorClient({ netWorth, cashFlow, savingsRate, hasApiKey }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.content || data.structured?.summary || "",
        structured: data.structured,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          structured: {
            summary: "Connection error occurred.",
            tradeoffs: [],
            nextStep: "Check your internet connection and try again.",
          },
        },
      ]);
    }

    setLoading(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="space-y-6 pt-2 md:pt-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Advisor</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ask questions about your finances and get personalized advice
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main Chat Area */}
        <div className="space-y-4">
          {/* Status */}
          <Card className={hasApiKey ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/10" : "border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/10"}>
            <CardContent className="flex items-center gap-3 py-3">
              <Sparkles className={`h-5 w-5 ${hasApiKey ? "text-emerald-600" : "text-amber-600"}`} />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {hasApiKey ? "Claude AI Connected" : "AI Not Configured"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {hasApiKey
                    ? "Powered by Anthropic Claude — responses use your real financial data"
                    : "Add ANTHROPIC_API_KEY to your environment variables to enable AI"}
                </p>
              </div>
              <Badge variant={hasApiKey ? "default" : "secondary"}>
                {hasApiKey ? "Live" : "Setup Needed"}
              </Badge>
            </CardContent>
          </Card>

          {/* Chat Messages */}
          <Card className="min-h-[500px] flex flex-col">
            <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[600px]">
              {messages.length === 0 && (
                <div className="text-center py-16">
                  <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
                  <p className="font-medium mb-1">Ask me anything about your finances</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    I have access to all your income, expenses, debts, assets, and goals.
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
                    {quickPrompts.map((qp) => (
                      <button
                        key={qp.text}
                        onClick={() => sendMessage(qp.text)}
                        className="flex items-center gap-2 p-3 rounded-lg border text-left hover:bg-accent transition-colors text-xs"
                      >
                        <span className="text-base">{qp.icon}</span>
                        <span>{qp.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 h-8 w-8 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                  )}

                  <div className={`max-w-[80%] ${msg.role === "user" ? "order-first" : ""}`}>
                    {msg.role === "user" ? (
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5">
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    ) : msg.structured ? (
                      <div className="space-y-3">
                        {/* Summary */}
                        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                          <p className="text-sm">{msg.structured.summary}</p>
                        </div>

                        {/* Tradeoffs */}
                        {msg.structured.tradeoffs.length > 0 && (
                          <div className="bg-muted/50 rounded-xl px-4 py-3 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <AlertTriangle className="h-3 w-3" />
                              Key Tradeoffs
                            </p>
                            {msg.structured.tradeoffs.map((t, j) => (
                              <div key={j} className="flex items-start gap-2 text-sm">
                                <Zap className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                <span>{t}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Next Step */}
                        {msg.structured.nextStep && (
                          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl px-4 py-3">
                            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                              <CheckCircle className="h-3 w-3" />
                              Recommended Next Step
                            </p>
                            <p className="text-sm">{msg.structured.nextStep}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="rounded-full bg-foreground h-8 w-8 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-background" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 h-8 w-8 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your finances..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {messages.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                  {quickPrompts.slice(0, 3).map((qp) => (
                    <button
                      key={qp.text}
                      onClick={() => sendMessage(qp.text)}
                      className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border hover:bg-accent transition-colors text-muted-foreground"
                    >
                      {qp.icon} {qp.text.split(" ").slice(0, 5).join(" ")}...
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Your Numbers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Net Worth</span>
                <span className={`text-sm font-bold ${netWorth >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {formatCurrency(netWorth)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Cash Flow</span>
                <span className={`text-sm font-bold ${cashFlow >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {formatCurrency(cashFlow)}/mo
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Savings Rate</span>
                <span className={`text-sm font-bold ${savingsRate >= 20 ? "text-emerald-600" : "text-amber-500"}`}>
                  {savingsRate}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Suggested Topics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4" />
                Try Asking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {[
                "What's my debt-free date?",
                "Can I retire by 50?",
                "Is my savings rate good enough?",
                "What should I do with $500 extra/month?",
                "How much house can I afford?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-accent transition-colors text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowRight className="h-3 w-3 flex-shrink-0" />
                  {q}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Provider Info */}
          <Card className="border-dashed">
            <CardContent className="py-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">Powered by</p>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline">Anthropic Claude</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Future: OpenClaw agent integration
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
