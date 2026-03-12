"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages, History, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/", label: "Translate", icon: Languages },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-primary">
          lii
        </Link>
        <div className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-accent text-primary"
                    : "text-muted hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          {user && (
            <div className="ml-2 flex items-center gap-2 border-l border-border pl-3">
              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="h-7 w-7 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <button
                onClick={logout}
                className="text-muted hover:text-foreground"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
