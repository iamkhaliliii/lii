"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Hash, Languages, FileText, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/slack", label: "Slack", icon: Hash },
  { href: "/", label: "Translate", icon: Languages },
  { href: "/transcript", label: "Transcript", icon: FileText },
  { href: "/learning-hack", label: "Learning Hack", icon: Lightbulb },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="glass border-b border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2.5">
        <Link href="/" className="flex items-center gap-1.5">
          <img src="/app-icon.png" alt="lii" width={28} height={28} className="rounded-md" />
          <span className="text-lg font-bold text-foreground">lii</span>
        </Link>
        <div className="flex items-center gap-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-muted text-primary"
                    : "text-muted hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
