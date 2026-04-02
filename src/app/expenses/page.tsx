import { prisma } from "@/lib/db";
import { ExpensesClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const items = await prisma.expense.findMany({ orderBy: { createdAt: "desc" } });
  return <ExpensesClient items={JSON.parse(JSON.stringify(items))} />;
}
