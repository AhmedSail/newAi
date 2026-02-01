"use server";

import { db } from "../../../index";
import { videos } from "../../../db/schema";
import { auth } from "../../../../lib/auth";
import { eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import * as crypto from "crypto";
import { syncVideoStatusAction } from "./actions"; // Re-use the logic for single video sync

/**
 * Sync statuses for multiple videos in ONE go.
 * This function processes promises in parallel on the server but
 * only returns the results once all are checked, creating a single HTTP request for the client.
 */
export async function syncVideosStatusBatchAction(videoIds: string[]) {
  if (!videoIds || videoIds.length === 0) return [];

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return [];

  // Limit batch size to prevent server timeout
  const safeVideoIds = videoIds.slice(0, 5);

  console.log(
    `[Batch Sync] Syncing status for ${safeVideoIds.length} videos...`,
  );

  // Run all syncs in parallel
  const results = await Promise.all(
    safeVideoIds.map((id) => syncVideoStatusAction(id)),
  );

  // Return only valid updates
  return results.filter((v) => v !== null);
}
