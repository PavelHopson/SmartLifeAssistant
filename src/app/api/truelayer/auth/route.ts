import { NextResponse } from "next/server";
import { getAuthLink } from "@/lib/truelayer/client";
import crypto from "crypto";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");
  // In production: store state in session for CSRF validation
  const authUrl = getAuthLink(state);
  return NextResponse.redirect(authUrl);
}
