import { prisma } from "@/lib/db";
import { DebtsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  const items = await prisma.debt.findMany({ orderBy: { createdAt: "desc" } });
  return <DebtsClient items={JSON.parse(JSON.stringify(items))} />;
}
