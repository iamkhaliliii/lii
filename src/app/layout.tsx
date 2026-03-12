import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

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
        className={`${geistSans.variable} ${vazirmatn.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
