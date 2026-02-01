"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { OctagonAlertIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

const formSchema = z
  .object({
    email: z.string().email({ message: "البريد الإلكتروني غير صحيح" }),
    name: z.string({ message: "الاسم مطلوب" }),
    password: z.string().min(1, { message: "كلمة المرور مطلوبة" }),
    confirmPassword: z.string().min(1, { message: "تأكيد كلمة المرور مطلوب" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
  });

export default function SignUpView() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setError(null);
    setPending(true);
    await authClient.signUp.email(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          setPending(false);
          router.push("/");
        },
        onError: ({ error }) => {
          setPending(false);
          setError(error?.message ?? "حدث خطأ غير متوقع");
        },
      },
    );
  };
  const onSocial = async (provider: "github" | "google") => {
    setError(null);
    setPending(true);
    await authClient.signIn.social(
      {
        provider: provider,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          setPending(false);
        },
        onError: ({ error }) => {
          setPending(false);
          setError(error?.message ?? "حدث خطأ غير متوقع");
        },
      },
    );
  };
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <Card className="overflow-hidden p-0 border-border/50">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form {...form}>
            <form
              action=""
              onSubmit={form.handleSubmit(onSubmit)}
              className="p-6 md:p-8 flex flex-col justify-center bg-card"
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold font-sans">لنبدأ رحلتك</h1>
                  <p className="text-muted-foreground text-balance">
                    أنشئ حساباً جديداً
                  </p>
                </div>
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="محمد أحمد"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="m@example.com"
                            className="text-left placeholder:text-right"
                            dir="ltr"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="*********"
                            type="password"
                            dir="ltr"
                            className="text-left"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تأكيد كلمة المرور</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="*********"
                            type="password"
                            dir="ltr"
                            className="text-left"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {!!error && (
                  <Alert className="bg-destructive/10 border-destructive/20">
                    <OctagonAlertIcon className="h-4 w-4 text-destructive me-2" />
                    <AlertTitle className="text-destructive">
                      {error}
                    </AlertTitle>
                  </Alert>
                )}

                <Button
                  disabled={pending}
                  type="submit"
                  className="w-full font-bold"
                >
                  {pending ? (
                    <div className="flex items-center gap-2">
                      <Spinner />
                      <span>جاري التسجيل...</span>
                    </div>
                  ) : (
                    <div>إنشاء حساب</div>
                  )}
                </Button>

                <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                  <span className="relative z-10 bg-card px-2 text-muted-foreground">
                    أو تابع باستخدام
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => onSocial("google")}
                    variant={"outline"}
                    type="button"
                    className="w-full gap-2"
                  >
                    <FaGoogle />
                    Google
                  </Button>
                  <Button
                    onClick={() => onSocial("github")}
                    variant={"outline"}
                    type="button"
                    className="w-full gap-2"
                  >
                    <FaGithub />
                    Github
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  لديك حساب بالفعل؟{" "}
                  <Link
                    href="/sign-in"
                    className="underline underline-offset-4 hover:text-primary transition-colors"
                  >
                    تسجيل الدخول
                  </Link>
                </div>
              </div>
            </form>
          </Form>

          {/* Right Side - Branding/Image */}
          <div className="relative hidden md:flex flex-col gap-y-4 items-center justify-center p-8 bg-gradient-to-br from-cyan-900 via-zinc-900 to-black text-white">
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="flex flex-col">
                <span className="text-xl font-black italic tracking-tighter text-white uppercase sm:text-2xl">
                  VEO <span className="text-cyan-400 italic">STUDIO</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                    Google Veo Engine
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-muted-foreground text-center text-xs text-balance hoverEffect space-x-1 space-x-reverse">
        <span>بالمتابعة، أنت توافق على</span>
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          شروط الخدمة
        </a>
        <span>و</span>
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          سياسة الخصوصية
        </a>
      </div>
    </div>
  );
}
