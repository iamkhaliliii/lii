"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center bg-background">
      <p className="text-sm text-muted">Redirecting to Chats…</p>
    </div>
  );
}
