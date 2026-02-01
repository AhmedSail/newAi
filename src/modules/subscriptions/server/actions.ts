"use server";

import { auth } from "@/lib/auth"; // Verify this import
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function createCheckoutUrl(variantId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;

  if (!storeId || !apiKey) {
    throw new Error("Missing Lemon Squeezy configuration");
  }

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: {
              user_id: userId,
            },
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: storeId,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    }),
  });

  const data = await response.json();

  if (data.errors) {
    console.error(data.errors);
    throw new Error("Failed to create checkout");
  }

  return data.data.attributes.url;
}
