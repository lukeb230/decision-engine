import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const items = await prisma.scenario.findMany({
    include: { changes: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { changes, ...scenarioData } = body;
  const item = await prisma.scenario.create({
    data: {
      ...scenarioData,
      changes: changes ? { create: changes } : undefined,
    },
    include: { changes: true },
  });
  return NextResponse.json(item);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, changes, ...data } = body;
  // Delete old changes and create new ones
  await prisma.scenarioChange.deleteMany({ where: { scenarioId: id } });
  const item = await prisma.scenario.update({
    where: { id },
    data: {
      ...data,
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
