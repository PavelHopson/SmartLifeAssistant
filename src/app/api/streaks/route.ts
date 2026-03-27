import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { getUserStreaks } from "@/lib/services/streaks";

export async function GET() {
  const userId = await getCurrentUserId();
  const result = await getUserStreaks(userId);
  return NextResponse.json(result);
}
