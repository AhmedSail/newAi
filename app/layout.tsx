import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Veo AI | منصة توليد الفيديو بالذكاء الاصطناعي",
    template: "%s | Veo AI",
  },
  description:
    "اصنع فيديوهات احترافية وبجودة سينمائية باستخدام أحدث تقنيات الذكاء الاصطناعي Google Veo 3.1. حول النص والصورة إلى فيديو في ثوانٍ مع Veo AI.",
  keywords: [
    "AI Video Generator",
    "Google Veo",
    "Veo 3.1",
    "Text to Video",
    "Image to Video",
    "Veo AI",
    "توليد فيديو",
    "ذكاء اصطناعي",
    "صناعة محتوى",
    "فيديو سينمائي",
  ],
  authors: [{ name: "Veo AI Team" }],
  creator: "Veo AI",
  publisher: "Veo AI",
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: "https://orchida.ai",
    siteName: "Veo AI",
    title: "Veo AI | المستقبل في توليد الفيديو",
    description:
      "اكتشف قوة Google Veo 3.1 في توليد الفيديوهات. جودة 1080p، سرعة فائقة، وتحكم كامل في الإبداع.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Veo AI Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Veo AI | أطلق العنان لإبداعك",
    description:
      "منصة عربية رائدة لتوليد الفيديو بالذكاء الاصطناعي. جرب Veo 3.1 الآن.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
