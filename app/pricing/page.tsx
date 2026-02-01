import { PricingView } from "@/src/modules/subscriptions/ui/view/pricing-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "باقات الاشتراك",
  description:
    "اختر الباقة التي تناسب احتياجاتك. باقات مرنة لتوليد الفيديو بالذكاء الاصطناعي تبدأ من $9.99.",
};

export default function PricingPage() {
  return <PricingView />;
}
