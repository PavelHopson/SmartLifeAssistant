import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { generateHealthActions } from "@/lib/services/health-actions";

export async function POST() {
  const userId = await getCurrentUserId();
  const result = await generateHealthActions(userId);
  return NextResponse.json(result);
}
