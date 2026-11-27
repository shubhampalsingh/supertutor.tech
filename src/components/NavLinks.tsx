"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, Camera, Layers, ListChecks, MessagesSquare } from "lucide-react";

const LINKS = [
  { href: "/plan", label: "Study plans", icon: BookOpenCheck },
  { href: "/tutor", label: "Tutor", icon: MessagesSquare },
  { href: "/solve", label: "Solve", icon: Camera },
  { href: "/quiz", label: "Practice", icon: ListChecks },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <>
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = path === href || path.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
              active ? "bg-slate-100 text-ink" : "text-slate-600 hover:bg-slate-50 hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span className="hidden md:inline">{label}</span>
          </Link>
        );
      })}
    </>
  );
}
