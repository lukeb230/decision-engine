import { prisma } from "@/lib/db";
import { AssetsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const items = await prisma.asset.findMany({ orderBy: { createdAt: "desc" } });
  return <AssetsClient items={JSON.parse(JSON.stringify(items))} />;
}
