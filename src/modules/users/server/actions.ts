"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/src";
import { user } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function getUserCreditsAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return 0; // Or null, handle as needed
  }

  const userData = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: {
      credits: true,
    },
  });

  return userData?.credits || 0;
}
