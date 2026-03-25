import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  const body = await request.json();

  const device = await db.device.upsert({
    where: { id: body.deviceId || "new" },
    create: {
      userId,
      type: body.type || "web",
      name: body.name || "Browser",
      platform: body.platform || detectPlatform(request),
      notificationToken: body.notificationToken,
      lastSeenAt: new Date(),
    },
    update: {
      lastSeenAt: new Date(),
      notificationToken: body.notificationToken,
      isActive: true,
    },
  });

  return NextResponse.json({ device });
}

function detectPlatform(request: NextRequest): string {
  const ua = request.headers.get("user-agent") || "";
  if (ua.includes("Windows")) return "windows";
  if (ua.includes("Mac")) return "macos";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "ios";
  if (ua.includes("Android")) return "android";
  return "web";
}
