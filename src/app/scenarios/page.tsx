import { prisma } from "@/lib/db";
import { ScenariosClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ScenariosPage() {
  const scenarios = await prisma.scenario.findMany({
    include: { changes: true },
    orderBy: { createdAt: "desc" },
  });
  return <ScenariosClient scenarios={JSON.parse(JSON.stringify(scenarios))} />;
}
