import { db } from "@/src";
import { subscriptions, user, webhookEvents } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = (await headers()).get("x-signature") || "";

  if (!WEBHOOK_SECRET) {
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  // Verify signature
  const hmac = require("crypto").createHmac("sha256", WEBHOOK_SECRET);
  const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (!require("crypto").timingSafeEqual(digest, signatureBuffer)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventName = payload.meta.event_name;
  const customData = payload.meta.custom_data;

  // Log the event
  await db.insert(webhookEvents).values({
    id: crypto.randomUUID(),
    eventName,
    payload: JSON.stringify(payload),
  });

  const userId = customData?.user_id;

  if (!userId) {
    console.error("No user ID found in custom data");
    return new NextResponse("No user ID", { status: 200 }); // Still return 200 to acknowledgeLS
  }

  switch (eventName) {
    case "order_created":
      // Order created doesn't necessarily mean it's paid yet if it's a subscription
      // But for a simple credit purchase, this is where we add credits
      const variantId = payload.data.attributes.variant_id;

      // Example logic: Define credits per variant
      // Update credits based on the plan variant
      let creditsToAdd = 0;
      const starterVariantId =
        process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_STARTER;
      const proVariantId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_PRO;

      // Note: variant_id from LS comes as number or string, be careful with comparison
      const initialVariantId = payload.data.attributes.variant_id.toString();

      if (starterVariantId && initialVariantId === starterVariantId) {
        creditsToAdd = 300;
      } else if (proVariantId && initialVariantId === proVariantId) {
        creditsToAdd = 1000;
      }

      if (creditsToAdd > 0) {
        const currentUser = await db.query.user.findFirst({
          where: eq(user.id, userId),
        });

        if (currentUser) {
          await db
            .update(user)
            .set({ credits: (currentUser.credits || 0) + creditsToAdd })
            .where(eq(user.id, userId));
        }
      }
      break;

    case "subscription_created":
    case "subscription_updated":
      const subscription = payload.data.attributes;
      await db
        .insert(subscriptions)
        .values({
          id: crypto.randomUUID(),
          userId,
          lemonSqueezyId: payload.data.id.toString(),
          orderId: subscription.order_id,
          status: subscription.status,
          variantId: subscription.variant_id.toString(),
          subscriptionId: payload.data.id.toString(),
        })
        .onConflictDoUpdate({
          target: subscriptions.lemonSqueezyId,
          set: {
            status: subscription.status,
            variantId: subscription.variant_id.toString(),
            updatedAt: new Date(),
          },
        });
      break;

    default:
      console.log(`Unhandled event: ${eventName}`);
  }

  return new NextResponse("Webhook received", { status: 200 });
}
