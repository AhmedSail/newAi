"use client";

import { useEffect, useState } from "react";
import {
  syncVideoStatusAction,
  getVideoUrlAction,
  deleteVideoAction,
} from "../../server/actions";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Download,
  Play,
  RefreshCw,
  Clock,
  ExternalLink,
  Trash2,
  MoreVertical,
  ShieldCheck,
  Video as VideoIcon,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Video {
  id: string;
  prompt: string;
  status: string;
  progress: number;
  createdAt: Date;
  seconds: string;
  size: string;
  videoUrl?: string | null;
  model: string;
}

export function VideoCard({ video }: { video: Video }) {
  const [status, setStatus] = useState(video.status);
  const [progress, setProgress] = useState(video.progress);
  const [videoUrl, setVideoUrl] = useState(video.videoUrl);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const data = await syncVideoStatusAction(video.id);
      if (data) {
        setStatus(data.status);
        setProgress(data.progress || 0);
        // If it just completed, fetch the URL
        if (data.status === "completed" && !videoUrl) {
          const url = await getVideoUrlAction(video.id);
          if (url) setVideoUrl(url);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch URL on mount if completed but missing
  useEffect(() => {
    if (status === "completed" && !videoUrl) {
      getVideoUrlAction(video.id).then((url) => {
        if (url) setVideoUrl(url);
      });
    }
  }, [status, video.id, videoUrl]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (status === "queued" || status === "processing") {
      interval = setInterval(handleSync, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  const getStatusBadge = () => {
    switch (status) {
      case "completed":
        return (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <Zap className="w-3 h-3 fill-current" />
            إنتاج كامل
          </div>
        );
      case "failed":
        return (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-widest">
            خطأ فني
          </div>
        );
      case "processing":
        return (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/5 border border-white/5 text-cyan-400 text-[9px] font-black uppercase tracking-widest animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            توليد بصري...
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-zinc-500 text-[9px] font-black uppercase tracking-widest">
            في الانتظار
          </div>
        );
    }
  };

  return (
    <div className="group relative rounded-4xl bg-[#0a0a0a] border border-white/5 overflow-hidden transition-all duration-700 hover:border-cyan-500/40 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] hover:-translate-y-2">
      {/* Cinematic Preview Overlay */}
      <div className="aspect-video relative bg-black flex items-center justify-center group-hover:bg-[#030303] transition-colors duration-700">
        <div className="absolute inset-0 bg-linear-to-b from-black/0 via-black/0 to-black/60 z-10 opacity-60 group-hover:opacity-100 transition-opacity" />

        {status === "completed" ? (
          <>
            <Dialog>
              <DialogTrigger asChild>
                <div className="w-full h-full relative cursor-pointer group/vid">
                  {videoUrl ? (
                    <video
                      src={videoUrl}
                      className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-all duration-1000"
                      muted
                      loop
                      onMouseOver={(e) => e.currentTarget.play()}
                      onMouseOut={(e) => e.currentTarget.pause()}
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-zinc-900 to-black opacity-40 group-hover:opacity-60 transition-opacity" />
                  )}

                  {/* Premium Play Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center z-20 transition-all duration-500">
                    <div className="h-16 w-16 rounded-full bg-cyan-500/10 backdrop-blur-3xl border border-cyan-500/30 flex items-center justify-center opacity-0 group-hover/vid:opacity-100 group-hover/vid:scale-110 transition-all duration-700 shadow-[0_0_50px_rgba(34,211,238,0.3)]">
                      <Play className="w-7 h-7 text-cyan-400 fill-cyan-400/20 ml-1.5" />
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-6xl bg-black/95 border-white/5 p-2 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl">
                <DialogHeader className="p-6 pb-0">
                  <DialogTitle className="text-xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3">
                    <VideoIcon className="w-5 h-5 text-cyan-500" />
                    تحفة بصرية: {video.prompt.substring(0, 40)}...
                  </DialogTitle>
                </DialogHeader>
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black mt-4">
                  {videoUrl && (
                    <video
                      src={videoUrl}
                      className="w-full h-full object-contain"
                      controls
                      autoPlay
                    />
                  )}
                </div>
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        Model
                      </span>
                      <span className="text-xs font-bold text-white uppercase">
                        {video.model}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        Format
                      </span>
                      <span className="text-xs font-bold text-white uppercase">
                        {video.size} | {video.seconds}S
                      </span>
                    </div>
                  </div>
                  <Button
                    className="rounded-2xl bg-cyan-500 text-black font-black text-xs uppercase hover:bg-cyan-400"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = videoUrl || "";
                      link.download = `video-${video.id}.mp4`;
                      link.click();
                    }}
                  >
                    تحميل الفيديو بدقة كاملة
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Menu Dropdown */}
            <div className="absolute top-5 left-5 z-30 opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-x-2 group-hover:translate-x-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-2xl text-white hover:bg-cyan-500 hover:text-black hover:border-cyan-500 transition-all"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="bg-[#0a0a0a] border-white/10 text-white rounded-2xl p-2 min-w-[180px] shadow-3xl backdrop-blur-3xl"
                >
                  <DropdownMenuItem
                    className="gap-3 py-3 px-4 focus:bg-rose-500/10 cursor-pointer rounded-xl group/del text-rose-500"
                    onClick={async () => {
                      if (confirm("هل أنت متأكد من حذف هذا الفيديو؟")) {
                        try {
                          await deleteVideoAction(video.id);
                          toast.success("تم حذف الفيديو بنجاح");
                          window.location.reload();
                        } catch (error) {
                          toast.error("فشل في حذف الفيديو");
                        }
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 transition-transform group-hover/del:scale-110" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      حذف المشروع
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-8 p-10 relative z-10 w-full group/loading">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 blur-[60px] animate-pulse rounded-full" />
              <VideoIcon className="w-20 h-20 text-zinc-900 transition-colors duration-700 group-hover/loading:text-cyan-950" />
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-cyan-500/40 animate-spin" />
              </div>
            </div>

            <div className="w-full max-w-[240px] space-y-5">
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
                <div
                  className="h-full bg-linear-to-r from-cyan-400 via-blue-500 to-cyan-400 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(34,211,238,0.6)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500/50 italic">
                  Processing Node
                </span>
                <span className="text-[12px] font-black text-white italic">
                  {progress}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Specs Tag */}
        <div className="absolute top-5 right-5 z-20">
          <div className="px-3.6 py-1.5 rounded-xl bg-black/60 backdrop-blur-2xl border border-white/10 text-[9px] font-black text-zinc-400 uppercase tracking-widest shadow-2xl">
            {video.size} <span className="mx-1.5 opacity-20 text-white">|</span>{" "}
            {video.seconds}S
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8 space-y-8">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            {getStatusBadge()}
            <div className="flex items-center gap-2 text-zinc-600">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black tracking-widest uppercase italic">
                {formatDistanceToNow(new Date(video.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-lg font-black text-white/90 leading-relaxed line-clamp-2 h-14 group-hover:text-cyan-400 transition-colors duration-500 italic tracking-tight">
              "{video.prompt}"
            </p>
            <div className="h-[2px] w-8 bg-cyan-500/20 group-hover:w-full transition-all duration-700" />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          {status === "completed" ? (
            <>
              <Button
                className="flex-1 rounded-[1.25rem] bg-white text-black hover:bg-cyan-400 font-black text-xs uppercase tracking-tighter h-13 transition-all active:scale-95 shadow-2xl group/dl"
                onClick={() => {
                  window.location.href = `/api/videos/${video.id}/download`;
                  toast.success("بدأ تحميل التحفة الفنية", {
                    className: "bg-cyan-400 text-black font-black",
                  });
                }}
              >
                <Download className="ml-2.5 h-4 w-4 transition-transform group-hover/dl:-translate-y-1" />
                تصدير الفيديو
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-13 w-13 rounded-[1.25rem] border-white/5 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/30 text-white transition-all shrink-0 shadow-2xl"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="w-full rounded-[1.25rem] border-white/5 bg-white/3 text-zinc-700 font-black text-[10px] h-13 tracking-widest uppercase transition-all cursor-wait italic"
              disabled
            >
              <RefreshCw
                className={`ml-3 h-4 w-4 ${status === "processing" ? "animate-spin" : ""}`}
              />
              جاري التحليل الزمني للفريمات
            </Button>
          )}
        </div>
      </div>

      {/* Bottom ID label */}
      <div className="absolute bottom-2 right-8 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none">
        <span className="text-[10px] font-black text-white uppercase italic tracking-[1em]">
          {video.id}
        </span>
      </div>
    </div>
  );
}

export function VideoList({ videos }: { videos: any[] }) {
  return (
    <>
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </>
  );
}
