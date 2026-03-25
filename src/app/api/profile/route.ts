import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { getUserProfile } from "@/lib/services/profile";

export async function GET() {
  const userId = await getCurrentUserId();
  const profile = await getUserProfile(userId);

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}
