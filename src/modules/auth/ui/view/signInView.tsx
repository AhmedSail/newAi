"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { useState } from "react";
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
import { Alert, AlertTitle } from "@/components/ui/alert";
import { OctagonAlertIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

const formSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صحيح" }),
  password: z.string().min(1, { message: "كلمة المرور مطلوبة" }),
});

export default function SignInView() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setError(null);
    setPending(true);
    await authClient.signIn.email(
      { email: data.email, password: data.password, callbackURL: "/" },
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
          router.push("/");
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
      email: "",
      password: "",
    },
  });

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <Card className="overflow-hidden p-0 border-border/50">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="p-6 md:p-8 flex flex-col justify-center bg-card"
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold font-sans">
                    مرحباً بك مجدداً
                  </h1>
                  <p className="text-muted-foreground text-balance">
                    سجل الدخول للمتابعة إلى حسابك
                  </p>
                </div>
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="name@example.com"
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
                      <span>جاري الدخول...</span>
                    </div>
                  ) : (
                    <div>تسجيل الدخول</div>
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
                  ليس لديك حساب؟{" "}
                  <Link
                    href="/sign-up"
                    className="underline underline-offset-4 hover:text-primary transition-colors"
                  >
                    إنشاء حساب جديد
                  </Link>
                </div>
              </div>
            </form>
          </Form>

          {/* Right Side - Branding/Image */}
          <div className="relative hidden md:flex flex-col gap-y-4 items-center justify-center p-8 bg-gradient-to-br from-cyan-900 via-zinc-900 to-black text-white">
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <Image
                src="/logo.png"
                alt="Veo AI Logo"
                width={500}
                height={500}
                className="w-[500px] h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
              />
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
