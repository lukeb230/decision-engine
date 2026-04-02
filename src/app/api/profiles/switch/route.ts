import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { profileId } = await req.json();

  const response = NextResponse.json({ success: true });
  response.cookies.set("decision-profile-id", profileId, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return response;
}
