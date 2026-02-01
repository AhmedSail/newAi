export const dynamic = "force-dynamic";
import { Card } from "@/components/ui/card";
import React from "react";
import SignInView from "@/src/modules/auth/ui/view/signInView";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "سجل الدخول إلى حسابك في Veo AI",
};

const Signin = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!!session) {
    redirect("/");
  }
  return <SignInView />;
};

export default Signin;
