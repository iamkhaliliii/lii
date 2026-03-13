"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Settings, Users, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Chats", icon: MessageCircle },
  { href: "/slack", label: "Slack", icon: Hash },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="glass border-b border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2.5">
        <Link href="/" className="text-lg font-bold text-foreground">
          lii
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
