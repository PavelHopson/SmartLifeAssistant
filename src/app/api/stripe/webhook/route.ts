import { NextResponse } from "next/server";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { db } from "@/lib/db";
import { trackEvent } from "@/lib/services/analytics";

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[STRIPE] Webhook signature verification failed:", (err as Error).message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const userId = session.metadata?.userId;
      if (!userId) break;

      const now = new Date();
      await db.user.update({
        where: { id: userId },
        data: {
          plan: "premium",
          planStartedAt: now,
          planExpiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      await trackEvent({
        userId,
        eventType: "upgrade_completed" as any,
        metadata: { source: "stripe", sessionId: session.id },
      });

      console.log(`[STRIPE] User ${userId} upgraded to premium`);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as any;
      const customer = subscription.customer;

      // Find user by Stripe customer ID or metadata
      // For MVP: rely on checkout.session metadata
      console.log(`[STRIPE] Subscription cancelled for customer ${customer}`);
      break;
    }

    default:
      console.log(`[STRIPE] Unhandled event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
