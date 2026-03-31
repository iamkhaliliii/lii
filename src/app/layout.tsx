import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import UpdateBanner from "@/components/UpdateBanner";
import AuthGate from "@/components/AuthGate";
import SelectionSpeechToolbar from "@/components/SelectionSpeechToolbar";
import { ToastProvider } from "@/components/Toast";
import PwaRegistration from "@/components/PwaRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "lii — Professional English",
  description:
    "500-card professional English curriculum for meetings, reviews, and async work",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "lii",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${vazirmatn.variable} antialiased flex flex-col h-screen overflow-hidden`}
      >
        <ToastProvider>
          <PwaRegistration />
          <SelectionSpeechToolbar />
          <AuthGate>
            <UpdateBanner />
            {children}
          </AuthGate>
        </ToastProvider>
      </body>
    </html>
  );
}
