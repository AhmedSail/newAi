"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import { useState } from "react";
import { createCheckoutUrl } from "../../server/actions";

interface PricingPlan {
  name: string;
  description: string;
  price: string;
  features: string[];
  variantId: string; // Lemon Squeezy Variant ID
  popular?: boolean;
}

const plans: PricingPlan[] = [
  {
    name: "باقة التجربة",
    description: "شراء لمرة واحدة لتجربة الخدمة.",
    price: "$9.99",
    features: [
      "300 نقطة (لمرة واحدة)",
      "تكفي لإنشاء 3-6 فيديوهات",
      "صالحة مدى الحياة",
      "جودة عالية 1080p",
      "وصول كامل للأدوات",
    ],
    variantId:
      process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_STARTER || "123",
  },
  {
    name: "الخطة الشهرية ",
    description: "اشتراك شهري للمستخدمين المحترفين.",
    price: "$29.99/شهر",
    features: [
      "1000 نقطة شهرياً",
      "تستخدم لتوليد الفيديوهات والصور",
      "دعم حصري لموديل Veo 3.1",
      "3 مهام متوازية في نفس الوقت",
      "جودة 1080P HD وبدون علامة مائية",
      "توليد فوري وبدون طوابير انتظار",
      "إنتاج فيديو بجودة سينمائية",
      "تحويل النص والصورة إلى فيديو",
    ],
    variantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_PRO || "456",
    popular: true,
  },
];

export const PricingView = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (variantId: string) => {
    try {
      setLoading(variantId);
      const url = await createCheckoutUrl(variantId);
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      // You might want to show a toast here
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-24 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-4">
          اختر باقتك الإبداعية
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          أطلق العنان لإمكانيات الذكاء الاصطناعي الكاملة في توليد الفيديو مع خطط
          أسعارنا المرنة.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`flex flex-col relative ${
              plan.popular
                ? "border-primary shadow-lg scale-105 z-10"
                : "border-border"
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-0 -mt-3 -ml-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                الأكثر طلباً
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="text-4xl font-bold mb-6">{plan.price}</div>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-sm">
                    <Check className="h-5 w-5 text-green-500 ml-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                size="lg"
                onClick={() => handleCheckout(plan.variantId)}
                disabled={!!loading}
              >
                {loading === plan.variantId
                  ? "جاري التحويل..."
                  : `اشترك في ${plan.name}`}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
