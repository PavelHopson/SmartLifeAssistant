import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { getStripe, STRIPE_PRICE_ID, isStripeConfigured } from "@/lib/stripe";
import { db } from "@/lib/db";
import { trackEvent } from "@/lib/services/analytics";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const userId = await getCurrentUserId();
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  const stripe = getStripe()!;

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    customer_email: user?.email || undefined,
    metadata: { userId },
    success_url: `${baseUrl}/pricing?success=true`,
    cancel_url: `${baseUrl}/pricing?canceled=true`,
  });

  await trackEvent({
    userId,
    eventType: "stripe_checkout_started" as any,
    metadata: { sessionId: session.id },
  });

  return NextResponse.json({ url: session.url });
}
