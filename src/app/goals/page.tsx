import { prisma } from "@/lib/db";
import { GoalsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const items = await prisma.goal.findMany({ orderBy: { priority: "asc" } });
  return <GoalsClient items={JSON.parse(JSON.stringify(items))} />;
}
