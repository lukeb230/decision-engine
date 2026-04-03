import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getActiveProfileIdFromRequest } from "@/lib/profile";

export async function GET(req: Request) {
  const profileId = await getActiveProfileIdFromRequest(req);
  const items = await prisma.goal.findMany({ where: { profileId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const profileId = await getActiveProfileIdFromRequest(req);
  const body = await req.json();
  const item = await prisma.goal.create({ data: { ...body, profileId } });
  return NextResponse.json(item);
}

export async function PUT(req: Request) {
  const profileId = await getActiveProfileIdFromRequest(req);
  const body = await req.json();
  const { id, ...data } = body;
  const existing = await prisma.goal.findFirst({ where: { id, profileId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const item = await prisma.goal.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(req: Request) {
  const profileId = await getActiveProfileIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")!;
  const existing = await prisma.goal.findFirst({ where: { id, profileId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
