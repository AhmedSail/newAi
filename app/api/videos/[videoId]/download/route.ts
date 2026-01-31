import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/src";
import { videos } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const session = await auth.api.getSession({
    headers: await nextHeaders(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { videoId } = await params;

  try {
    // Fetch video from database
    const video = await db.query.videos.findFirst({
      where: eq(videos.id, videoId),
    });

    if (!video) {
      return new NextResponse("Video not found", { status: 404 });
    }

    if (!video.videoUrl) {
      return new NextResponse("Video content not available", { status: 400 });
    }

    // Check if it's a base64 data URL
    if (video.videoUrl.startsWith("data:")) {
      // Extract the base64 data
      const base64Data = video.videoUrl.split(",")[1];
      const mimeType = video.videoUrl.split(";")[0].split(":")[1];

      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, "base64");

      // Determine file extension
      const extension = mimeType.includes("video") ? "mp4" : "png";

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename="generated-${videoId}.${extension}"`,
        },
      });
    } else {
      // If it's a URL, redirect to it
      return NextResponse.redirect(video.videoUrl);
    }
  } catch (error) {
    console.error("Download Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
