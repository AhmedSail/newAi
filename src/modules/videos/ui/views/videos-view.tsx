"use client";

import { useEffect, useState } from "react";
import { VideoForm } from "../components/video-form";
import { VideoList } from "../components/video-list";
import { getVideosAction, syncVideoStatusAction } from "../../server/actions";
import { syncVideosStatusBatchAction } from "../../server/batch-actions";
import { getUserCreditsAction } from "@/src/modules/users/server/actions";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Sparkles,
  Video,
  Film,
  Wand2,
  LogOut,
  User,
  Zap,
  LayoutGrid,
  Settings,
  Bell,
  Search,
  Waves,
  Coins,
  Crown,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export default function VideosView() {
  const router = useRouter();
  const [videos, setVideos] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);

  const fetchCredits = async () => {
    try {
      const userCredits = await getUserCreditsAction();
      setCredits(userCredits);
    } catch (error) {
      console.error("Error fetching credits:", error);
    }
  };

  const fetchVideos = async () => {
    try {
      const data = await getVideosAction();
      setVideos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoSuccess = (newVideo?: any) => {
    fetchCredits(); // Refresh credits after generation
    if (newVideo) {
      // Add new video to top of list instantly
      setVideos((prev) => [newVideo, ...prev]);
    } else {
      fetchVideos();
    }
  };

  useEffect(() => {
    fetchVideos();
    fetchCredits();
  }, []);

  // Bulk Polling Logic (Smart & Efficient)
  useEffect(() => {
    // Only poll if there are actually videos processing
    const processingVideoIds = videos
      .filter((v) => v.status === "processing")
      .map((v) => v.id);

    if (processingVideoIds.length === 0) return;

    // Use a longer interval to be kind to the server (e.g., 5 seconds)
    const interval = setInterval(async () => {
      try {
        console.log(
          "[Smart Poll] Checking status for:",
          processingVideoIds.length,
          "videos",
        );

        // ONE request for ALL videos
        const updatedList =
          await syncVideosStatusBatchAction(processingVideoIds);

        if (updatedList && updatedList.length > 0) {
          setVideos((prevVideos) => {
            const newVideos = [...prevVideos];
            let changed = false;

            updatedList.forEach((updatedVideo) => {
              if (!updatedVideo) return; // Skip if null/undefined
              const index = newVideos.findIndex(
                (v) => v.id === updatedVideo.id,
              );
              if (index !== -1) {
                // Only update if something actually changed
                if (
                  newVideos[index].status !== updatedVideo.status ||
                  newVideos[index].progress !== updatedVideo.progress ||
                  newVideos[index].videoUrl !== updatedVideo.videoUrl
                ) {
                  newVideos[index] = updatedVideo;
                  changed = true;
                }
              }
            });

            return changed ? newVideos : prevVideos;
          });
        }
      } catch (err) {
        console.error("Batch polling error:", err);
      }
    }, 5000); // 5 Seconds Interval (Much better than 3s per video)

    return () => clearInterval(interval);
  }, [videos]); // Re-run effect when videos list changes (e.g. status updates)

  return (
    <div
      className="flex flex-col min-h-screen bg-[#020202] text-zinc-100 selection:bg-cyan-500/40 pb-12 overflow-x-hidden font-sans"
      dir="rtl"
    >
      {/* Dynamic Cyber Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-500/10 blur-[180px] animate-pulse transition-all duration-1000" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[200px] animate-pulse delay-700" />
        <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] rounded-full bg-cyan-700/5 blur-[150px] animate-bounce-slow" />

        {/* Subtle Noise & Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Cyber Header */}
      <header className="sticky top-0 z-100 w-full border-b border-white/5 bg-black/60 backdrop-blur-3xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
        <div className="max-w-[1700px] mx-auto flex h-20 items-center justify-between px-6 lg:px-12">
          {/* Brand Identity */}
          <div className="flex items-center gap-10">
            <div
              className="flex items-center gap-4 group cursor-pointer"
              onClick={() => router.push("/")}
            >
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="Veo AI Logo"
                  width={150}
                  height={150}
                  className="w-[150px] h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Credits Display */}
            {credits !== null && (
              <div className="hidden lg:flex items-center gap-4 bg-zinc-900/50 border border-white/5 rounded-full px-5 py-2 ml-8">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-bold text-white tabular-nums">
                    {credits}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    Credits
                  </span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-auto p-0 text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 hover:bg-transparent"
                  onClick={() => router.push("/pricing")}
                >
                  Get More
                </Button>
              </div>
            )}

            {/* Nav Links */}
            <nav className="hidden xl:flex items-center gap-2 ml-10">
              {[{ label: "الاستوديو", icon: Wand2, active: true }].map(
                (item) => (
                  <button
                    key={item.label}
                    className={`flex items-center gap-3 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 border ${
                      item.active
                        ? "bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.1)] border-cyan-500/20 italic"
                        : "text-zinc-500 hover:text-white hover:bg-white/5 border-transparent"
                    }`}
                  >
                    <item.icon
                      className={`h-4 w-4 ${item.active ? "text-cyan-400" : ""}`}
                    />
                    {item.label}
                  </button>
                ),
              )}
            </nav>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-3 lg:gap-8">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-2xl hover:bg-white/5 text-zinc-500 hover:text-cyan-400 transition-all"
            >
              <Bell className="h-5 w-5" />
            </Button>

            <Button
              className="hidden sm:flex bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-[0_0_20px_rgba(245,158,11,0.2)] rounded-xl font-bold uppercase tracking-widest text-[10px] h-11 px-6 items-center gap-2"
              onClick={() => router.push("/pricing")}
            >
              <Crown className="h-4 w-4" />
              <span>Upgrade</span>
            </Button>

            <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group relative">
                  <div className="absolute -inset-1 rounded-full bg-linear-to-r from-cyan-400 to-blue-600 opacity-40 blur-xs group-hover:opacity-100 transition duration-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]" />
                  <div className="relative p-[2px] rounded-full bg-black leading-none">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 overflow-hidden border border-white/10">
                      <User className="h-5 w-5 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 mt-2 bg-black/90 backdrop-blur-3xl border-white/10 text-white shadow-2xl rounded-2xl p-2 font-sans"
              >
                <DropdownMenuLabel className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-black italic tracking-tighter">
                      حساب المشترك
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(34,211,238,1)]" />
                      <span className="text-[10px] text-cyan-500/80 uppercase tracking-widest font-black">
                        Verified VEO Master
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5 mx-2" />
                <DropdownMenuItem className="py-3 px-5 focus:bg-cyan-500/10 cursor-pointer rounded-xl transition-all group/item m-1">
                  <Settings className="ml-3 h-4 w-4 text-zinc-500 group-hover/item:text-cyan-400" />
                  <span className="text-sm font-black text-zinc-300 group-hover/item:text-white">
                    مركز التحكم
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="py-3 px-5 focus:bg-rose-500/10 cursor-pointer text-rose-500 focus:text-rose-400 rounded-xl transition-all m-1 mt-2"
                  onClick={() =>
                    authClient.signOut({
                      fetchOptions: {
                        onSuccess: () => router.push("/sign-in"),
                      },
                    })
                  }
                >
                  <LogOut className="ml-3 h-4 w-4" />
                  <span className="text-sm font-black">تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1700px] mx-auto w-full px-6 lg:px-12 py-10">
        <div className="flex flex-col xl:flex-row gap-16">
          {/* Main Control Panel - Right Side */}
          <aside className="xl:w-[440px] shrink-0">
            <div className="xl:sticky xl:top-36 space-y-10">
              {/* Inspiration Header */}
              <div className="relative group/side px-2">
                <div className="absolute -inset-10 bg-cyan-500/5 rounded-[4rem] blur-3xl opacity-0 group-hover/side:opacity-100 transition duration-1000" />
                <div className="relative space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.2)] rotate-12 group-hover/side:rotate-0 transition-transform">
                      <Zap className="h-6 w-6 fill-current" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black tracking-tighter text-white leading-none">
                        الإعدادات
                      </h2>
                      <p className="text-[10px] font-bold text-zinc-600 tracking-[0.3em] mt-1.5 uppercase">
                        Neural Forge Node
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Form Container */}
              <div className="relative">
                <div className="absolute -inset-4 rounded-4xl bg-linear-to-b from-white/5 to-transparent opacity-100 ring-1 ring-white/5" />
                <div className="relative">
                  <VideoForm onSuccess={handleVideoSuccess} />
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-8 rounded-4xl bg-linear-to-br from-cyan-500/10 via-blue-500/5 to-transparent border border-white/5 relative overflow-hidden group/stats">
                <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 blur-2xl -translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-1000" />
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-cyan-400 group-hover:animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
                      System Priority
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-white italic tracking-tight">
                    معالجة فورية فائقة
                  </h4>
                  <p className="text-xs text-zinc-500 font-bold leading-relaxed">
                    يتم تخصيص موارد GPU متميزة لحسابك لضمان أقل وقت انتظار ممكن
                    لتوليد فيديوهات Veo.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Content Space - Left Side */}
          <section className="flex-1 min-w-0">
            {/* Gallery Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-16 border-b border-white/5 pb-10">
              <div className="space-y-4">
                <div className="flex items-center gap-5">
                  <div className="h-10 w-2 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(34,211,238,1)]" />
                  <h2 className="text-5xl font-black tracking-tighter text-white leading-none italic uppercase">
                    Studio
                  </h2>
                </div>
                <p className="text-sm font-bold text-zinc-600 mr-12 tracking-wide">
                  أرشيف الإبداع الرقمي المولّد عبر عقل{" "}
                  <span className="text-cyan-400 border-b border-cyan-500/30">
                    GEMINI
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-5">
                <div className="flex items-center bg-black border border-white/5 rounded-2xl p-1.5 shadow-2xl">
                  <button className="px-7 py-3 text-[10px] font-black uppercase tracking-widest text-white bg-cyan-500/20 rounded-[14px] border border-cyan-500/30 italic">
                    الجميع
                  </button>
                </div>
                <div className="h-12 px-6 flex items-center bg-black border border-white/5 rounded-2xl shadow-inner group/count">
                  <span className="text-[11px] font-black text-zinc-600 uppercase tracking-widest leading-none">
                    Storage:{" "}
                    <span className="text-cyan-400 ml-1 group-hover:scale-110 transition-transform inline-block">
                      {videos.length}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="relative min-h-[700px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center pt-48 space-y-10">
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500/30 blur-2xl rounded-full animate-pulse" />
                    <Spinner className="h-20 w-20 text-cyan-400 relative" />
                  </div>
                  <div className="text-center space-y-3">
                    <p className="text-xl font-black text-white italic tracking-tighter animate-pulse uppercase">
                      Establishing Neural Link...
                    </p>
                    <p className="text-[10px] font-black text-zinc-700 tracking-[0.5em] uppercase">
                      Security Clearance: Green
                    </p>
                  </div>
                </div>
              ) : videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center pt-48 space-y-12 group/empty">
                  <div className="flex h-40 w-40 items-center justify-center rounded-4xl bg-black border border-white/5 shadow-3xl relative group-hover:border-cyan-500/30 transition-all duration-700 scale-110">
                    <Film className="h-16 w-16 text-zinc-800 transition-colors group-hover:text-zinc-700" />
                    <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-3xl bg-cyan-400 text-black shadow-[0_0_30px_rgba(34,211,238,0.5)] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Video className="h-8 w-8 fill-black" />
                    </div>
                  </div>
                  <div className="text-center space-y-4">
                    <h3 className="text-4xl font-black text-white/40 leading-none tracking-tighter italic">
                      مساحة إبداعية خاملة
                    </h3>
                    <p className="text-base font-bold text-zinc-700 max-w-[400px] mx-auto leading-relaxed">
                      لم يتم حقن أي بيانات بصرية بعد. استخدم وحدة التحكم
                      الجانبية لبدء أول مشروع انتاج لـ{" "}
                      <span className="text-zinc-500 underline decoration-cyan-500/20 underline-offset-8">
                        VEO 3.1
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-10">
                  <VideoList videos={videos} />
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Cyber Footer */}
      <footer className="mt-auto py-12 border-t border-white/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-8 px-10 py-4 rounded-full bg-black border border-white/5 backdrop-blur-3xl shadow-2xl transition-all hover:border-cyan-500/20">
            <span className="text-[10px] font-black text-zinc-600 tracking-[0.3em] uppercase">
              Core Engine
            </span>
            <div className="flex items-center gap-6 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
              <span className="text-[11px] font-black text-white tracking-widest italic leading-none">
                GOOGLE GEMINI 2.0
              </span>
              <div className="h-4 w-px bg-white/10" />
              <span className="text-[11px] font-black text-white tracking-widest italic leading-none uppercase">
                Veo Pro Platform
              </span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-zinc-800 tracking-[0.4em] uppercase">
            © 2026 Oukida AI Systems • All Nodes Operational
          </p>
        </div>
      </footer>
    </div>
  );
}
