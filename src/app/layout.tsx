import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import UpdateBanner from "@/components/UpdateBanner";
import AuthGate from "@/components/AuthGate";
import { ToastProvider } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "lii - Translation Assistant",
  description: "AI-powered English to Farsi translation assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body
        className={`${geistSans.variable} ${vazirmatn.variable} antialiased flex flex-col h-screen overflow-hidden`}
      >
        <ToastProvider>
          <AuthGate>
            <UpdateBanner />
            {children}
          </AuthGate>
        </ToastProvider>
      </body>
    </html>
  );
}
