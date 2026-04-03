import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getActiveProfileIdFromRequest } from "@/lib/profile";

export async function GET(req: Request) {
  const profileId = await getActiveProfileIdFromRequest(req);
  const items = await prisma.scenario.findMany({
    where: { profileId },
    include: { changes: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const profileId = await getActiveProfileIdFromRequest(req);
  const body = await req.json();
  const { changes, snapshotData, ...scenarioData } = body;
  const item = await prisma.scenario.create({
    data: {
      ...scenarioData,
      profileId,
      snapshotData: snapshotData ? JSON.stringify(snapshotData) : undefined,
      changes: changes ? { create: changes } : undefined,
    },
    include: { changes: true },
  });
  return NextResponse.json(item);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, changes, snapshotData, ...data } = body;
  // Delete old changes and create new ones
  await prisma.scenarioChange.deleteMany({ where: { scenarioId: id } });
  const item = await prisma.scenario.update({
    where: { id },
    data: {
      ...data,
      snapshotData: snapshotData ? JSON.stringify(snapshotData) : undefined,
      changes: changes ? { create: changes } : undefined,
    },
    include: { changes: true },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")!;
  await prisma.scenario.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
