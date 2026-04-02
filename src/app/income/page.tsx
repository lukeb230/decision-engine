import { prisma } from "@/lib/db";
import { IncomeClient } from "./client";

export const dynamic = "force-dynamic";

export default async function IncomePage() {
  const items = await prisma.income.findMany({ orderBy: { createdAt: "desc" } });
  return <IncomeClient items={JSON.parse(JSON.stringify(items))} />;
}
