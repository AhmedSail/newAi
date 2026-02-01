export const dynamic = "force-dynamic";
import { Card } from "@/components/ui/card";
import React from "react";
import SignUpView from "@/src/modules/auth/ui/view/signUpView";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "إنشاء حساب",
  description: "انضم إلى Veo AI وابدأ في صناعة الفيديوهات بالذكاء الاصطناعي.",
};

const Signup = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!!session) {
    redirect("/");
  }
  return <SignUpView />;
};

export default Signup;
