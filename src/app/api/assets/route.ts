import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const items = await prisma.asset.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const item = await prisma.asset.create({ data: body });
  return NextResponse.json(item);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, ...data } = body;
  const item = await prisma.asset.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")!;
  await prisma.asset.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
