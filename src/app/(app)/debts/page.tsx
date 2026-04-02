import { prisma } from "@/lib/db";
import { getActiveProfileId } from "@/lib/profile";
import { DebtsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  const profileId = await getActiveProfileId();
  const items = await prisma.debt.findMany({ where: { profileId }, orderBy: { createdAt: "desc" } });
  return <DebtsClient items={JSON.parse(JSON.stringify(items))} />;
}
