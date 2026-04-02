import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getActiveProfileIdFromRequest } from "@/lib/profile";

export async function GET(req: Request) {
  const profileId = await getActiveProfileIdFromRequest(req);
  const items = await prisma.asset.findMany({ where: { profileId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const profileId = await getActiveProfileIdFromRequest(req);
  const body = await req.json();
  const item = await prisma.asset.create({ data: { ...body, profileId } });
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
