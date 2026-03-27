import { NextRequest, NextResponse } from "next/server";
import { ensureReferralCode, getReferralLink, getReferralStats } from "@/lib/services/referral";

const DEMO_USER = "demo";

export async function GET() {
  try {
    const code = await ensureReferralCode(DEMO_USER);
    const stats = await getReferralStats(DEMO_USER);
    return NextResponse.json({
      ...stats,
      code,
      link: getReferralLink(code),
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to get referral data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { refCode } = await req.json();
    if (!refCode) {
      return NextResponse.json({ error: "Missing refCode" }, { status: 400 });
    }
    // In real app, this would be called during sign-up with authenticated user
    return NextResponse.json({ applied: false, message: "Referral applied on sign-up only" });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
