"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createVideoAction } from "../../server/actions";
import {
  Loader2,
  Cpu,
  Zap,
  CheckCircle2,
  Save,
  Trash2,
  HelpCircle,
  Sparkles,
  Heart,
  HeartPulse,
  Music,
  Smile,
  Maximize,
  Film,
  Wind,
  Image as ImageIcon,
  Video as VideoIcon,
  X,
  Plus,
} from "lucide-react";

const MAGIC_PRESETS = [
  { id: "none", label: "None", icon: Sparkles },
  { id: "hug", label: "AI Hug", icon: Heart },
  { id: "kiss", label: "AI Kiss", icon: HeartPulse },
  { id: "dance", label: "AI Dance", icon: Music },
  { id: "laugh", label: "AI Laugh", icon: Smile },
  { id: "zoom-in", label: "Zoom In", icon: Maximize },
  { id: "retro", label: "Retro", icon: Film },
  { id: "dissolve", label: "Dissolve", icon: Wind },
];

const formSchema = z.object({
  prompt: z.string().min(3, "يجب أن يكون الوصف 3 أحرف على الأقل"),
  model: z.string(),
  generateAudio: z.boolean(),
  resolution: z.string(),
  videoLength: z.string(),
  size: z.string(),
  preset: z.string(),
  translatePrompt: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function VideoForm({ onSuccess }: { onSuccess: (video?: any) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      model: "veo-3.1-generate-001",
      videoLength: "4",
      size: "1280x720",
      generateAudio: true,
      resolution: "720p",
      preset: "none",
      translatePrompt: false,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("prompt", values.prompt);
      formData.append("model", values.model);
      formData.append("seconds", values.videoLength);
      formData.append("size", values.size);
      formData.append("generateAudio", values.generateAudio.toString());
      formData.append("resolution", values.resolution);
      formData.append("preset", values.preset);
      formData.append("translatePrompt", values.translatePrompt.toString());

      files.forEach((file) => {
        formData.append("input_reference", file);
      });

      const result = await createVideoAction(formData);
      toast.success("تم إرسال الطلب بنجاح", {
        icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
      });
      form.reset();
      setFiles([]);
      setTimeout(() => onSuccess(result), 800);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل في التواصل");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full mx-auto bg-[#0d0d0d] text-gray-200 p-8 rounded-2xl space-y-8 shadow-2xl border border-gray-900/50"
      >
        {/* Header & Model Selector */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-gray-500">
            Text to Video
          </h1>
          <div className="relative">
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-[200px] bg-[#1a1a1a] border-gray-800 text-xs h-10 rounded-lg focus:ring-1 focus:ring-gray-700 transition-all">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-gray-800 rounded flex items-center justify-center">
                            <Cpu className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                          <SelectValue placeholder="Model" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#1a1a1a] border-gray-800 text-gray-300">
                      <SelectItem value="veo-3.1-generate-001">
                        Google Veo 3.1 Pro
                      </SelectItem>
                      <SelectItem value="veo-3.1-fast-generate-001">
                        Google Veo 3.1 Turbo
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <div className="absolute -top-2 -right-1 bg-red-600 px-1.5 py-0.5 rounded text-[8px] font-black text-white shadow-xl animate-pulse pointer-events-none z-20">
              NEW
            </div>
          </div>
        </div>

        {/* Magic Presets Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Magic Presets
            </span>
          </div>
          <FormField
            control={form.control}
            name="preset"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-4 gap-2">
                  {MAGIC_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => field.onChange(preset.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 ${
                        field.value === preset.id
                          ? "bg-white/5 border-white/20 text-white shadow-lg scale-105"
                          : "bg-transparent border-white/5 text-gray-600 hover:border-white/10"
                      }`}
                    >
                      <preset.icon
                        className={`w-4 h-4 mb-2 ${field.value === preset.id ? "text-yellow-500" : "text-gray-700"}`}
                      />
                      <span className="text-[10px] font-bold">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Media References Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Media References
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all group"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-gray-300">
                Add Media
              </span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*,video/*"
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden shadow-inner"
              >
                {file.type.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <VideoIcon className="w-6 h-6 text-gray-600" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1">
                  <p className="text-[8px] font-mono text-gray-400 text-center truncate">
                    {file.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 p-1 bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 hover:bg-red-500/80"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
            ))}
            {files.length === 0 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="col-span-4 border-2 border-dashed border-white/5 rounded-2xl h-24 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-white/10 hover:bg-white/[0.02] transition-all"
              >
                <ImageIcon className="w-6 h-6 text-gray-800" />
                <span className="text-[10px] font-bold text-gray-700">
                  Drop images or videos here
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Prompt Input Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Prompt
            </span>
            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <span className="text-[10px] text-gray-500 font-bold">
                Translate Prompt
              </span>
              <FormField
                control={form.control}
                name="translatePrompt"
                render={({ field }) => (
                  <FormItem>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="w-8 h-4 rounded-full bg-gray-800 appearance-none relative cursor-pointer checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-transform checked:after:translate-x-4"
                    />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="relative bg-[#111111] rounded-2xl border border-white/5 focus-within:border-white/10 transition-all overflow-hidden shadow-inner">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your vision..."
                      className="min-h-[140px] w-full bg-transparent border-none text-base text-gray-100 placeholder:text-gray-800 focus:ring-0 resize-none p-6 font-medium leading-relaxed"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="px-5 py-3 bg-white/2 flex items-center justify-between border-t border-white/5">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 group cursor-pointer">
                  <div className="text-[10px] font-black text-gray-500 group-hover:text-white transition-colors uppercase">
                    AI Optimizer
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-gray-600 font-mono font-bold tracking-tighter">
                  {form.watch("prompt").length} / 1500
                </span>
                <div className="flex items-center gap-3">
                  <Save className="w-4 h-4 text-gray-700 hover:text-white cursor-pointer transition-colors" />
                  <Trash2 className="w-4 h-4 text-gray-700 hover:text-red-500 cursor-pointer transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Settings Grid */}
        <div className="grid grid-cols-1 gap-6">
          <div className="flex items-center justify-between bg-white/2 p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 group cursor-help">
              <span className="text-xs font-bold text-gray-300">
                Native Audio
              </span>
              <HelpCircle className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
            </div>
            <FormField
              control={form.control}
              name="generateAudio"
              render={({ field }) => (
                <FormItem>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-9 h-4.5 rounded-full bg-gray-800 appearance-none relative cursor-pointer checked:bg-green-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-3.5 after:h-3.5 after:bg-white after:rounded-full after:transition-transform checked:after:translate-x-4.5"
                  />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center justify-between bg-white/2 p-4 rounded-xl border border-white/5">
            <span className="text-xs font-bold text-gray-300">Duration</span>
            <FormField
              control={form.control}
              name="videoLength"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-4">
                    {["4", "6", "8"].map((length) => (
                      <label
                        key={length}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="radio"
                          className="peer sr-only"
                          name="videoLength"
                          value={length}
                          checked={field.value === length}
                          onChange={() => field.onChange(length)}
                        />
                        <div className="w-4 h-4 rounded-full border border-gray-700 flex items-center justify-center peer-checked:border-blue-500 transition-all">
                          <div
                            className={`w-2 h-2 rounded-full bg-blue-500 transition-all ${field.value === length ? "scale-100" : "scale-0"}`}
                          />
                        </div>
                        <span
                          className={`text-xs font-bold ${field.value === length ? "text-white" : "text-gray-600 group-hover:text-gray-400"}`}
                        >
                          {length}s
                        </span>
                      </label>
                    ))}
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Resolution Selection */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Resolution
          </span>
          <FormField
            control={form.control}
            name="resolution"
            render={({ field }) => (
              <FormItem>
                <div className="flex p-1 bg-[#111111] rounded-xl gap-1 border border-white/5">
                  {["480p", "720p", "1080p"].map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => field.onChange(res)}
                      className={`flex-1 py-3 text-[10px] font-black rounded-lg transition-all ${
                        field.value === res
                          ? "bg-white/10 text-white shadow-lg"
                          : "text-gray-600 hover:text-gray-400 hover:bg-white/5"
                      }`}
                    >
                      {res.toUpperCase()}
                    </button>
                  ))}
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Aspect Ratio Display */}
        <div className="space-y-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center block">
            Aspect Ratio
          </span>
          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-7 gap-2">
                  {[
                    {
                      id: "auto",
                      label: "Auto",
                      icon: (
                        <div className="w-5 h-5 flex items-center justify-center border border-current rounded-full text-[8px] font-black">
                          A
                        </div>
                      ),
                    },
                    {
                      id: "1280x720",
                      label: "16:9",
                      icon: (
                        <div className="w-6 h-3 bg-current opacity-60 rounded-[1px]" />
                      ),
                    },
                    {
                      id: "720x1280",
                      label: "9:16",
                      icon: (
                        <div className="w-3 h-6 bg-current opacity-60 rounded-[1px]" />
                      ),
                    },
                    {
                      id: "1080x1080",
                      label: "1:1",
                      icon: (
                        <div className="w-4.5 h-4.5 bg-current opacity-60 rounded-[1px]" />
                      ),
                    },
                    {
                      id: "4:3",
                      label: "4:3",
                      icon: (
                        <div className="w-5.5 h-4 bg-current opacity-60 rounded-[1px]" />
                      ),
                    },
                    {
                      id: "3:4",
                      label: "3:4",
                      icon: (
                        <div className="w-4 h-5.5 bg-current opacity-60 rounded-[1px]" />
                      ),
                    },
                    {
                      id: "21:9",
                      label: "21:9",
                      icon: (
                        <div className="w-7 h-2.5 bg-current opacity-60 rounded-[1px]" />
                      ),
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => field.onChange(opt.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300 ${
                        field.value === opt.id
                          ? "bg-white/5 border-white/20 text-white shadow-lg"
                          : "bg-transparent border-transparent text-gray-700 hover:border-white/5 hover:text-gray-500"
                      }`}
                    >
                      <div className="mb-2 h-8 flex items-center justify-center">
                        {opt.icon}
                      </div>
                      <span className="text-[9px] font-black tracking-tighter uppercase">
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Generation Action */}
        <div className="pt-4">
          <Button
            type="submit"
            className="w-full h-16 bg-white text-black hover:bg-gray-200 font-black text-lg rounded-2xl transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>GENERATING Vision...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 fill-black" />
                <span>GENERATE VIDEO</span>
              </div>
            )}
          </Button>
        </div>

        {/* Powered By */}
        <div className="pt-2 text-center">
          <p className="text-[9px] font-black text-gray-800 tracking-[0.4em] uppercase">
            VEO STUDIO Engine v3.1
          </p>
        </div>
      </form>
    </Form>
  );
}
