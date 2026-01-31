"use server";

import { db } from "../../../index";
import { videos } from "../../../db/schema";
import { auth } from "../../../../lib/auth";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

/**
 * Generates a Google Access Token using the Service Account JSON
 */
async function getGoogleAccessToken() {
  try {
    const key = JSON.parse(process.env.GCP_SERVICE_ACCOUNT || "");

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;

    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      exp,
      iat,
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
      "base64url",
    );
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      "base64url",
    );
    const input = `${encodedHeader}.${encodedPayload}`;

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(input);
    const signature = signer.sign(key.private_key, "base64url");

    const jwt = `${input}.${signature}`;

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error generating Access Token:", error);
    return null;
  }
}

export async function createVideoAction(formData: FormData) {
  const allHeaders = await headers();
  const session = await auth.api.getSession({
    headers: allHeaders,
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const prompt = formData.get("prompt") as string;
  const model = (formData.get("model") as string) || "veo-3";
  const seconds = (formData.get("seconds") as string) || "5";
  const size = (formData.get("size") as string) || "1280x720";

  const videoId = `vid_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  try {
    // Create the video record
    const [newVideo] = await db
      .insert(videos)
      .values({
        id: videoId,
        userId: session.user.id,
        prompt: prompt,
        model: model,
        seconds: seconds,
        size: size,
        status: "processing",
        progress: 10,
        videoUrl: null,
      })
      .returning();

    console.log("Starting production with Google Gemini/Veo 3 Architecture...");

    // Support both naming conventions for the API key/token
    const apiKey = process.env.GEMINI_API || process.env.GEMINI_API_KEY || "";
    const isToken = apiKey.startsWith("AQ.") || apiKey.startsWith("ya29.");

    const projectID = "gen-lang-client-0051716704";
    const location = "us-central1";

    // Step 1: Use Gemini 2.0 Flash to enhance and optimize the prompt for Veo 3
    let optimizedPrompt = prompt;
    const generateAudio = formData.get("generateAudio") === "true";
    const preset = formData.get("preset") as string;
    const translatePrompt = formData.get("translatePrompt") === "true";

    const PRESET_INSTRUCTIONS: Record<string, string> = {
      hug: "EFFECT: AI Hug. Ensure two people are embracing/hugging each other warmly.",
      kiss: "EFFECT: AI Kiss. Ensure a romantic and gentle kiss between two people.",
      dance:
        "EFFECT: AI Dance. Ensure the subject is performing fluid dance movements.",
      laugh:
        "EFFECT: AI Laugh. Ensure the subject has a wide, joyful, and realistic laugh with visible facial expressions.",
      "zoom-in":
        "TECHNIQUE: Cinematic Zoom. The camera must slowly and dramatically zoom into the subject.",
      retro:
        "STYLE: Retro 16mm Film. Use vintage colors, grain, and nostalgic lighting.",
      dissolve:
        "EFFECT: Magical Dissolve. The subject should realistically dissolve into glowing particles or smoke.",
    };

    try {
      const oauthToken = await getGoogleAccessToken();
      if (oauthToken) {
        console.log("[VEO DEBUG] Optimizing prompt via Vertex Gemini...");
        const geminiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectID}/locations/${location}/publishers/google/models/gemini-2.0-flash:streamGenerateContent`;

        const geminiResponse = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${oauthToken}`,
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `You are an expert Arabic-to-English Cinematic Director for Google Veo 3.1.
                Your goal is to ${translatePrompt ? "translate, expand, and refine" : "verify and refine"} user requests into high-end, SAFE, English cinematic prompts.
                
                ${preset && preset !== "none" ? `SPECIAL INSTRUCTION: ${PRESET_INSTRUCTIONS[preset] || ""}` : ""}

                STRICT PROTOCOL:
                1. LANGUAGE: ${translatePrompt ? "Translate the user's input to English if it is in Arabic, and expand it with cinematic details." : "Keep the core meaning of the user input, but ensure it is in professional cinematic English."}
                2. ARABIC CONTEXT: If the user writes in Arabic or specifies an Arabic context, ensure the subject has Middle Eastern/Arabic features and context unless specified otherwise.
                3. GENDER LOCK: You MUST stick to the gender in the user input. (e.g., 'شاب' = Young MAN, 'فتاة' = Young WOMAN). NEVER swap them.
                4. SAFETY & COMPLIANCE: Use artistic language that avoids triggering Vertex AI safety filters. Avoid overly detailed physical descriptions that might be flagged. Focus on "Cinematic", "Professional", and "Artistic".
                5. SPEECH & AUDIO: If the user mentions dialogue (e.g., 'السلام عليكم'):
                   - Visuals: "The subject is speaking clear Arabic, visible lip synchronization, friendly facial expression."
                   - ${generateAudio ? "Audio: Describe a 'warm, clear male/female voice speaking Arabic' to guide the audio engine." : ""}
                6. TECHNIQUE: Specify camera lens (e.g., 35mm), soft volumetric lighting, and 8K photorealistic textures.
                
                USER INPUT: ${prompt}`,
                  },
                ],
              },
            ],
          }),
        });

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          // Extract text from Vertex Gemini response format
          const candidate = geminiData.candidates?.[0]; // generateContent response format
          if (candidate?.content?.parts?.[0]?.text) {
            optimizedPrompt = candidate.content.parts[0].text.trim();
            console.log("-----------------------------------------");
            console.log("[VEO ENHANCED PROMPT]:", optimizedPrompt);
            console.log("-----------------------------------------");
          }
        }
      }
    } catch (geminiError) {
      console.warn(
        "[VEO DEBUG] Gemini Enhancement failed, using raw prompt.",
        geminiError,
      );
    }

    // Step 2: Process multiple reference images
    const imageFiles = formData.getAll("input_reference") as File[];
    const referenceImages: { base64: string; mimeType: string }[] = [];

    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        referenceImages.push({
          base64: base64,
          mimeType: file.type || "image/png", // Fallback to image/png
        });
      }
    }

    // Step 3: Real Vertex AI Veo 3.1 Integration (using Service Account Token)
    // (projectID and location are defined at the top of this scope)

    // Generate fresh Access Token for this request
    const oauthToken = await getGoogleAccessToken();
    if (!oauthToken)
      throw new Error(
        "فشل توليد مفتاح الوصول (OAuth Token). تأكد من صحة ملف service-account.json",
      );

    const baseUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectID}/locations/${location}/publishers/google/models/${model}`;
    const predictUrl = `${baseUrl}:predictLongRunning`;

    console.log(
      `Vertex API Request: Initiating Veo 3.1 via Service Account with ${referenceImages.length} images`,
    );

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${oauthToken}`,
    };

    // Construct request body with images if provided
    const instance: any = { prompt: optimizedPrompt };

    // For Veo 3.1, reference images are usually passed as 'images' or 'input_reference'
    if (referenceImages.length > 0) {
      if (referenceImages.length === 1) {
        instance.image = {
          mimeType: referenceImages[0].mimeType,
          bytesBase64Encoded: referenceImages[0].base64,
        };
      } else {
        instance.reference_images = referenceImages.map((img) => ({
          mimeType: img.mimeType,
          bytesBase64Encoded: img.base64,
        }));
      }
    }

    const sizeValue = formData.get("size") as string;
    let aspectRatio = "16:9";
    if (sizeValue === "720x1280") aspectRatio = "9:16";
    else if (sizeValue === "1080x1080") aspectRatio = "1:1";
    else if (sizeValue === "4:3") aspectRatio = "4:3";
    else if (sizeValue === "3:4") aspectRatio = "3:4";
    else if (sizeValue === "21:9") aspectRatio = "21:9";
    else if (sizeValue === "auto") aspectRatio = "16:9"; // Default or auto logic

    const response = await fetch(predictUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        instances: [instance],
        parameters: {
          sampleCount: 1,
          durationSeconds: parseInt(seconds) || 5,
          generateAudio: formData.get("generateAudio") === "true",
          resolution: formData.get("resolution") || "720p",
          aspectRatio: aspectRatio,
          personGeneration: "allow_all",
          includeRaiReason: true,
          addWatermark: true,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || "";

      if (errorMessage.includes("billing")) {
        throw new Error(
          "تنبيه: محرك Veo 3.1 يتطلب تفعيل نظام الدفع (Billing) في حساب Google Cloud الخاص بك. يرجى تفعيله للمتابعة.",
        );
      }

      throw new Error(
        `خطأ في محرك Vertex (${response.status}): ${errorMessage}`,
      );
    }

    const operation = await response.json();
    const operationName = operation.name;
    console.log(`Vertex Operation Started: ${operationName}`);

    // Update the video record with the operation name and return immediately
    const [updatedVideo] = await db
      .update(videos)
      .set({
        vertexOperationName: operationName,
        status: "processing",
        progress: 10,
      })
      .where(eq(videos.id, videoId))
      .returning();

    return updatedVideo;
  } catch (error: any) {
    console.error("Gemini/Veo API Error:", error);
    // Attempt to mark as failed in DB if we have a videoId
    try {
      await db
        .update(videos)
        .set({ status: "failed" })
        .where(eq(videos.id, videoId));
    } catch {}
    throw new Error(
      `فشل في الاتصال بمحرك Gemini: ${error.message || "خطأ غير معروف"}`,
    );
  }
}

/**
 * Action to sync/check the status of a long-running Vertex AI operation from the client
 */
export async function syncVideoStatusAction(videoId: string) {
  try {
    const video = await db.query.videos.findFirst({
      where: eq(videos.id, videoId),
    });

    if (!video || video.status !== "processing") {
      return video;
    }

    // If a video is stuck in processing without an operation name for more than 1 hour, fail it.
    if (!video.vertexOperationName) {
      const hourAgo = new Date(Date.now() - 3600000);
      if (video.createdAt < hourAgo) {
        await db
          .update(videos)
          .set({ status: "failed" })
          .where(eq(videos.id, videoId));
        return { ...video, status: "failed" };
      }
      return video;
    }

    const oauthToken = await getGoogleAccessToken();
    if (!oauthToken) return video;

    const location = "us-central1";
    const projectID = "gen-lang-client-0051716704";
    // For Publisher Models (Veo), we must use the specific fetchPredictOperation endpoint
    const pollUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectID}/locations/${location}/publishers/google/models/${video.model}:fetchPredictOperation`;

    console.log(
      `[VEO DEBUG] Polling ${videoId} via POST :fetchPredictOperation`,
    );

    const pollResponse = await fetch(pollUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${oauthToken}`,
      },
      body: JSON.stringify({ operationName: video.vertexOperationName }),
    });

    const contentType = pollResponse.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await pollResponse.text();
      console.error(
        `[VEO DEBUG] Non-JSON response for ${videoId}:`,
        text.substring(0, 500),
      );
      return video; // Keep processing, maybe temporary
    }

    const pollData = await pollResponse.json();
    const specificError = pollData.error
      ? pollData.error.message || JSON.stringify(pollData.error)
      : "None";
    console.log(
      `[VEO DEBUG] Status for ${videoId}: done=${pollData.done}, hasError=${!!pollData.error}, ErrorMsg: ${specificError}`,
    );

    if (pollData.error) {
      const errorCode = pollData.error.code;
      const errorMsg = specificError;

      // Only retry/wait if the operation is NOT done.
      // If it's done and has an error, that specific operation instance is dead.
      if (
        !pollData.done &&
        (errorCode === 8 || errorMsg.includes("high load") || errorCode === 4)
      ) {
        return video;
      }

      console.error(`[VEO DEBUG] Failure for ${videoId}:`, errorMsg);
      await db
        .update(videos)
        .set({ status: "failed" })
        .where(eq(videos.id, videoId));
      return { ...video, status: "failed" };
    }

    if (pollData.done) {
      const result = pollData.response || pollData;
      // We requested 4 samples (sampleCount: 4), we'll pick the first successful one for now
      // to avoid 'Response too large' errors in the DB.
      if (result.videos && result.videos.length > 0) {
        const videoData = result.videos[0];

        const finalUrl = videoData.bytesBase64Encoded
          ? `data:video/mp4;base64,${videoData.bytesBase64Encoded}`
          : videoData.gcsUri;

        await db
          .update(videos)
          .set({
            status: "completed",
            progress: 100,
            videoUrl: finalUrl,
            completedAt: new Date(),
          })
          .where(eq(videos.id, videoId));

        return {
          ...video,
          status: "completed",
          progress: 100,
          videoUrl: finalUrl,
        };
      } else {
        console.warn(
          `[VEO DEBUG] Operation done but no video found in response for ${videoId}`,
        );
        await db
          .update(videos)
          .set({ status: "failed" })
          .where(eq(videos.id, videoId));
        return { ...video, status: "failed" };
      }
    }

    // Still processing, increment progress slightly
    const currentProgress = video.progress || 10;
    const nextProgress = Math.min(99, currentProgress + 2); // Faster visual progress

    await db
      .update(videos)
      .set({ progress: nextProgress })
      .where(eq(videos.id, videoId));
    return { ...video, progress: nextProgress };
  } catch (error) {
    console.error("Check Status External Error:", error);
    return null;
  }
}

export async function getVideosAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Fetch all columns EXCEPT videoUrl to keep response size safe
  return await db
    .select({
      id: videos.id,
      userId: videos.userId,
      prompt: videos.prompt,
      model: videos.model,
      seconds: videos.seconds,
      size: videos.size,
      status: videos.status,
      progress: videos.progress,
      createdAt: videos.createdAt,
      completedAt: videos.completedAt,
      vertexOperationName: videos.vertexOperationName,
    })
    .from(videos)
    .where(eq(videos.userId, session.user.id))
    .orderBy(desc(videos.createdAt))
    .limit(50);
}

/**
 * Fetches only the video URL for a specific video ID (Lazy loading)
 */
export async function getVideoUrlAction(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const video = await db.query.videos.findFirst({
    where: eq(videos.id, id),
    columns: {
      videoUrl: true,
    },
  });

  return video?.videoUrl;
}

export async function deleteVideoAction(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  await db.delete(videos).where(eq(videos.id, id));
  return { success: true };
}

export async function deleteLastVideoAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const lastVideo = await db.query.videos.findFirst({
    where: eq(videos.userId, session.user.id),
    orderBy: [desc(videos.createdAt)],
  });

  if (lastVideo) {
    await db.delete(videos).where(eq(videos.id, lastVideo.id));
    return { success: true, deletedId: lastVideo.id };
  }

  return { success: false, message: "No videos found" };
}
