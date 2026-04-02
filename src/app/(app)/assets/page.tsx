import { prisma } from "@/lib/db";
import { getActiveProfileId } from "@/lib/profile";
import { AssetsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const profileId = await getActiveProfileId();
  const items = await prisma.asset.findMany({ where: { profileId }, orderBy: { createdAt: "desc" } });
  return <AssetsClient items={JSON.parse(JSON.stringify(items))} />;
}
