import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const profiles = await prisma.profile.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(profiles);
}

export async function POST(req: Request) {
  const body = await req.json();
  const profile = await prisma.profile.create({
    data: {
      name: body.name,
      avatarColor: body.avatarColor || "#3b82f6",
    },
  });

  // Create a baseline scenario for the new profile
  await prisma.scenario.create({
    data: {
      profileId: profile.id,
      name: "Current Baseline",
      description: "Your current financial situation",
      isBaseline: true,
    },
  });

  return NextResponse.json(profile);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")!;
  await prisma.profile.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
